/**
 * tests/unit/detect.test.ts — Unit tests for installer/detect.ts
 */

import { describe, it, expect } from "vitest"
import { detectPlatforms, detectProjectState } from "../../installer/detect"
import { mkdtempSync, mkdirSync, rmSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"

const _tempDirs: string[] = []

function createTempProject(dirs: string[]): string {
  const tmpDir = mkdtempSync(join(tmpdir(), "forge-detect-test-"))
  _tempDirs.push(tmpDir)
  for (const dir of dirs) {
    mkdirSync(join(tmpDir, dir), { recursive: true })
  }
  return tmpDir
}

afterEach(() => {
  for (const dir of _tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true })
  }
})

describe("detectPlatforms", () => {
  it("detects OpenCode when .opencode/ exists", () => {
    const project = createTempProject([".opencode"])
    expect(detectPlatforms(project)).toEqual(["opencode"])
  })

  it("detects Claude Code when .claude/ exists", () => {
    const project = createTempProject([".claude"])
    expect(detectPlatforms(project)).toEqual(["claude-code"])
  })

  it("detects Codex when .codex/ exists", () => {
    const project = createTempProject([".codex"])
    expect(detectPlatforms(project)).toEqual(["codex"])
  })

  it("detects all three when all directories exist", () => {
    const project = createTempProject([".opencode", ".claude", ".codex"])
    expect(detectPlatforms(project)).toEqual(["opencode", "claude-code", "codex"])
  })

  it("returns empty array when no platform directories exist", () => {
    const project = createTempProject([])
    expect(detectPlatforms(project)).toEqual([])
  })

  it("detects multiple platforms", () => {
    const project = createTempProject([".opencode", ".codex"])
    expect(detectPlatforms(project)).toEqual(["opencode", "codex"])
  })
})

describe("detectProjectState", () => {
  it("detects existing FORGE install when .forge/ exists", () => {
    const project = createTempProject([".opencode", ".forge"])
    const state = detectProjectState(project)
    expect(state.hasExistingForgeInstall).toBe(true)
    expect(state.platforms).toContain("opencode")
  })

  it("reports no FORGE install when .forge/ is missing", () => {
    const project = createTempProject([".opencode"])
    const state = detectProjectState(project)
    expect(state.hasExistingForgeInstall).toBe(false)
  })

  it("returns found paths for detected platforms", () => {
    const project = createTempProject([".opencode", ".claude"])
    const state = detectProjectState(project)
    expect(state.foundPaths["opencode"]).toBeDefined()
    expect(state.foundPaths["claude-code"]).toBeDefined()
    expect(state.foundPaths["codex"]).toBeUndefined()
  })
})
