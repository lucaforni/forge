/**
 * tests/unit/contract.test.ts — Installer contract test.
 *
 * The premise: **everything a shipped artifact references must exist after
 * installation.** Before spec 004 the installer projected 3 of the 7
 * directories its own agents depended on, and 12 of 24 commands pointed at
 * a template path that no user project could ever contain.
 *
 * Documentation cannot enforce that invariant — this test can. It installs
 * the real FORGE repository into a temporary project and asserts the
 * resulting tree against what the artifacts actually ask for.
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest"
import {
  mkdtempSync, mkdirSync, rmSync, existsSync, readFileSync, writeFileSync,
  openSync, closeSync, fstatSync, readSync,
} from "node:fs"
import { createHash } from "node:crypto"
import { join, resolve, dirname } from "node:path"
import { tmpdir } from "node:os"
import { fileURLToPath } from "node:url"

import { buildInstallPlan, catalogCanonicalArtifacts, catalogForgeArtifacts } from "../../installer/projection"
import { run } from "../../installer/install"
import { OPENCODE_DESCRIPTOR } from "../../installer/platforms/opencode"
import { CLAUDE_CODE_DESCRIPTOR } from "../../installer/platforms/claude-code"
import { CODEX_DESCRIPTOR } from "../../installer/platforms/codex"
import type { Platform, PlatformDescriptor, InstallPlan } from "../../installer/types"

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..")

const DESCRIPTORS: Record<Platform, PlatformDescriptor> = {
  "opencode": OPENCODE_DESCRIPTOR,
  "claude-code": CLAUDE_CODE_DESCRIPTOR,
  "codex": CODEX_DESCRIPTOR,
}

// ---------------------------------------------------------------------------
// Harness — materialise an install plan on disk without invoking the CLI
// ---------------------------------------------------------------------------

function materialise(plan: InstallPlan): void {
  for (const dir of plan.requiredDirectories) {
    mkdirSync(dir, { recursive: true })
  }
  for (const op of plan.operations) {
    if (op.kind === "skip") continue
    if (op.content === undefined) continue
    mkdirSync(dirname(op.targetPath), { recursive: true })
    writeFileSync(op.targetPath, op.content, "utf-8")
  }
}

function installInto(target: string, platforms: Platform[] = ["opencode"]): InstallPlan {
  const plan = buildInstallPlan(platforms, DESCRIPTORS, REPO_ROOT, target)
  materialise(plan)
  return plan
}

// ---------------------------------------------------------------------------

describe("installer contract — fresh OpenCode install", () => {
  let target: string

  beforeAll(() => {
    target = mkdtempSync(join(tmpdir(), "forge-contract-"))
    mkdirSync(join(target, ".opencode"), { recursive: true })
    installInto(target)
  })

  afterAll(() => rmSync(target, { recursive: true, force: true }))

  it("installs agents, commands and skills", () => {
    expect(existsSync(join(target, ".opencode/agents/forge.md"))).toBe(true)
    expect(existsSync(join(target, ".opencode/commands/forge-specify.md"))).toBe(true)
    expect(existsSync(join(target, ".opencode/skills/context-chain/SKILL.md"))).toBe(true)
  })

  it("installs every document template the commands reference", () => {
    // These are the templates named by shipped commands and agents. Before
    // spec 004 none of them were installed, so 12 commands were inert.
    const required = [
      "spec.md", "plan.md", "tasks.md", "prd.md", "adr.md", "story.md",
      "tech-spec.md", "product-brief.md", "constitution.md",
      "architecture.md", "design-spec.md", "user-journey.md",
      "decision-log.md", "decision-log-entry-template.md",
      "sprint-status.yaml", "sprint-sequence.yaml",
    ]
    for (const t of required) {
      expect(
        existsSync(join(target, ".forge/templates", t)),
        `.forge/templates/${t} missing — a command references it`,
      ).toBe(true)
    }
  })

  it("installs user-facing docs but not internal engineering reports", () => {
    expect(existsSync(join(target, ".forge/docs/FORGE-GUIDE.md"))).toBe(true)
    expect(existsSync(join(target, ".forge/docs/knowledge-management.md"))).toBe(true)

    // Meta-development content must never be distributed (Art. 2.3 / 4.3).
    for (const excluded of [
      "pre-flight-checks-implementation.md",
      "decision-log-archiviation-implementation.md",
      "automatic-monitoring-setup.md",
    ]) {
      expect(
        existsSync(join(target, ".forge/docs", excluded)),
        `${excluded} is meta-development content and must not be distributed`,
      ).toBe(false)
    }
  })

  it("does not distribute the installer's own config templates", () => {
    // The installer generates opencode.json; shipping a template copy would
    // give users two competing sources of truth.
    expect(existsSync(join(target, ".forge/templates/opencode.json"))).toBe(false)
    expect(existsSync(join(target, ".forge/templates/presets.json"))).toBe(false)
  })

  it("scaffolds the .forge/ working tree", () => {
    for (const dir of [
      "specs", "knowledge/adr", "epics", "product",
      "sprints/active", "sprints/completed", "sprints/retrospectives",
    ]) {
      expect(existsSync(join(target, ".forge", dir)), `.forge/${dir} missing`).toBe(true)
    }
  })

  it("creates the constitution and project instructions", () => {
    expect(existsSync(join(target, ".forge/constitution.md"))).toBe(true)
    expect(existsSync(join(target, ".forge/knowledge/decision-log.md"))).toBe(true)
    expect(existsSync(join(target, "AGENTS.md"))).toBe(true)
  })

  it("installs the shared MCP server and the frontend pattern library", () => {
    expect(existsSync(join(target, ".forge/mcp-server/index.ts"))).toBe(true)
    expect(existsSync(join(target, ".forge/mcp-server/package.json"))).toBe(true)
    expect(existsSync(join(target, ".forge/frontend/patterns/index.md"))).toBe(true)
    expect(existsSync(join(target, ".forge/frontend/design-system.md"))).toBe(true)
  })

  it("installs OpenCode plugins with their package manifest", () => {
    expect(existsSync(join(target, ".opencode/plugins/session-knowledge.ts"))).toBe(true)
    expect(existsSync(join(target, ".opencode/plugins/spec-watcher.ts"))).toBe(true)
    expect(existsSync(join(target, ".opencode/plugins/pre-commit-gate.ts"))).toBe(true)

    const pkgPath = join(target, ".opencode/package.json")
    expect(existsSync(pkgPath)).toBe(true)
    const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"))
    expect(pkg.dependencies?.["@opencode-ai/plugin"]).toBeDefined()
  })

  it("does not distribute internal frontend documentation", () => {
    expect(existsSync(join(target, ".forge/frontend/DISTRIBUTE.md"))).toBe(false)
  })
})

// ---------------------------------------------------------------------------

describe("installer contract — no artifact references an uninstalled path", () => {
  let target: string

  beforeAll(() => {
    target = mkdtempSync(join(tmpdir(), "forge-refs-"))
    mkdirSync(join(target, ".opencode"), { recursive: true })
    installInto(target)
  })

  afterAll(() => rmSync(target, { recursive: true, force: true }))

  /** Every `.forge/<path>` literal mentioned by a distributed artifact. */
  function referencedForgePaths(): Map<string, string[]> {
    const refs = new Map<string, string[]>()
    // Directories that exist to be written into at runtime, not shipped.
    // Paths written at runtime by FORGE commands, not shipped by the installer.
    // `knowledge/decision-log.md` is deliberately NOT excluded — it is
    // scaffolded, so the reference check must keep covering it.
    const runtimeOwned =
      /^\.forge\/(specs|epics|sprints|product|architecture|knowledge\/(adr|archives|lessons-learned)|config\.yml|\.backups|\.install-manifest)/
    for (const artifact of catalogCanonicalArtifacts(REPO_ROOT)) {
      const matches = artifact.content?.match(/\.forge\/[A-Za-z0-9._\/-]+\.(md|yaml|yml|json|tsx|ts)/g) ?? []
      for (const raw of matches) {
        if (runtimeOwned.test(raw)) continue
        if (raw.includes("[") || raw.includes("NNN")) continue // placeholders
        const list = refs.get(raw) ?? []
        list.push(artifact.sourcePath)
        refs.set(raw, list)
      }
    }
    return refs
  }

  it("every concrete .forge/ path referenced by an artifact exists after install", () => {
    const missing: string[] = []
    for (const [ref, sources] of referencedForgePaths()) {
      if (!existsSync(join(target, ref))) {
        missing.push(`${ref}  ← referenced by ${sources.slice(0, 3).join(", ")}`)
      }
    }
    expect(missing, `Artifacts reference paths that are never installed:\n  ${missing.join("\n  ")}`).toEqual([])
  })

  it("no artifact references .opencode/templates or .opencode/docs", () => {
    // These paths only resolve on OpenCode. Templates and docs are
    // platform-neutral and live under .forge/ (spec 004 § D-1).
    const offenders: string[] = []
    for (const artifact of catalogCanonicalArtifacts(REPO_ROOT)) {
      if (/\.opencode\/(templates|docs)\//.test(artifact.content ?? "")) {
        offenders.push(artifact.sourcePath)
      }
    }
    expect(offenders).toEqual([])
  })

  it("no distributed artifact contains a meta-development path escape", () => {
    // `../.opencode/` is a dev/-sandbox convention. In an installed project
    // it escapes the project root entirely (constitution Art. 2.3 / 4.3).
    const offenders: string[] = []
    for (const artifact of catalogCanonicalArtifacts(REPO_ROOT)) {
      if ((artifact.content ?? "").includes("../.opencode/")) offenders.push(artifact.sourcePath)
    }
    expect(offenders).toEqual([])
  })

  it("every skill is loadable — frontmatter with a name", () => {
    const broken: string[] = []
    for (const artifact of catalogCanonicalArtifacts(REPO_ROOT)) {
      if (artifact.category !== "skill") continue
      if (!artifact.sourcePath.endsWith("SKILL.md")) continue
      const content = artifact.content ?? ""
      if (!content.startsWith("---\n") || !/^name:\s*\S+/m.test(content)) {
        broken.push(artifact.sourcePath)
      }
    }
    expect(broken, "skills without loadable frontmatter").toEqual([])
  })
})

