/**
 * tests/unit/model-config.test.ts — Unit tests for installer/model-config.ts (011).
 *
 * Covers FR-001…009 + NFR-003/004/005: resolve precedence, policy matrix
 * (incl. cheap→paid), tier build, availability, merge/backup/idempotency,
 * cost + privacy gates, exit codes, and the two-list key invariant.
 */

import { describe, it, expect } from "vitest"
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, readdirSync, rmSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"

import {
  MODEL_MANAGED_KEYS,
  POLICIES,
  UsageError,
  resolvePresets,
  selectTierModels,
  buildManagedKeys,
  modelFamily,
  checkAvailability,
  mergeManagedKeys,
  backupName,
  writeBackup,
  computeCostHint,
  detectRepoVisibility,
  evaluatePrivacyGate,
  runReconfigure,
  type ProviderPreset,
} from "../../installer/model-config"
import { FORGE_MANAGED_KEYS } from "../../installer/platforms/opencode"

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function freePreset(): ProviderPreset {
  return {
    name: "Free",
    description: "free-capable preset",
    defaultModel: "zen/deep-flash-free",
    providers: {
      zen: { models: { "deep-pro": {}, "deep-flash-free": {}, "other-free": {} } },
    },
    agentModels: {
      reasoning: { model: "zen/deep-pro", agents: ["forge-pm", "forge-architect", "forge-reviewer", "forge-ux"] },
      execution: { model: "zen/deep-flash-free", agents: ["forge", "forge-scrum", "forge-qa", "forge-analyst"] },
      peer: { model: "zen/other-free", agents: ["forge-reviewer-peer"] },
    },
    alternatives: {
      reasoning: ["zen/deep-pro"],
      execution: ["zen/deep-flash-free", "zen/other-free"],
      peer: ["zen/other-free"],
    },
  }
}

function paidOnlyPreset(): ProviderPreset {
  return {
    name: "Paid",
    description: "paid-only preset, no peer tier",
    defaultModel: "acme/fast-1",
    providers: {
      acme: { models: { "strong-9": {}, "fast-1": {} } },
    },
    agentModels: {
      reasoning: { model: "acme/strong-9", agents: ["forge-pm", "forge-architect", "forge-reviewer", "forge-ux"] },
      execution: { model: "acme/fast-1", agents: ["forge", "forge-scrum", "forge-qa", "forge-analyst"] },
    },
    alternatives: { reasoning: ["acme/strong-9"], execution: ["acme/fast-1"] },
  }
}

function writePresets(root: string, file: string, content: string): void {
  const dir = join(root, ".forge", "templates")
  mkdirSync(dir, { recursive: true })
  if (file === ".forge/presets.json") {
    mkdirSync(join(root, ".forge"), { recursive: true })
    writeFileSync(join(root, ".forge", "presets.json"), content, "utf-8")
  } else {
    writeFileSync(join(root, ".forge", "templates", "presets.json"), content, "utf-8")
  }
}

function presetsFile(presets: Record<string, ProviderPreset>): string {
  return JSON.stringify({ presets })
}

/** tmp project with presets + a customized opencode.json (JSONC). */
function makeProject(opts: { presets?: string; active?: string; config?: string }): string {
  const root = mkdtempSync(join(tmpdir(), "forge-mc-"))
  if (opts.presets !== undefined) writePresets(root, "templates", opts.presets)
  if (opts.active !== undefined) writePresets(root, ".forge/presets.json", opts.active)
  writeFileSync(
    join(root, "opencode.json"),
    opts.config ??
      `{
        // user comment survives merges
        "model": "zen/deep-flash-free",
        "permissions": ["custom"],
        "agents": { "forge-pm": { "model": "zen/deep-pro", "path": "custom.md" } }
      }`,
    "utf-8",
  )
  return root
}

// ---------------------------------------------------------------------------
// resolvePresets (FR-001, FR-006, NFR-005)
// ---------------------------------------------------------------------------

