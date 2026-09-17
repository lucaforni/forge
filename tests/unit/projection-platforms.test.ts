/**
 * tests/unit/projection-platforms.test.ts — Platform projection tests.
 *
 * Byte-copying OpenCode artifacts onto Claude Code and Codex shipped keys
 * those platforms do not understand while omitting keys they require
 * (Claude agents without `name:`, commands with dead `agent:` routing,
 * Codex skills under `.codex/.agents/`). These tests pin the translated
 * output per platform, using the real shipped files as fixtures.
 */

import { describe, it, expect } from "vitest"
import { mkdtempSync, mkdirSync, rmSync, existsSync, readFileSync, writeFileSync } from "node:fs"
import { createHash } from "node:crypto"
import { join, resolve, dirname } from "node:path"
import { tmpdir } from "node:os"
import { fileURLToPath } from "node:url"

import { buildInstallPlan } from "../../installer/projection"
import { projectClaudeArtifact } from "../../installer/platforms/claude-code"
import { projectCodexArtifact, generateCodexAgentToml } from "../../installer/platforms/codex"
import { OPENCODE_DESCRIPTOR } from "../../installer/platforms/opencode"
import { CLAUDE_CODE_DESCRIPTOR } from "../../installer/platforms/claude-code"
import { CODEX_DESCRIPTOR } from "../../installer/platforms/codex"
import type { Platform, PlatformDescriptor, CanonicalArtifact } from "../../installer/types"

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..")

const DESCRIPTORS: Record<Platform, PlatformDescriptor> = {
  "opencode": OPENCODE_DESCRIPTOR,
  "claude-code": CLAUDE_CODE_DESCRIPTOR,
  "codex": CODEX_DESCRIPTOR,
}

function readSource(rel: string): string {
  return readFileSync(join(REPO_ROOT, ".opencode", rel), "utf-8")
}

function artifact(category: CanonicalArtifact["category"], sourcePath: string, content?: string): CanonicalArtifact {
  const body = content ?? readSource(sourcePath)
  return { category, sourcePath, targetPath: sourcePath, content: body, checksum: `test-${sourcePath}` }
}

function installInto(target: string, platforms: Platform[]): void {
  const plan = buildInstallPlan(platforms, DESCRIPTORS, REPO_ROOT, target)
  for (const dir of plan.requiredDirectories) mkdirSync(dir, { recursive: true })
  for (const op of plan.operations) {
    if (op.kind === "skip" || op.content === undefined) continue
    mkdirSync(dirname(op.targetPath), { recursive: true })
    writeFileSync(op.targetPath, op.content, "utf-8")
  }
}

// ---------------------------------------------------------------------------

describe("Claude agent projection", () => {
  it("gives every agent name: + description: and drops OpenCode keys", () => {
    const out = projectClaudeArtifact(artifact("agent", "agents/forge-reviewer.md"))
    expect(out.relTarget).toBe("agents/forge-reviewer.md")
    expect(out.content).toContain("name: forge-reviewer")
    expect(out.content).toContain("description:")
    expect(out.content).not.toContain("mode:")
    expect(out.content).not.toContain("variant:")
    expect(out.content).not.toContain("permission:")
  })

  it("maps the permission allowlist to Claude tools", () => {
    const out = projectClaudeArtifact(artifact("agent", "agents/forge-reviewer.md"))
    expect(out.content).toMatch(/^tools: Read, Glob, Grep, Skill, Bash$/m)
  })

  it("records inexpressible restrictions in a NOTE instead of dropping them silently", () => {
    // The reviewer restricts bash to git/npm commands and denies the rest —
    // frontmatter tools: cannot express that.
    const out = projectClaudeArtifact(artifact("agent", "agents/forge-reviewer.md"))
    expect(out.content).toContain("# NOTE:")
    expect(out.content).toContain("deny")
  })

  it("keeps the agent body verbatim", () => {
    const src = readSource("agents/forge-reviewer.md")
    const out = projectClaudeArtifact(artifact("agent", "agents/forge-reviewer.md"))
    const srcBody = src.slice(src.indexOf("---", 3) + 3)
    expect(out.content).toContain(srcBody.trim().slice(0, 80))
  })
})