// ---------------------------------------------------------------------------

describe("installer contract — idempotency and user ownership", () => {
  it("preserves user edits to constitution, AGENTS.md and decision log", () => {
    const target = mkdtempSync(join(tmpdir(), "forge-idem-"))
    try {
      mkdirSync(join(target, ".opencode"), { recursive: true })
      installInto(target)

      const userOwned = [
        join(target, ".forge/constitution.md"),
        join(target, "AGENTS.md"),
        join(target, ".forge/knowledge/decision-log.md"),
      ]
      for (const f of userOwned) writeFileSync(f, "USER EDITED\n", "utf-8")

      // Re-install, exactly as `install-forge.ts` would on an update.
      installInto(target)

      for (const f of userOwned) {
        expect(readFileSync(f, "utf-8"), `${f} was overwritten on update`).toBe("USER EDITED\n")
      }
    } finally {
      rmSync(target, { recursive: true, force: true })
    }
  })

  it("marks unchanged files as skip on a second run", () => {
    const target = mkdtempSync(join(tmpdir(), "forge-idem2-"))
    try {
      mkdirSync(join(target, ".opencode"), { recursive: true })
      const first = installInto(target)

      // Feed the first run's checksums back in, as the manifest would.
      const checksums: Record<string, string> = {}
      for (const op of first.operations) {
        if (op.kind === "create" || op.kind === "update") {
          checksums[op.targetPath] = hash(op.content ?? "")
        }
      }

      const second = buildInstallPlan(["opencode"], DESCRIPTORS, REPO_ROOT, target, checksums)
      const writes = second.operations.filter((o) => o.kind === "create" || o.kind === "update")
      expect(writes, `second run should write nothing, got ${writes.length} writes`).toEqual([])
    } finally {
      rmSync(target, { recursive: true, force: true })
    }
  })
})