describe("resolvePresets", () => {
  it("prefers .forge/presets.json over the fallback", () => {
    const root = makeProject({
      presets: presetsFile({ fb: freePreset() }),
      active: presetsFile({ live: paidOnlyPreset() }),
    })
    const r = resolvePresets(root)
    expect(r.source).toBe("project")
    expect(Object.keys(r.presets)).toEqual(["live"])
    expect(r.warnings).toEqual([])
    rmSync(root, { recursive: true, force: true })
  })

  it("falls back with a Standalone warning when the active file is missing", () => {
    const root = makeProject({ presets: presetsFile({ fb: freePreset() }) })
    const r = resolvePresets(root)
    expect(r.source).toBe("fallback")
    expect(Object.keys(r.presets)).toEqual(["fb"])
    expect(r.warnings.join(" ")).toMatch(/Standalone/)
    rmSync(root, { recursive: true, force: true })
  })

  it("falls back with a warning when the active file is corrupt", () => {
    const root = makeProject({ presets: presetsFile({ fb: freePreset() }), active: "{not json" })
    const r = resolvePresets(root)
    expect(r.source).toBe("fallback")
    expect(r.warnings.join(" ")).toMatch(/Standalone/)
    rmSync(root, { recursive: true, force: true })
  })

  it("returns empty + warning when nothing resolves (offline-safe, no throw)", () => {
    const root = mkdtempSync(join(tmpdir(), "forge-mc-empty-"))
    const r = resolvePresets(root)
    expect(r.source).toBe("none")
    expect(r.presets).toEqual({})
    rmSync(root, { recursive: true, force: true })
  })

  it("parses JSONC (comments + trailing commas)", () => {
    const root = makeProject({
      presets: `{
        // built-in presets
        "presets": {
          "fb": ${JSON.stringify(freePreset())},
        },
      }`,
    })
    expect(resolvePresets(root).source).toBe("fallback")
    rmSync(root, { recursive: true, force: true })
  })
})

// ---------------------------------------------------------------------------
// selectTierModels (FR-003)
// ---------------------------------------------------------------------------

describe("selectTierModels", () => {
  it("quality → strongest reasoning, execution keeps default", () => {
    const s = selectTierModels(freePreset(), "quality")
    expect(s.reasoning).toBe("zen/deep-pro")
    expect(s.execution).toBe("zen/deep-flash-free")
    expect(s.peer).toBe("zen/other-free")
  })

  it("speed → fastest execution", () => {
    expect(selectTierModels(freePreset(), "speed").execution).toBe("zen/deep-flash-free")
  })

  it("cheap prefers a -free execution model", () => {
    expect(selectTierModels(freePreset(), "cheap").execution).toBe("zen/deep-flash-free")
  })

  it("cheap falls back to the preset execution model when no -free exists (may be paid)", () => {
    expect(selectTierModels(paidOnlyPreset(), "cheap").execution).toBe("acme/fast-1")
  })

  it("omits peer when the preset has no peer tier", () => {
    expect(selectTierModels(paidOnlyPreset(), "quality").peer).toBeUndefined()
  })

  it("unknown policy → UsageError (exit 2) listing valid values", () => {
    try {
      selectTierModels(freePreset(), "turbo")
      expect.unreachable()
    } catch (e) {
      expect(e).toBeInstanceOf(UsageError)
      expect((e as UsageError).exitCode).toBe(2)
      for (const p of POLICIES) expect((e as Error).message).toContain(p)
    }
  })
})

// ---------------------------------------------------------------------------
// buildManagedKeys (FR-003, NFR-004)
// ---------------------------------------------------------------------------

describe("buildManagedKeys", () => {
  it("assigns reasoning/execution/peer agents and uses execution as default model", () => {
    const b = buildManagedKeys(freePreset(), selectTierModels(freePreset(), "quality"))
    expect(b.model).toBe("zen/deep-flash-free")
    expect(b.agents["forge-pm"]).toEqual({ model: "zen/deep-pro" })
    expect(b.agents["forge-scrum"]).toEqual({ model: "zen/deep-flash-free" })
    expect(b.agents["forge-reviewer-peer"]).toEqual({ model: "zen/other-free" })
  })

  it("keeps peer in a different model family than reviewer (dual-model diversity)", () => {
    const b = buildManagedKeys(paidOnlyPreset(), selectTierModels(paidOnlyPreset(), "quality"))
    expect(b.agents["forge-reviewer"].model).toBe("acme/strong-9")
    const free = buildManagedKeys(freePreset(), selectTierModels(freePreset(), "quality"))
    expect(modelFamily(free.agents["forge-reviewer-peer"].model)).not.toBe(
      modelFamily(free.agents["forge-reviewer"].model),
    )
  })

  it("is deterministic: same preset+policy ⇒ identical output", () => {
    const a = JSON.stringify(buildManagedKeys(freePreset(), selectTierModels(freePreset(), "cheap")))
    const b = JSON.stringify(buildManagedKeys(freePreset(), selectTierModels(freePreset(), "cheap")))
    expect(a).toBe(b)
  })
})