describe("Claude command projection", () => {
  it("drops agent:/subtask: and injects an explicit Task routing step", () => {
    const out = projectClaudeArtifact(artifact("command", "commands/forge-specify.md"))
    expect(out.content).not.toMatch(/^agent:/m)
    expect(out.content).not.toContain("subtask:")
    expect(out.content).toContain("Task tool")
    expect(out.content).toContain("`forge-pm`")
    expect(out.content).toContain(".claude/agents/")
  })

  it("places the routing step right after the title", () => {
    const out = projectClaudeArtifact(artifact("command", "commands/forge-specify.md"))
    const lines = out.content.split("\n")
    const titleIdx = lines.findIndex((l) => l.startsWith("# "))
    expect(lines.slice(titleIdx + 1, titleIdx + 3).join("\n")).toContain("**Execution:**")
  })

  it("leaves commands without routing alone apart from key drops", () => {
    // forge-review.md has no agent: key — nothing to inject.
    const out = projectClaudeArtifact(artifact("command", "commands/forge-review.md"))
    expect(out.content).not.toContain("subtask:")
    expect(out.content).not.toContain("**Execution:**")
  })
})

describe("Claude skill projection", () => {
  it("drops the false compatibility claim and keeps the rest", () => {
    const out = projectClaudeArtifact(artifact("skill", "skills/context-chain/SKILL.md"))
    expect(out.content).not.toContain("compatibility:")
    expect(out.content).toContain("name: context-chain")
  })
})

describe("Codex skill projection", () => {
  it("marks skills project-root-relative so they escape .codex/", () => {
    const [out] = projectCodexArtifact(artifact("skill", "skills/context-chain/SKILL.md"))
    expect(out.relTarget.startsWith("/")).toBe(true)
    expect(out.relTarget).toBe("/.agents/skills/context-chain/SKILL.md")
  })
})

describe("Codex agent projection", () => {
  it("emits native TOML plus a frontmatter-free Markdown companion", () => {
    const outs = projectCodexArtifact(artifact("agent", "agents/forge-pm.md"))
    expect(outs).toHaveLength(2)

    const toml = outs.find((o) => o.relTarget.endsWith(".toml"))!
    const md = outs.find((o) => o.relTarget.endsWith(".md"))!
    expect(toml.relTarget).toBe("agents/forge-pm.toml")
    expect(md.relTarget).toBe("agents/forge-pm.md")

    expect(toml.content).toContain('name = "forge-pm"')
    expect(toml.content).toContain("description = ")
    expect(toml.content).toContain('system_prompt = { path = ".codex/agents/forge-pm.md" }')
    expect(md.content).not.toContain("---")
    expect(md.content).toContain("forge-pm")
  })

  it("generateCodexAgentToml escapes hostile input", () => {
    const out = generateCodexAgentToml('a"b\\c', "d\ne")
    expect(out).toContain('name = "a\\"b\\\\c"')
    expect(out).toContain('"d\\ne"')
  })
})

describe("Codex command projection", () => {
  it("strips routing with a neutral note instead of inventing a mechanism", () => {
    const out = projectCodexArtifact(artifact("command", "commands/forge-specify.md"))
    expect(out).toHaveLength(1)
    expect(out[0].content).not.toMatch(/^agent:/m)
    expect(out[0].content).toContain("runs inline")
    expect(out[0].content).not.toContain("Task tool")
  })

  it("keeps $ARGUMENTS untouched", () => {
    const src = readSource("commands/forge-specify.md")
    const [out] = projectCodexArtifact(artifact("command", "commands/forge-specify.md"))
    if (src.includes("$ARGUMENTS")) expect(out.content).toContain("$ARGUMENTS")
  })
})