/**
 * Read a file's contents and mtime through a single descriptor.
 *
 * Separate `readFileSync` + `statSync` calls on the same path are a
 * check-then-use file-system race (js/file-system-race). Same approach as
 * `ensureBackupGitignore` in installer/backup.ts.
 */
function readStamp(path: string): { content: string; mtimeMs: number } {
  const fd = openSync(path, "r")
  try {
    const { size, mtimeMs } = fstatSync(fd)
    const buf = Buffer.alloc(size)
    readSync(fd, buf, 0, size, 0)
    return { content: buf.toString("utf-8"), mtimeMs }
  } finally {
    closeSync(fd)
  }
}

/** Mirrors the digest used by projection.ts. */
function hash(content: string): string {
  return createHash("sha256").update(content, "utf-8").digest("hex")
}

// ---------------------------------------------------------------------------

describe("installer contract — non-OpenCode platforms", () => {
  it("installs platform-neutral artifacts for a Claude Code-only project", () => {
    const target = mkdtempSync(join(tmpdir(), "forge-claude-"))
    try {
      mkdirSync(join(target, ".claude"), { recursive: true })
      installInto(target, ["claude-code"])

      // Templates and docs are platform-neutral — they must land regardless.
      expect(existsSync(join(target, ".forge/templates/spec.md"))).toBe(true)
      expect(existsSync(join(target, ".forge/docs/FORGE-GUIDE.md"))).toBe(true)
      expect(existsSync(join(target, ".claude/agents/forge.md"))).toBe(true)

      // Plugins are OpenCode-only (spec 004 § D-3).
      expect(existsSync(join(target, ".claude/plugins"))).toBe(false)
      expect(existsSync(join(target, ".opencode"))).toBe(false)
    } finally {
      rmSync(target, { recursive: true, force: true })
    }
  })
})

