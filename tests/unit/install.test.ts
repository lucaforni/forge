/**
 * tests/unit/install.test.ts — Tests for the top-level install orchestrator.
 *
 * `installer/install.ts` is the only module that writes to a user's
 * filesystem, and it had no dedicated test. These cover the control-flow
 * branches — detection failure, check mode, dry run — that the contract
 * test's happy path never reaches.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { mkdtempSync, mkdirSync, rmSync, existsSync, readdirSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"

import { run, installMcpServerDeps } from "../../installer/install"

let target: string

beforeEach(() => {
  target = mkdtempSync(join(tmpdir(), "forge-install-"))
})
afterEach(() => rmSync(target, { recursive: true, force: true }))

describe("run — platform detection", () => {
  it("exits 2 and writes nothing when no platform directory exists", async () => {
    const result = await run({ targetRoot: target })

    expect(result.success).toBe(false)
    expect(result.exitCode).toBe(2)
    expect(result.installed).toEqual([])
    expect(result.backupPaths).toEqual([])
    // Nothing may be created before a platform is confirmed.
    expect(readdirSync(target)).toEqual([])
  })

  it("honours an explicit --platform override with no directory present", async () => {
    const result = await run({ targetRoot: target, platform: ["opencode"], dryRun: true })

    expect(result.success).toBe(true)
    expect(result.installed).toEqual(["opencode"])
  })

  it("detects multiple platforms and installs for each", async () => {
    mkdirSync(join(target, ".opencode"), { recursive: true })
    mkdirSync(join(target, ".claude"), { recursive: true })

    const result = await run({ targetRoot: target, dryRun: true })

    expect(result.installed).toContain("opencode")
    expect(result.installed).toContain("claude-code")
  })
})

describe("run — dry run", () => {
  it("reports success without creating any file", async () => {
    mkdirSync(join(target, ".opencode"), { recursive: true })

    const result = await run({ targetRoot: target, dryRun: true })

    expect(result.success).toBe(true)
    expect(result.exitCode).toBe(0)
    expect(existsSync(join(target, ".forge"))).toBe(false)
    expect(existsSync(join(target, "opencode.json"))).toBe(false)
    expect(existsSync(join(target, "AGENTS.md"))).toBe(false)
    expect(readdirSync(join(target, ".opencode"))).toEqual([])
  })

  it("leaves an existing config untouched", async () => {
    mkdirSync(join(target, ".opencode"), { recursive: true })
    const original = '{"theme":"dracula"}'
    writeFileSync(join(target, "opencode.json"), original, "utf-8")

    await run({ targetRoot: target, dryRun: true })

    expect(readdirSync(target)).toContain("opencode.json")
    expect(existsSync(join(target, ".forge"))).toBe(false)
  })
})

describe("run — check mode", () => {
  it("passes and writes nothing when the projection is coherent", async () => {
    mkdirSync(join(target, ".opencode"), { recursive: true })

    const result = await run({ targetRoot: target, check: true })

    expect(result.success).toBe(true)
    expect(result.exitCode).toBe(0)
    expect(existsSync(join(target, ".forge"))).toBe(false)
  })
})

describe("run — fresh install", () => {
  it("returns a manifest path and the platforms installed", async () => {
    mkdirSync(join(target, ".opencode"), { recursive: true })

    const result = await run({ targetRoot: target })

    expect(result.success).toBe(true)
    expect(result.exitCode).toBe(0)
    expect(result.installed).toEqual(["opencode"])
    expect(result.manifestPath).toBeDefined()
    expect(existsSync(result.manifestPath!)).toBe(true)
  }, 120_000)

  it("always populates backupPaths, even when nothing was backed up", async () => {
    // The field is non-optional on InstallResult; four early-return paths
    // used to omit it, so any caller reading `.length` would crash.
    mkdirSync(join(target, ".opencode"), { recursive: true })

    for (const opts of [
      { targetRoot: target, dryRun: true },
      { targetRoot: target, check: true },
    ]) {
      const result = await run(opts)
      expect(Array.isArray(result.backupPaths)).toBe(true)
    }
  })
})

describe("installMcpServerDeps", () => {
  it("is a no-op when the MCP server was not installed", () => {
    expect(() => installMcpServerDeps(target)).not.toThrow()
    expect(existsSync(join(target, ".forge", "mcp-server"))).toBe(false)
  })
})