// ---------------------------------------------------------------------------
// checkAvailability (FR-005)
// ---------------------------------------------------------------------------

describe("checkAvailability", () => {
  it("passes when every tier model is declared", () => {
    expect(checkAvailability(freePreset(), selectTierModels(freePreset(), "quality")).ok).toBe(true)
  })

  it("fails with missing refs + hint, never downgrades", () => {
    const r = checkAvailability(freePreset(), {
      reasoning: "zen/ghost-1",
      execution: "zen/deep-flash-free",
    })
    expect(r.ok).toBe(false)
    expect(r.missing).toEqual(["zen/ghost-1"])
    expect(r.hint).toMatch(/--policy/)
    expect(r.hint).toMatch(/--provider/)
  })
})

// ---------------------------------------------------------------------------
// mergeManagedKeys (FR-002, FR-008, NFR-003, NFR-004)
// ---------------------------------------------------------------------------

describe("mergeManagedKeys", () => {
  it("replaces only managed keys and preserves the rest byte-identical", () => {
    const existing = { model: "old/m", permissions: ["x"], providers: { old: {} }, agents: {}, extra: 1 }
    const built = buildManagedKeys(freePreset(), selectTierModels(freePreset(), "quality"))
    const { next, changed, preservedKeys } = mergeManagedKeys(existing, built)
    expect(changed).toBe(true)
    expect(next["permissions"]).toEqual(["x"])
    expect(next["extra"]).toBe(1)
    expect(next["model"]).toBe("zen/deep-flash-free")
    expect(preservedKeys).toEqual(["permissions", "extra"])
  })

  it("rewrites only each agent entry's model field (path and custom entries survive)", () => {
    const existing = {
      agents: {
        "forge-pm": { model: "old", path: "custom.md" },
        "my-agent": { model: "keep/me" },
      },
    }
    const built = buildManagedKeys(freePreset(), selectTierModels(freePreset(), "quality"))
    const { next } = mergeManagedKeys(existing, built)
    const agents = next["agents"] as Record<string, Record<string, unknown>>
    expect(agents["forge-pm"]).toEqual({ model: "zen/deep-pro", path: "custom.md" })
    expect(agents["my-agent"]).toEqual({ model: "keep/me" })
    expect(agents["forge-scrum"]).toEqual({ model: "zen/deep-flash-free" })
  })

  it("detects no-op merges (idempotency)", () => {
    const built = buildManagedKeys(freePreset(), selectTierModels(freePreset(), "quality"))
    const first = mergeManagedKeys({}, built)
    expect(first.changed).toBe(true)
    expect(mergeManagedKeys(first.next, built).changed).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// backup (FR-002, FR-008)
// ---------------------------------------------------------------------------

describe("backup", () => {
  it("names backups opencode.json.bak.<YYYYMMDD-HHMMSS>", () => {
    expect(backupName(new Date(2026, 9, 8, 13, 5, 9))).toBe("opencode.json.bak.20261008-130509")
  })

  it("writeBackup copies the current file to the timestamped path", () => {
    const root = makeProject({ presets: presetsFile({ fb: freePreset() }) })
    const at = new Date(2026, 0, 2, 3, 4, 5)
    const p = writeBackup(root, () => at)
    expect(p).toBe(join(root, "opencode.json.bak.20260102-030405"))
    expect(readFileSync(p, "utf-8")).toBe(readFileSync(join(root, "opencode.json"), "utf-8"))
    rmSync(root, { recursive: true, force: true })
  })
})

// ---------------------------------------------------------------------------
// computeCostHint (FR-004, cheap→paid)
// ---------------------------------------------------------------------------

describe("computeCostHint", () => {
  it("labels free/paid + strong/cheap per tier", () => {
    const h = computeCostHint(selectTierModels(freePreset(), "cheap"), {}, "cheap")
    const byTier = Object.fromEntries(h.rows.map((r) => [r.tier, r]))
    expect(byTier["reasoning"]).toMatchObject({ free: false, strength: "strong" })
    expect(byTier["execution"]).toMatchObject({ free: true, strength: "cheap" })
    expect(h.paidUpgrade).toBe(false)
    expect(h.cheapResolvedPaid).toBe(false)
  })

  it("flags cheap→paid without ever claiming free", () => {
    const h = computeCostHint(selectTierModels(paidOnlyPreset(), "cheap"), {}, "cheap")
    expect(h.cheapResolvedPaid).toBe(true)
    expect(h.rows.every((r) => !r.free)).toBe(true)
  })

  it("detects free→paid upgrades vs the previous config", () => {
    const h = computeCostHint(
      selectTierModels(paidOnlyPreset(), "quality"),
      { agents: { "forge-pm": { model: "zen/deep-flash-free" } } },
      "quality",
    )
    expect(h.paidUpgrade).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// detectRepoVisibility + evaluatePrivacyGate (FR-007, ADR-006)
// ---------------------------------------------------------------------------

describe("detectRepoVisibility", () => {
  it("reads gh isPrivate output", () => {
    expect(detectRepoVisibility("/tmp", () => "true")).toBe("private")
    expect(detectRepoVisibility("/tmp", () => "false")).toBe("public")
  })

  it("returns unknown when gh fails but a remote exists, or everything fails", () => {
    const ghFailGitOk = (cmd: string) => {
      if (cmd === "gh") throw new Error("no gh")
      return "origin\tgit@github.com:x/y.git (fetch)"
    }
    expect(detectRepoVisibility("/tmp", ghFailGitOk)).toBe("unknown")
    expect(
      detectRepoVisibility("/tmp", () => {
        throw new Error("offline")
      }),
    ).toBe("unknown")
  })
})

describe("evaluatePrivacyGate", () => {
  const freeSel = selectTierModels(freePreset(), "cheap")
  const paidSel = selectTierModels(paidOnlyPreset(), "quality")

  it("suppresses the gate entirely for non-free tiers", () => {
    expect(evaluatePrivacyGate(paidSel, "private", {})).toEqual({ blocked: false, notice: null, blockReason: "" })
  })

  it("notices but allows free models on public repos", () => {
    const g = evaluatePrivacyGate(freeSel, "public", {})
    expect(g.blocked).toBe(false)
    expect(g.notice).toMatch(/Privacy trade-off/)
  })

  it("blocks free models on private/unknown repos without explicit confirm", () => {
    for (const v of ["private", "unknown"] as const) {
      const g = evaluatePrivacyGate(freeSel, v, {})
      expect(g.blocked).toBe(true)
      expect(g.blockReason).toMatch(/--allow-free-private/)
    }
  })

  it("--yes (or --allow-free-private) unblocks", () => {
    expect(evaluatePrivacyGate(freeSel, "private", { yes: true }).blocked).toBe(false)
    expect(evaluatePrivacyGate(freeSel, "unknown", { allowFreePrivate: true }).blocked).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// applyReconfigure end-to-end (FR-001…009, exit codes)
// ---------------------------------------------------------------------------

describe("runReconfigure", () => {
  const noNet = () => {
    throw new Error("offline")
  }

  it("--list renders presets and exits 0", () => {
    const root = makeProject({ presets: presetsFile({ fb: freePreset() }) })
    const r = runReconfigure({ projectRoot: root, list: true })
    expect(r.exitCode).toBe(0)
    expect(r.output).toMatch(/fb/)
    expect(r.changed).toBe(false)
    rmSync(root, { recursive: true, force: true })
  })

  it("missing --policy is a usage error (exit 2, never defaulted)", () => {
    const root = makeProject({ presets: presetsFile({ fb: freePreset() }) })
    const r = runReconfigure({ projectRoot: root, provider: "fb", exec: noNet })
    expect(r.exitCode).toBe(2)
    expect(r.output).toMatch(/--policy/)
    rmSync(root, { recursive: true, force: true })
  })

  it("unknown --provider is a usage error listing valid values", () => {
    const root = makeProject({ presets: presetsFile({ fb: freePreset() }) })
    const r = runReconfigure({ projectRoot: root, provider: "nope", policy: "quality", exec: noNet })
    expect(r.exitCode).toBe(2)
    expect(r.output).toMatch(/fb/)
    rmSync(root, { recursive: true, force: true })
  })

  it("happy path writes, backs up once, preserves custom keys; rerun is unchanged with no second backup", () => {
    const root = makeProject({ presets: presetsFile({ fb: freePreset() }) })
    // gh reports public so the free-tier notice does not block.
    const pub = () => "false"
    const first = runReconfigure({ projectRoot: root, provider: "fb", policy: "cheap", exec: pub })
    expect(first.exitCode).toBe(0)
    expect(first.changed).toBe(true)
    expect(first.backupPath).toMatch(/opencode\.json\.bak\./)
    expect(first.output).toMatch(/Backup:/)

    const written = JSON.parse(readFileSync(join(root, "opencode.json"), "utf-8")) as Record<string, unknown>
    expect(written["permissions"]).toEqual(["custom"])
    expect((written["agents"] as Record<string, { model: string }>)["forge-pm"].model).toBe("zen/deep-pro")

    const before = readdirSync(root).filter((f) => f.startsWith("opencode.json.bak."))
    const second = runReconfigure({ projectRoot: root, provider: "fb", policy: "cheap", exec: pub })
    expect(second.exitCode).toBe(0)
    expect(second.changed).toBe(false)
    expect(second.output).toMatch(/Unchanged/)
    expect(readdirSync(root).filter((f) => f.startsWith("opencode.json.bak."))).toEqual(before)
    rmSync(root, { recursive: true, force: true })
  })

  it("--dry-run prints the diff summary and writes nothing", () => {
    const root = makeProject({ presets: presetsFile({ fb: freePreset() }) })
    const r = runReconfigure({ projectRoot: root, provider: "fb", policy: "quality", dryRun: true, exec: () => "false" })
    expect(r.exitCode).toBe(0)
    expect(r.output).toMatch(/Dry-run/)
    expect(r.changed).toBe(false)
    expect(readdirSync(root).some((f) => f.startsWith("opencode.json.bak."))).toBe(false)
    rmSync(root, { recursive: true, force: true })
  })

  it("availability miss aborts (exit 1) with hint and no write", () => {
    const broken = freePreset()
    broken.agentModels.reasoning.model = "zen/ghost-1"
    broken.alternatives.reasoning = ["zen/ghost-1"]
    const root = makeProject({ presets: presetsFile({ b: broken }) })
    const before = readFileSync(join(root, "opencode.json"), "utf-8")
    const r = runReconfigure({ projectRoot: root, provider: "b", policy: "quality", exec: noNet })
    expect(r.exitCode).toBe(1)
    expect(r.output).toMatch(/not available/)
    expect(readFileSync(join(root, "opencode.json"), "utf-8")).toBe(before)
    rmSync(root, { recursive: true, force: true })
  })

  it("privacy block aborts (exit 1) on undetectable visibility without confirm", () => {
    const root = makeProject({ presets: presetsFile({ fb: freePreset() }) })
    const before = readFileSync(join(root, "opencode.json"), "utf-8")
    const r = runReconfigure({ projectRoot: root, provider: "fb", policy: "cheap", exec: noNet })
    expect(r.exitCode).toBe(1)
    expect(r.output).toMatch(/--allow-free-private/)
    expect(readFileSync(join(root, "opencode.json"), "utf-8")).toBe(before)
    rmSync(root, { recursive: true, force: true })
  })

  it("paid upgrade requires --yes", () => {
    const root = makeProject({
      presets: presetsFile({ p: paidOnlyPreset() }),
      config: JSON.stringify({ agents: { "forge-pm": { model: "zen/deep-flash-free" } } }),
    })
    const declined = runReconfigure({ projectRoot: root, provider: "p", policy: "quality", exec: noNet })
    expect(declined.exitCode).toBe(1)
    expect(declined.output).toMatch(/--yes/)
    const confirmed = runReconfigure({ projectRoot: root, provider: "p", policy: "quality", yes: true, exec: noNet })
    expect(confirmed.exitCode).toBe(0)
    expect(confirmed.changed).toBe(true)
    rmSync(root, { recursive: true, force: true })
  })

  it("creates a new opencode.json when none exists (no backup needed)", () => {
    const root = mkdtempSync(join(tmpdir(), "forge-mc-fresh-"))
    writePresets(root, "templates", presetsFile({ fb: freePreset() }))
    const r = runReconfigure({ projectRoot: root, provider: "fb", policy: "cheap", exec: () => "false" })
    expect(r.exitCode).toBe(0)
    expect(r.changed).toBe(true)
    expect(r.backupPath).toBeUndefined()
    expect(r.output).toMatch(/no prior file/)
    expect(JSON.parse(readFileSync(join(root, "opencode.json"), "utf-8")).model).toBe("zen/deep-flash-free")
    rmSync(root, { recursive: true, force: true })
  })

  it("--dry-run previews a paid upgrade without aborting (exit 0, no write)", () => {
    const root = makeProject({
      presets: presetsFile({ p: paidOnlyPreset() }),
      config: JSON.stringify({ agents: { "forge-pm": { model: "zen/deep-flash-free" } } }),
    })
    const r = runReconfigure({ projectRoot: root, provider: "p", policy: "quality", dryRun: true, exec: noNet })
    expect(r.exitCode).toBe(0)
    expect(r.output).toMatch(/acme\/strong-9/)
    expect(r.output).toMatch(/would require --yes/)
    expect(r.output).toMatch(/Dry-run/)
    expect(r.changed).toBe(false)
    expect(readdirSync(root).some((f) => f.startsWith("opencode.json.bak."))).toBe(false)
    rmSync(root, { recursive: true, force: true })
  })

  it("--dry-run previews a free-on-private selection without blocking (exit 0, no write)", () => {
    const root = makeProject({ presets: presetsFile({ fb: freePreset() }) })
    const r = runReconfigure({ projectRoot: root, provider: "fb", policy: "cheap", dryRun: true, exec: noNet })
    expect(r.exitCode).toBe(0)
    expect(r.output).toMatch(/PRIVACY/)
    expect(r.output).toMatch(/would block here/)
    expect(r.output).toMatch(/Dry-run/)
    expect(r.changed).toBe(false)
    expect(readdirSync(root).some((f) => f.startsWith("opencode.json.bak."))).toBe(false)
    rmSync(root, { recursive: true, force: true })
  })

  it("--dry-run still aborts on availability miss (invalid selection has no preview)", () => {
    const broken = freePreset()
    broken.agentModels.reasoning.model = "zen/ghost-1"
    broken.alternatives.reasoning = ["zen/ghost-1"]
    const root = makeProject({ presets: presetsFile({ b: broken }) })
    const r = runReconfigure({ projectRoot: root, provider: "b", policy: "quality", dryRun: true, exec: noNet })
    expect(r.exitCode).toBe(1)
    expect(r.output).toMatch(/not available/)
    rmSync(root, { recursive: true, force: true })
  })

  it("--list with no presets installed is a degraded exit 1 with reinstall hint", () => {
    const root = mkdtempSync(join(tmpdir(), "forge-mc-emptylist-"))
    const r = runReconfigure({ projectRoot: root, list: true })
    expect(r.exitCode).toBe(1)
    expect(r.output).toMatch(/Reinstall FORGE/)
    rmSync(root, { recursive: true, force: true })
  })

  it("unknown provider with no presets file is still a usage error naming reinstall", () => {
    const root = mkdtempSync(join(tmpdir(), "forge-mc-nopresets-"))
    const r = runReconfigure({ projectRoot: root, provider: "x", policy: "quality", exec: noNet })
    expect(r.exitCode).toBe(2) // unknown provider is a usage error even with no presets file
    expect(r.output).toMatch(/reinstall/)
    expect(r.changed).toBe(false)
    rmSync(root, { recursive: true, force: true })
  })
})

// ---------------------------------------------------------------------------
// Two-list invariant (plan §2.5): MODEL_MANAGED_KEYS vs FORGE_MANAGED_KEYS
// ---------------------------------------------------------------------------

describe("managed-key contracts", () => {
  it("MODEL_MANAGED_KEYS ∩ FORGE_MANAGED_KEYS is exactly {agents}", () => {
    const mine = new Set<string>(MODEL_MANAGED_KEYS)
    const theirs = new Set<string>(FORGE_MANAGED_KEYS)
    const inter = [...mine].filter((k) => theirs.has(k))
    expect(inter).toEqual(["agents"])
    // model-config owns model+providers; the installer owns everything else.
    expect(mine.has("model")).toBe(true)
    expect(mine.has("providers")).toBe(true)
    expect(theirs.has("model")).toBe(false)
    expect(theirs.has("providers")).toBe(false)
  })
})
