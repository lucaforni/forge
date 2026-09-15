/**
 * tests/unit/backup.test.ts — Unit tests for installer/backup.ts
 */

import { describe, it, expect, afterEach } from "vitest"
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import {
  backupDirPath,
  backupFile,
  backupDriftedFiles,
  ensureBackupGitignore,
} from "../../installer/backup"
import type { DriftEntry } from "../../installer/drift"

const created: string[] = []
afterEach(() => {
  for (const dir of created.splice(0)) rmSync(dir, { recursive: true, force: true })
})

function makeProject(files: Record<string, string> = {}): string {
  const dir = mkdtempSync(join(tmpdir(), "forge-backup-test-"))
  created.push(dir)
  for (const [rel, content] of Object.entries(files)) {
    const full = join(dir, rel)
    mkdirSync(full.substring(0, full.lastIndexOf("/")), { recursive: true })
    writeFileSync(full, content, "utf-8")
  }
  return dir
}

function driftEntry(filePath: string, classification: DriftEntry["classification"]): DriftEntry {
  return { filePath, classification, expectedChecksum: "e", actualChecksum: "a" }
}

describe("backupDirPath", () => {
  it("builds a timestamped path under .forge/.backups", () => {
    const dir = makeProject()
    const p = backupDirPath(dir)
    expect(p.startsWith(join(dir, ".forge", ".backups"))).toBe(true)
    // YYYY-MM-DDTHH-mm-ss (colons/dots sanitized for filesystems)
    expect(p).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}$/)
  })
})

describe("backupFile", () => {
  it("copies the file preserving the relative path", () => {
    const dir = makeProject({ ".opencode/agents/x.md": "hello" })
    const backupRoot = join(dir, ".forge", ".backups", "t")
    const target = backupFile(join(dir, ".opencode/agents/x.md"), backupRoot, dir)
    expect(target).toBe(join(backupRoot, ".opencode/agents/x.md"))
    expect(readFileSync(target, "utf-8")).toBe("hello")
  })
})

describe("backupDriftedFiles", () => {
  it("returns empty result when nothing drifted", () => {
    const dir = makeProject({ "a.md": "x" })
    const res = backupDriftedFiles([driftEntry(join(dir, "a.md"), "unchanged")], dir)
    expect(res).toEqual({ backupPaths: [], backupRoot: "" })
  })

  it("backs up only drift-classified entries", () => {
    const dir = makeProject({ "drift.md": "new", "same.md": "same" })
    const res = backupDriftedFiles(
      [
        driftEntry(join(dir, "drift.md"), "drift"),
        driftEntry(join(dir, "same.md"), "unchanged"),
        driftEntry(join(dir, "missing.md"), "missing"),
      ],
      dir,
    )
    expect(res.backupPaths).toHaveLength(1)
    expect(res.backupPaths[0].startsWith(res.backupRoot)).toBe(true)
    expect(readFileSync(res.backupPaths[0], "utf-8")).toBe("new")
  })
})

describe("ensureBackupGitignore", () => {
  it("creates .forge/.gitignore with the pattern when missing", () => {
    const dir = makeProject()
    ensureBackupGitignore(dir)
    expect(readFileSync(join(dir, ".forge", ".gitignore"), "utf-8")).toBe(".backups/\n")
  })

  it("appends the pattern when absent and stays idempotent", () => {
    const dir = makeProject({ ".forge/.gitignore": "node_modules/\n" })
    ensureBackupGitignore(dir)
    const once = readFileSync(join(dir, ".forge", ".gitignore"), "utf-8")
    expect(once).toContain(".backups/")
    ensureBackupGitignore(dir)
    expect(readFileSync(join(dir, ".forge", ".gitignore"), "utf-8")).toBe(once)
  })

  it("leaves a file already containing the pattern untouched", () => {
    const dir = makeProject({ ".forge/.gitignore": "node_modules/\n.backups/\n" })
    ensureBackupGitignore(dir)
    expect(readFileSync(join(dir, ".forge", ".gitignore"), "utf-8")).toBe(
      "node_modules/\n.backups/\n",
    )
  })
})
