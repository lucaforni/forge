/**
 * tests/unit/projection.test.ts — Unit tests for installer/projection.ts
 */

import { describe, it, expect } from "vitest"
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { catalogCanonicalArtifacts, buildInstallPlan } from "../../installer/projection"
import { OPENCODE_DESCRIPTOR } from "../../installer/platforms/opencode"

function createForgeSource(artifacts: Record<string, string>): string {
  const tmpDir = mkdtempSync(join(tmpdir(), "forge-projection-test-"))
  const opencodeDir = join(tmpDir, ".opencode")
  mkdirSync(join(opencodeDir, "agents"), { recursive: true })
  mkdirSync(join(opencodeDir, "commands"), { recursive: true })
  mkdirSync(join(opencodeDir, "skills", "test-skill"), { recursive: true })

  for (const [relPath, content] of Object.entries(artifacts)) {
    const fullPath = join(opencodeDir, relPath)
    const dir = fullPath.substring(0, fullPath.lastIndexOf("/"))
    if (!dirExists(dir)) mkdirSync(dir, { recursive: true })
    writeFileSync(fullPath, content, "utf-8")
  }

  return tmpDir
}

function dirExists(p: string): boolean {
  try { return require("fs").statSync(p).isDirectory() } catch { return false }
}

describe("catalogCanonicalArtifacts", () => {
  it("returns empty array when .opencode/ does not exist", () => {
    const tmpDir = mkdtempSync(join(tmpdir(), "forge-no-opencode-"))
    const artifacts = catalogCanonicalArtifacts(tmpDir)
    expect(artifacts).toEqual([])
    rmSync(tmpDir, { recursive: true, force: true })
  })

  it("catalogs agent files", () => {
    const src = createForgeSource({
      "agents/forge-pm.md": "---\nname: forge-pm\n---\nYou are forge-pm.",
    })
    const artifacts = catalogCanonicalArtifacts(src)
    const agents = artifacts.filter((a) => a.category === "agent")
    expect(agents.length).toBe(1)
    expect(agents[0].sourcePath).toBe("agents/forge-pm.md")
    expect(agents[0].checksum).toBeTruthy()
    rmSync(src, { recursive: true, force: true })
  })

  it("catalogs command files", () => {
    const src = createForgeSource({
      "commands/forge-specify.md": "---\ndescription: Create spec\n---\n# Spec",
    })
    const artifacts = catalogCanonicalArtifacts(src)
    const commands = artifacts.filter((a) => a.category === "command")
    expect(commands.length).toBe(1)
    expect(commands[0].sourcePath).toBe("commands/forge-specify.md")
    rmSync(src, { recursive: true, force: true })
  })

  it("catalogs skill files", () => {
    const src = createForgeSource({
      "skills/test-skill/SKILL.md": "---\nname: test-skill\n---\n# Test",
    })
    const artifacts = catalogCanonicalArtifacts(src)
    const skills = artifacts.filter((a) => a.category === "skill")
    expect(skills.length).toBe(1)
    expect(skills[0].sourcePath).toBe("skills/test-skill/SKILL.md")
    rmSync(src, { recursive: true, force: true })
  })
})

describe("buildInstallPlan", () => {
  it("creates operations for detected platform", () => {
    const src = createForgeSource({
      "agents/forge-pm.md": "agent content",
    })
    const target = mkdtempSync(join(tmpdir(), "forge-plan-target-"))
    mkdirSync(join(target, ".opencode"), { recursive: true })

    const plan = buildInstallPlan(
      ["opencode"],
      { opencode: OPENCODE_DESCRIPTOR },
      src,
      target,
    )

    expect(plan.platforms).toEqual(["opencode"])
    expect(plan.operations.length).toBeGreaterThan(0)
    expect(plan.operations.every((o) => o.platform === "opencode")).toBe(true)

    rmSync(src, { recursive: true, force: true })
    rmSync(target, { recursive: true, force: true })
  })
})
