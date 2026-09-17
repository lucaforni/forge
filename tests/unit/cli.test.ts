/**
 * tests/unit/cli.test.ts — CLI argument parser tests.
 *
 * Unknown flags used to warn and continue, letting a typo'd value become
 * the install target (`--provider openai` installed into `./openai`).
 * The parser now fails loudly instead.
 */

import { describe, it, expect } from "vitest"
import { spawnSync, execFileSync } from "node:child_process"
import { mkdtempSync, readdirSync, rmSync } from "node:fs"
import { join, dirname } from "node:path"
import { tmpdir } from "node:os"
import { fileURLToPath } from "node:url"

import { parseArgs } from "../../install-forge"

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..")

const argv = (...args: string[]) => ["node", "install-forge.ts", ...args]

describe("parseArgs — happy paths", () => {
  it("accepts a bare target", () => {
    const r = parseArgs(argv("/tmp/x"))
    expect(r.errors).toEqual([])
    expect(r.targetRoot).toBe("/tmp/x")
  })

  it("accepts every documented flag", () => {
    const r = parseArgs(argv("/tmp/x", "--dry-run", "--check", "--interactive", "--force", "--verbose", "--update"))
    expect(r.errors).toEqual([])
    expect(r.options).toMatchObject({
      dryRun: true, check: true, interactive: true,
      force: true, verbose: true, update: true,
    })
  })

  it("accepts a single platform and several comma-separated ones", () => {
    expect(parseArgs(argv("--platform=opencode")).options.platform).toEqual(["opencode"])
    expect(parseArgs(argv("--platform=opencode,claude-code")).options.platform)
      .toEqual(["opencode", "claude-code"])
  })

  it("shows help without requiring anything else", () => {
    const r = parseArgs(argv("--help"))
    expect(r.showHelp).toBe(true)
    expect(r.errors).toEqual([])
  })
})

describe("parseArgs — usage errors (spec 006 #72)", () => {
  it("rejects an unknown flag instead of warning and continuing", () => {
    const r = parseArgs(argv("--provider", "openai", "/tmp/x"))
    expect(r.errors.length).toBeGreaterThan(0)
    expect(r.errors.join("\n")).toContain("--provider")
  })

  it("rejects a second positional instead of silently overriding the target", () => {
    // This is the exact `--provider openai` trap: the stray value used to
    // become the install target.
    const r = parseArgs(argv("openai", "/tmp/x"))
    expect(r.errors.join("\n")).toContain("openai")
    expect(r.targetRoot).toBe("openai")
  })

  it("rejects an unknown platform value", () => {
    const r = parseArgs(argv("--platform=bogus", "/tmp/x"))
    expect(r.errors.join("\n")).toContain("bogus")
    expect(r.options.platform).toBeUndefined()
  })

  it("rejects a mixed valid/invalid platform list wholesale", () => {
    const r = parseArgs(argv("--platform=opencode,bogus"))
    expect(r.errors.length).toBeGreaterThan(0)
    expect(r.options.platform).toBeUndefined()
  })

  it("rejects a single-dash typo rather than treating it as a path", () => {
    const r = parseArgs(argv("-dry-run"))
    expect(r.errors.length).toBeGreaterThan(0)
    expect(r.targetRoot).toBeUndefined()
  })

  it("rejects an empty --platform value", () => {
    // Must not produce `platform: []`, which would silently install nowhere.
    const r = parseArgs(argv("--platform="))
    expect(r.errors.length).toBeGreaterThan(0)
    expect(r.options.platform).toBeUndefined()
  })
})

describe("AC-5 end to end — the original --provider trap", () => {
  it("exits 4 and writes nothing, via a real process", () => {
    // parseArgs unit tests prove the errors are produced; this proves the
    // process actually refuses to run and leaves the target untouched.
    const target = mkdtempSync(join(tmpdir(), "forge-ac5-"))
    try {
      const proc = spawnSync(
        process.execPath,
        ["--import", "tsx", join(REPO_ROOT, "install-forge.ts"), "--provider", "openai", target],
        { cwd: REPO_ROOT, encoding: "utf-8", timeout: 60_000 },
      )
      expect(proc.status).toBe(4)
      expect(proc.stderr).toContain("Unknown option")
      expect(readdirSync(target)).toEqual([])
    } finally {
      rmSync(target, { recursive: true, force: true })
    }
  }, 90_000)
})

describe("module side effects (regression)", () => {
  it("importing the shim never executes the installer", async () => {
    // cli.test.ts itself imports ../../install-forge for parseArgs. Before
    // the entry-point guard, that import ran main() with the test runner's
    // argv: target defaulted to the process cwd, and a full install —
    // including a merge of the repo's own opencode.json — ran inside every
    // suite execution. If this regresses, the markers below reappear.
    const { existsSync } = await import("node:fs")
    const { join } = await import("node:path")
    const { fileURLToPath } = await import("node:url")
    const root = join(fileURLToPath(import.meta.url), "..", "..", "..")

    expect(existsSync(join(root, ".forge", ".install-manifest.json"))).toBe(false)
    expect(existsSync(join(root, ".forge", "docs"))).toBe(false)
    expect(existsSync(join(root, ".forge", "templates"))).toBe(false)
    expect(existsSync(join(root, ".forge", "frontend"))).toBe(false)

    // The import-time install also rewrote the repo's own opencode.json:
    // the JSON round-trip strips its // comments. Their presence proves no
    // merge happened.
    const { readFileSync } = await import("node:fs")
    const repoConfig = readFileSync(join(root, "opencode.json"), "utf-8")
    expect(repoConfig).toContain("// FORGE")
  })
})
