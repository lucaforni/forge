/**
 * tests/unit/projection.test.ts — Unit tests for installer/projection.ts
 */

import { describe, it, expect } from "vitest"
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { catalogCanonicalArtifacts, catalogForgeArtifacts, buildInstallPlan } from "../../installer/projection"
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

describe("catalogForgeArtifacts", () => {
  it("returns empty array when neither mcp-server/ nor frontend/ exist", () => {
    const tmpDir = mkdtempSync(join(tmpdir(), "forge-no-forge-artifacts-"))
    const artifacts = catalogForgeArtifacts(tmpDir)
    expect(artifacts).toEqual([])
    rmSync(tmpDir, { recursive: true, force: true })
  })

  it("catalogs mcp-server artifacts with .forge/mcp-server/ target path", () => {
    const tmpDir = mkdtempSync(join(tmpdir(), "forge-mcp-test-"))
    mkdirSync(join(tmpDir, "mcp-server", "src"), { recursive: true })
    writeFileSync(join(tmpDir, "mcp-server", "index.ts"), "export {}", "utf-8")

    const artifacts = catalogForgeArtifacts(tmpDir)
    expect(artifacts.length).toBe(1)
    expect(artifacts[0].sourcePath).toBe(join("mcp-server", "index.ts"))
    expect(artifacts[0].targetPath).toBe(join(".forge", "mcp-server", "index.ts"))

    rmSync(tmpDir, { recursive: true, force: true })
  })

  it("catalogs frontend artifacts with .forge/frontend/ target path", () => {
    const tmpDir = mkdtempSync(join(tmpdir(), "forge-frontend-test-"))
    mkdirSync(join(tmpDir, "frontend", "patterns"), { recursive: true })
    writeFileSync(join(tmpDir, "frontend", "stack-decisions.md"), "# Stack", "utf-8")
    writeFileSync(join(tmpDir, "frontend", "patterns", "index.md"), "# Patterns", "utf-8")

    const artifacts = catalogForgeArtifacts(tmpDir)
    expect(artifacts.length).toBe(2)

    const stackDecisions = artifacts.find((a) => a.sourcePath === join("frontend", "stack-decisions.md"))
    expect(stackDecisions).toBeDefined()
    expect(stackDecisions!.targetPath).toBe(join(".forge", "frontend", "stack-decisions.md"))
    expect(stackDecisions!.category).toBe("user-template")

    const patternIndex = artifacts.find((a) => a.sourcePath === join("frontend", "patterns", "index.md"))
    expect(patternIndex).toBeDefined()
    expect(patternIndex!.targetPath).toBe(join(".forge", "frontend", "patterns", "index.md"))
    expect(patternIndex!.category).toBe("config")

    rmSync(tmpDir, { recursive: true, force: true })
  })

  it("skips DISTRIBUTE.md from frontend artifacts", () => {
    const tmpDir = mkdtempSync(join(tmpdir(), "forge-distribute-test-"))
    mkdirSync(join(tmpDir, "frontend"), { recursive: true })
    writeFileSync(join(tmpDir, "frontend", "DISTRIBUTE.md"), "# Docs", "utf-8")
    writeFileSync(join(tmpDir, "frontend", "qa-checklist-template.md"), "# QA", "utf-8")

    const artifacts = catalogForgeArtifacts(tmpDir)
    expect(artifacts.every((a) => !a.sourcePath.endsWith("DISTRIBUTE.md"))).toBe(true)
    expect(artifacts.length).toBe(1)

    rmSync(tmpDir, { recursive: true, force: true })
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
    // Platform artifacts all have platform: "opencode" (no forge artifacts in this source)
    expect(plan.operations.every((o) => o.platform === "opencode")).toBe(true)

    rmSync(src, { recursive: true, force: true })
    rmSync(target, { recursive: true, force: true })
  })

  it("forge artifacts go to .forge/ not to platform rootDir", () => {
    const src = mkdtempSync(join(tmpdir(), "forge-plan-src-"))
    mkdirSync(join(src, "mcp-server"), { recursive: true })
    writeFileSync(join(src, "mcp-server", "index.ts"), "export {}", "utf-8")

    const target = mkdtempSync(join(tmpdir(), "forge-plan-target-"))
    mkdirSync(join(target, ".opencode"), { recursive: true })

    const plan = buildInstallPlan(
      ["opencode"],
      { opencode: OPENCODE_DESCRIPTOR },
      src,
      target,
    )

    const mcpOp = plan.operations.find((o) => o.targetPath.includes("mcp-server"))
    expect(mcpOp).toBeDefined()
    expect(mcpOp!.platform).toBe("forge")
    // Must land in .forge/mcp-server/, NOT in .opencode/mcp-server/
    expect(mcpOp!.targetPath).toContain(join(".forge", "mcp-server"))
    expect(mcpOp!.targetPath).not.toContain(join(".opencode", "mcp-server"))

    rmSync(src, { recursive: true, force: true })
    rmSync(target, { recursive: true, force: true })
  })

  it("user-template files are skipped if they already exist", () => {
    const src = mkdtempSync(join(tmpdir(), "forge-plan-src-"))
    mkdirSync(join(src, "frontend"), { recursive: true })
    writeFileSync(join(src, "frontend", "stack-decisions.md"), "# Stack source", "utf-8")

    const target = mkdtempSync(join(tmpdir(), "forge-plan-target-"))
    mkdirSync(join(target, ".opencode"), { recursive: true })
    mkdirSync(join(target, ".forge", "frontend"), { recursive: true })
    // Pre-existing user-customized version
    writeFileSync(join(target, ".forge", "frontend", "stack-decisions.md"), "# My custom stack", "utf-8")

    const plan = buildInstallPlan(
      ["opencode"],
      { opencode: OPENCODE_DESCRIPTOR },
      src,
      target,
    )

    const stackOp = plan.operations.find((o) => o.targetPath.includes("stack-decisions.md"))
    expect(stackOp).toBeDefined()
    expect(stackOp!.kind).toBe("skip")
    expect(stackOp!.reason).toBe("user-owned template")

    rmSync(src, { recursive: true, force: true })
    rmSync(target, { recursive: true, force: true })
  })
})