describe("OpenCode projection stays byte-identical", () => {
  it("installs agents, commands and skills unchanged", () => {
    const target = mkdtempSync(join(tmpdir(), "forge-oc-ident-"))
    try {
      mkdirSync(join(target, ".opencode"), { recursive: true })
      installInto(target, ["opencode"])
      for (const rel of ["agents/forge.md", "commands/forge-review.md", "skills/context-chain/SKILL.md"]) {
        expect(readFileSync(join(target, ".opencode", rel), "utf-8")).toBe(readSource(rel))
      }
    } finally {
      rmSync(target, { recursive: true, force: true })
    }
  })
})

describe("installed Claude project", () => {
  it("has valid agents, routed commands and no OpenCode keys", () => {
    const target = mkdtempSync(join(tmpdir(), "forge-claude-proj-"))
    try {
      mkdirSync(join(target, ".claude"), { recursive: true })
      installInto(target, ["claude-code"])

      const agent = readFileSync(join(target, ".claude/agents/forge-pm.md"), "utf-8")
      expect(agent).toMatch(/^name: forge-pm$/m)
      expect(agent).not.toContain("mode:")
      expect(agent).not.toContain("permission:")

      const cmd = readFileSync(join(target, ".claude/commands/forge-specify.md"), "utf-8")
      expect(cmd).toContain("Task tool")
    } finally {
      rmSync(target, { recursive: true, force: true })
    }
  })
})

describe("installed Codex project", () => {
  it("puts skills at the project root, never under .codex/", () => {
    // THE #70 regression test: the join used to defeat the mapping and
    // produce .codex/.agents/skills/.
    const target = mkdtempSync(join(tmpdir(), "forge-codex-proj-"))
    try {
      mkdirSync(join(target, ".codex"), { recursive: true })
      installInto(target, ["codex"])

      expect(existsSync(join(target, ".agents/skills/context-chain/SKILL.md"))).toBe(true)
      expect(existsSync(join(target, ".codex/.agents"))).toBe(false)
      expect(existsSync(join(target, ".codex/skills"))).toBe(false)
    } finally {
      rmSync(target, { recursive: true, force: true })
    }
  })

  it("installs native agent TOML next to clean Markdown", () => {
    const target = mkdtempSync(join(tmpdir(), "forge-codex-toml-"))
    try {
      mkdirSync(join(target, ".codex"), { recursive: true })
      installInto(target, ["codex"])

      const toml = readFileSync(join(target, ".codex/agents/forge-pm.toml"), "utf-8")
      expect(toml).toContain('name = "forge-pm"')
      const md = readFileSync(join(target, ".codex/agents/forge-pm.md"), "utf-8")
      expect(md).not.toContain("mode:")
    } finally {
      rmSync(target, { recursive: true, force: true })
    }
  })

  it("a second install writes nothing (projected checksums are stable)", () => {
    // Transformed content must checksum the projection, not the source —
    // otherwise every re-install sees phantom drift and rewrites everything.
    const target = mkdtempSync(join(tmpdir(), "forge-codex-idem-"))
    try {
      mkdirSync(join(target, ".codex"), { recursive: true })
      const first = buildInstallPlan(["codex"], DESCRIPTORS, REPO_ROOT, target)

      // Materialise exactly what the first plan prescribes, then feed the
      // resulting checksums back as the manifest would.
      const checksums: Record<string, string> = {}
      for (const op of first.operations) {
        if ((op.kind === "create" || op.kind === "update") && op.content !== undefined) {
          mkdirSync(dirname(op.targetPath), { recursive: true })
          writeFileSync(op.targetPath, op.content, "utf-8")
          checksums[op.targetPath] = createHash("sha256").update(op.content, "utf-8").digest("hex")
        }
      }

      const second = buildInstallPlan(["codex"], DESCRIPTORS, REPO_ROOT, target, checksums)
      const writes = second.operations.filter((o) => o.kind === "create" || o.kind === "update")
      expect(writes).toEqual([])
    } finally {
      rmSync(target, { recursive: true, force: true })
    }
  })
})