// ---------------------------------------------------------------------------
// Spec 004 FR-010 — a pre-existing config is backed up before being replaced.
//
// These exercise the real `run()` pipeline, not the `materialise()` harness,
// because the backup branch lives in install.ts and would otherwise never be
// executed by any test.
// ---------------------------------------------------------------------------

describe("installer contract — config backup (FR-010)", () => {
  function freshTarget(): string {
    const t = mkdtempSync(join(tmpdir(), "forge-backup-"))
    mkdirSync(join(t, ".opencode"), { recursive: true })
    return t
  }

  it("backs up a user's opencode.json before overwriting it", async () => {
    const target = freshTarget()
    try {
      const original = '{\n  "theme": "dracula",\n  "model": "user/pinned"\n}\n'
      writeFileSync(join(target, "opencode.json"), original, "utf-8")

      const result = await run({ targetRoot: target })

      expect(result.success).toBe(true)
      expect(result.backupPaths.length, "no backup was taken").toBeGreaterThan(0)

      const backups = result.backupPaths.filter((p) => p.endsWith("opencode.json"))
      expect(backups.length).toBe(1)
      expect(readFileSync(backups[0], "utf-8")).toBe(original)
      expect(backups[0]).toContain(join(".forge", ".backups"))

      // The live file is merged, not replaced wholesale.
      const merged = JSON.parse(readFileSync(join(target, "opencode.json"), "utf-8"))
      expect(merged.theme).toBe("dracula")
      expect(merged.model).toBe("user/pinned")
      expect(merged.instructions).toContain(".forge/constitution.md")
    } finally {
      rmSync(target, { recursive: true, force: true })
    }
  }, 60_000)

  it("backs up and replaces a malformed config instead of discarding it (E-6)", async () => {
    const target = freshTarget()
    try {
      const broken = "{ this is not json"
      writeFileSync(join(target, "opencode.json"), broken, "utf-8")

      const result = await run({ targetRoot: target })

      expect(result.success).toBe(true)
      expect(result.warnings.some((w) => w.includes("could not be parsed"))).toBe(true)

      const backups = result.backupPaths.filter((p) => p.endsWith("opencode.json"))
      expect(backups.length, "malformed config was discarded without a backup").toBe(1)
      expect(readFileSync(backups[0], "utf-8")).toBe(broken)

      // And the replacement is valid, with governance wired up.
      const replaced = JSON.parse(readFileSync(join(target, "opencode.json"), "utf-8"))
      expect(replaced.instructions).toContain(".forge/constitution.md")
    } finally {
      rmSync(target, { recursive: true, force: true })
    }
  }, 60_000)

  it("gitignores the backup directory so backups are never committed", async () => {
    const target = freshTarget()
    try {
      writeFileSync(join(target, "opencode.json"), "{}", "utf-8")
      await run({ targetRoot: target })
      const gitignore = join(target, ".forge", ".gitignore")
      expect(existsSync(gitignore)).toBe(true)
      expect(readFileSync(gitignore, "utf-8")).toContain(".backups/")
    } finally {
      rmSync(target, { recursive: true, force: true })
    }
  }, 60_000)

  it("does not reinstall MCP dependencies when nothing changed (NFR-003)", async () => {
    const target = freshTarget()
    try {
      await run({ targetRoot: target })
      const stamp = join(target, ".forge", "mcp-server", "node_modules", ".forge-install-stamp")

      // A missing stamp surfaces as a thrown ENOENT, which fails the test.
      const before = readStamp(stamp)

      await run({ targetRoot: target })

      const after = readStamp(stamp)
      expect(after.content).toBe(before.content)
      expect(after.mtimeMs, "npm install ran again on an unchanged project").toBe(before.mtimeMs)
    } finally {
      rmSync(target, { recursive: true, force: true })
    }
  }, 120_000)
})

