/**
 * tests/unit/drift.test.ts — Unit tests for installer/drift.ts
 */

import { describe, it, expect } from "vitest"
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { fileChecksum, detectDrift, hasDrift } from "../../installer/drift"
import type { InstallManifest } from "../../installer/types"

describe("fileChecksum", () => {
  it("returns SHA-256 checksum for a file", () => {
    const tmpDir = mkdtempSync(join(tmpdir(), "forge-checksum-"))
    const filePath = join(tmpDir, "test.txt")
    writeFileSync(filePath, "hello world", "utf-8")

    const hash = fileChecksum(filePath)
    // SHA-256 of "hello world"
    expect(hash).toBe("b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9")
    rmSync(tmpDir, { recursive: true, force: true })
  })

  it("returns null for non-existent file", () => {
    expect(fileChecksum("/nonexistent/path")).toBeNull()
  })
})

describe("detectDrift", () => {
  it("classifies unchanged files", () => {
    const tmpDir = mkdtempSync(join(tmpdir(), "forge-drift-unchanged-"))
    const filePath = join(tmpDir, "unchanged.txt")
    writeFileSync(filePath, "same content", "utf-8")

    const hash = fileChecksum(filePath)!
    const manifest: InstallManifest = {
      forgeVersion: "2.0.0",
      installedAt: new Date().toISOString(),
      platforms: ["opencode"],
      checksums: { [filePath]: hash },
      excludedPaths: [],
    }

    const result = detectDrift(manifest, [tmpDir])
    const unchanged = result.find((e) => e.filePath === filePath)
    expect(unchanged?.classification).toBe("unchanged")
    rmSync(tmpDir, { recursive: true, force: true })
  })

  it("classifies drifted (modified) files", () => {
    const tmpDir = mkdtempSync(join(tmpdir(), "forge-drift-changed-"))
    const filePath = join(tmpDir, "changed.txt")
    writeFileSync(filePath, "original", "utf-8")

    const manifest: InstallManifest = {
      forgeVersion: "2.0.0",
      installedAt: new Date().toISOString(),
      platforms: ["opencode"],
      checksums: { [filePath]: "0000000000000000000000000000000000000000000000000000000000000000" },
      excludedPaths: [],
    }

    const result = detectDrift(manifest, [tmpDir])
    const drifted = result.find((e) => e.filePath === filePath)
    expect(drifted?.classification).toBe("drift")
    rmSync(tmpDir, { recursive: true, force: true })
  })

  it("classifies missing files", () => {
    const manifest: InstallManifest = {
      forgeVersion: "2.0.0",
      installedAt: new Date().toISOString(),
      platforms: ["opencode"],
      checksums: { "/nonexistent/file.txt": "abc" },
      excludedPaths: [],
    }

    const result = detectDrift(manifest, [])
    expect(result.some((e) => e.classification === "missing")).toBe(true)
  })
})

describe("hasDrift", () => {
  it("returns false when all files match", () => {
    const tmpDir = mkdtempSync(join(tmpdir(), "forge-hasdrift-false-"))
    const filePath = join(tmpDir, "ok.txt")
    writeFileSync(filePath, "hello", "utf-8")

    const hash = fileChecksum(filePath)!
    const manifest: InstallManifest = {
      forgeVersion: "2.0.0",
      installedAt: new Date().toISOString(),
      platforms: ["opencode"],
      checksums: { [filePath]: hash },
      excludedPaths: [],
    }

    expect(hasDrift(manifest, [tmpDir])).toBe(false)
    rmSync(tmpDir, { recursive: true, force: true })
  })

  it("returns true when a file has changed", () => {
    const tmpDir = mkdtempSync(join(tmpdir(), "forge-hasdrift-true-"))
    const filePath = join(tmpDir, "changed.txt")
    writeFileSync(filePath, "changed content", "utf-8")

    const manifest: InstallManifest = {
      forgeVersion: "2.0.0",
      installedAt: new Date().toISOString(),
      platforms: ["opencode"],
      checksums: { [filePath]: "0000000000000000000000000000000000000000000000000000000000000000" },
      excludedPaths: [],
    }

    expect(hasDrift(manifest, [tmpDir])).toBe(true)
    rmSync(tmpDir, { recursive: true, force: true })
  })
})
