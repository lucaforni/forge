/**
 * tests/unit/plugins.test.ts — Plugin helper + projection unit tests (spec 010).
 *
 * The v2 plugins split SDK entrypoints (`index.ts`, `tui.ts`) from pure
 * helpers (`shared.ts`). Only the helpers are importable without the
 * OpenCode runtime, so only they are unit-tested here; the entries were
 * typechecked against the real `@opencode/plugin@2.0.12` SDK and the live
 * behavior is covered by the manual V2 checklist (T-016/017).
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"

import {
  extractRequirementIds,
  getSpecDir,
  isWatchedSpecFile,
  checkSpecConsistency,
  formatWatcherMessage,
} from "../../.opencode/plugins/spec-watcher/shared"

import {
  formatGateMessage,
  gateVariant,
  isCheckablePath,
  checkClarificationMarkers,
} from "../../.opencode/plugins/pre-commit-gate/shared"

import {
  flattenMessages,
  extractLastEntries,
  extractDecisionsFromMessages,
  extractLessonsFromMessages,
} from "../../.opencode/plugins/session-knowledge/shared"

import { mapPermissionsArray } from "../../installer/platforms/claude-code"

// ---------------------------------------------------------------------------
// spec-watcher/shared
// ---------------------------------------------------------------------------

describe("spec-watcher helpers", () => {
  it("extracts FR/NFR ids and ignores lookalikes", () => {
    expect([...extractRequirementIds("FR-001, NFR-002 and FR-010")]).toEqual(
      ["FR-001", "NFR-002", "FR-010"],
    )
    expect(extractRequirementIds("no requirements here").size).toBe(0)
    expect(extractRequirementIds("FR-1 is too short").size).toBe(0)
  })

  it("resolves the spec dir only inside .forge/specs/", () => {
    const root = "/proj"
    expect(getSpecDir("/proj/.forge/specs/001-auth/spec.md", root)).toBe(
      join(root, ".forge", "specs", "001-auth"),
    )
    expect(getSpecDir("/proj/src/auth.ts", root)).toBeNull()
    expect(getSpecDir("/proj/.forge/specs/spec.md", root)).toBeNull()
  })

  it("watches only markdown under .forge/specs/", () => {
    const root = "/proj"
    expect(isWatchedSpecFile(root, "/proj/.forge/specs/001-a/spec.md")).toBe(true)
    expect(isWatchedSpecFile(root, "/proj/.forge/specs/001-a/notes.txt")).toBe(false)
    expect(isWatchedSpecFile(root, "/proj/src/a.ts")).toBe(false)
  })

  describe("checkSpecConsistency", () => {
    let root: string
    let specDir: string
    beforeEach(() => {
      root = mkdtempSync(join(tmpdir(), "forge-watcher-"))
      specDir = join(root, ".forge", "specs", "001-auth")
      mkdirSync(specDir, { recursive: true })
    })
    afterEach(() => rmSync(root, { recursive: true, force: true }))

    it("is quiet when plan and tasks cover every requirement", async () => {
      writeFileSync(join(specDir, "spec.md"), "Requirements: FR-001, FR-002\n")
      writeFileSync(join(specDir, "plan.md"), "Covers FR-001 and FR-002\n")
      writeFileSync(join(specDir, "tasks.md"), "- [x] 1.1 FR-001\n- [x] 1.2 FR-002\n")
      const content = "Requirements: FR-001, FR-002\n"
      await expect(checkSpecConsistency(specDir, content)).resolves.toEqual([])
    })

    it("flags new, removed and missing downstream docs", async () => {
      writeFileSync(join(specDir, "plan.md"), "Covers FR-001 and FR-999\n")
      writeFileSync(join(specDir, "tasks.md"), "Tasks for FR-001\n")
      const issues = await checkSpecConsistency(specDir, "Requirements: FR-001, FR-002\n")
      const messages = issues.map((i) => i.message)
      expect(messages).toContain("FR-002 is in spec but not referenced in plan.md")
      expect(messages).toContain("FR-999 is referenced in plan.md but no longer in spec")
      expect(messages).toContain("FR-002 is in spec but has no task in tasks.md")
    })

    it("asks for a plan when none exists", async () => {
      const issues = await checkSpecConsistency(specDir, "Requirements: FR-001\n")
      expect(issues.some((i) => i.type === "missing_document")).toBe(true)
    })
  })

  it("formats the watcher message and stays quiet when consistent", () => {
    expect(formatWatcherMessage("001-auth", [])).toBeNull()
    const msg = formatWatcherMessage("001-auth", [
      { type: "new_requirement", message: "FR-002 is in spec but not referenced in plan.md" },
      { type: "missing_document", message: "No tasks.md found" },
    ])!
    expect(msg).toContain("FORGE Spec Watcher (001-auth):")
    expect(msg).toContain("1 new requirement(s)")
    expect(msg).toContain("No tasks.md found")
    expect(msg).toContain("/forge-analyze")
  })
})

// ---------------------------------------------------------------------------
// pre-commit-gate/shared
// ---------------------------------------------------------------------------

describe("pre-commit-gate helpers", () => {
  it("stays quiet on info-only issues and caps at 5 findings", () => {
    expect(
      formatGateMessage("004", [{ severity: "info", message: "no tasks.md" }]),
    ).toBeNull()
    const warnings = Array.from({ length: 7 }, (_, i) => ({
      severity: "warning" as const,
      message: `issue ${i}`,
    }))
    const msg = formatGateMessage("004", warnings)!
    expect(msg).toContain("FORGE Gate (Spec 004):")
    expect(msg).toContain("issue 4")
    expect(msg).not.toContain("issue 5")
    expect(msg).toContain("... and 2 more")
    expect(msg).toContain("/forge-analyze")
  })

  it("picks the error variant only when errors exist", () => {
    expect(gateVariant([{ severity: "warning", message: "w" }])).toBe("info")
    expect(gateVariant([{ severity: "error", message: "e" }])).toBe("error")
  })

  it("skips FORGE internals and dependencies", () => {
    const root = "/proj"
    expect(isCheckablePath(root, "/proj/src/a.ts")).toBe(true)
    expect(isCheckablePath(root, "/proj/.forge/specs/001-a/spec.md")).toBe(false)
    expect(isCheckablePath(root, "/proj/.opencode/agents/forge.md")).toBe(false)
    expect(isCheckablePath(root, "/proj/node_modules/x/index.js")).toBe(false)
  })

  it("counts clarification markers per spec doc", async () => {
    const root = mkdtempSync(join(tmpdir(), "forge-gate-"))
    try {
      const specDir = join(root, "001-a")
      mkdirSync(specDir, { recursive: true })
      writeFileSync(join(specDir, "spec.md"), "Open: [NEEDS CLARIFICATION] x [NEEDS CLARIFICATION]\n")
      const issues = await checkClarificationMarkers(specDir)
      expect(issues).toHaveLength(1)
      expect(issues[0].message).toContain("2 [NEEDS CLARIFICATION]")
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })
})

// ---------------------------------------------------------------------------
// session-knowledge/shared
// ---------------------------------------------------------------------------

describe("session-knowledge helpers", () => {
  it("flattens text parts and ignores unknown shapes", () => {
    expect(flattenMessages("nope")).toEqual([])
    expect(
      flattenMessages([
        { info: { role: "assistant" }, parts: [{ type: "text", text: "hello" }, { type: "image" }] },
        { info: { role: "user" }, parts: [] },
        { garbage: true },
      ]),
    ).toEqual([{ role: "assistant", content: "hello" }])
  })

  it("slices the last N log entries", () => {
    const log = "intro\n### 2026-01-01 — a\nbody a\n### 2026-01-02 — b\nbody b\n"
    expect(extractLastEntries(log, 1)).toHaveLength(1)
    expect(extractLastEntries(log, 1)[0]).toContain("2026-01-02")
    expect(extractLastEntries(log, 10)).toHaveLength(2)
  })

  it("extracts assistant decisions, capped at 10", () => {
    const messages = [
      { role: "assistant", content: "We decided to use SQLite for the queue." },
      { role: "user", content: "we decided to ignore this (not assistant)" },
    ]
    const decisions = extractDecisionsFromMessages(messages)
    expect(decisions.length).toBeGreaterThan(0)
    expect(decisions.every((d) => !d.includes("```"))).toBe(true)
  })

  it("extracts lessons only from debugging-heavy sessions", () => {
    const quiet = [{ role: "assistant", content: "Turns out the API was fine." }]
    expect(extractLessonsFromMessages(quiet)).toEqual([])

    const noisy = [
      { role: "assistant", content: "error in auth. Turns out the token expired, that was the root cause of the bug." },
      { role: "assistant", content: "Another error and another fix for the same bug." },
      { role: "assistant", content: "Third error mention with a fix attached." },
    ]
    expect(extractLessonsFromMessages(noisy).length).toBeGreaterThan(0)
  })
})

// ---------------------------------------------------------------------------
// Claude projection of native v2 permissions
// ---------------------------------------------------------------------------

describe("mapPermissionsArray", () => {
  it("maps v2 actions to Claude tools", () => {
    const { tools, notes } = mapPermissionsArray([
      "  - action: read",
      '    resource: "*"',
      "    effect: allow",
      "  - action: shell",
      '    resource: "git status"',
      "    effect: allow",
      "  - action: subagent",
      '    resource: "*"',
      "    effect: allow",
    ])
    expect(tools).toEqual(["Read", "Bash", "Task"])
    // The scoped shell rule cannot be expressed — recorded, not dropped.
    expect(notes.some((n) => n.includes("git status"))).toBe(true)
  })

  it("records deny rules instead of broadening them", () => {
    const { tools, notes } = mapPermissionsArray([
      "  - action: shell",
      '    resource: "*"',
      "    effect: deny",
    ])
    expect(tools).toEqual(["Bash"])
    expect(notes.some((n) => n.includes("deny"))).toBe(true)
  })

  it("flags unknown actions for manual verification", () => {
    const { notes } = mapPermissionsArray([
      "  - action: telepathy",
      '    resource: "*"',
      "    effect: allow",
    ])
    expect(notes.some((n) => n.includes("telepathy"))).toBe(true)
  })
})