describe("installer contract — manifest hygiene", () => {
  it("marks user-owned files as excluded from drift comparison", async () => {
    // Their manifest checksum is the pristine template forever, so comparing
    // against it would flag drift on every run after the user's first edit.
    const target = mkdtempSync(join(tmpdir(), "forge-manifest-"))
    try {
      mkdirSync(join(target, ".opencode"), { recursive: true })
      await run({ targetRoot: target })

      const manifest = JSON.parse(
        readFileSync(join(target, ".forge", ".install-manifest.json"), "utf-8"),
      )
      for (const p of [".forge/constitution.md", ".forge/knowledge/decision-log.md", "AGENTS.md"]) {
        expect(manifest.excludedPaths, `${p} should be excluded`).toContain(p)
      }
    } finally {
      rmSync(target, { recursive: true, force: true })
    }
  }, 60_000)
})

describe("installer contract — the catalogue never walks build output", () => {
  it("excludes node_modules from the MCP server projection", () => {
    // mcp-server/ has a lockfile, so any local build creates node_modules
    // there. An unfiltered walk copied ~3,900 dependency files into every
    // target project — and read them as UTF-8, corrupting native binaries.
    const forge = catalogForgeArtifacts(REPO_ROOT)
    const offenders = forge.filter((a) => /(^|\/)node_modules(\/|$)/.test(a.sourcePath))
    expect(offenders.map((a) => a.sourcePath)).toEqual([])
  })

  it("keeps the MCP server catalogue to its own source files", () => {
    const mcp = catalogForgeArtifacts(REPO_ROOT).filter((a) =>
      a.targetPath.includes(join(".forge", "mcp-server")),
    )
    expect(mcp.length).toBeGreaterThan(0)
    // A handful of TypeScript sources plus two manifests — not thousands.
    expect(mcp.length).toBeLessThan(50)
    expect(mcp.some((a) => a.sourcePath.endsWith("index.ts"))).toBe(true)
  })

  it("excludes dotted and build directories everywhere in the catalogue", () => {
    const all = [...catalogForgeArtifacts(REPO_ROOT), ...catalogCanonicalArtifacts(REPO_ROOT)]
    for (const bad of ["node_modules", "/.git/", "/dist/", "/coverage/"]) {
      const hits = all.filter((a) => a.sourcePath.includes(bad))
      expect(hits.map((a) => a.sourcePath), `catalogue contains ${bad}`).toEqual([])
    }
  })

  it("installs a bounded number of files", () => {
    // A blunt canary: if this jumps by an order of magnitude, the walk is
    // picking up something it should not.
    const plan = buildInstallPlan(["opencode"], DESCRIPTORS, REPO_ROOT, mkdtempSync(join(tmpdir(), "forge-count-")))
    const writes = plan.operations.filter((o) => o.kind === "create" || o.kind === "update")
    expect(writes.length).toBeGreaterThan(100)
    expect(writes.length).toBeLessThan(1000)
  })
})
