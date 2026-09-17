/**
 * tests/unit/sprint-status.test.ts — Sprint dashboard tool.
 *
 * This tool previously filtered on `.json` and called `JSON.parse`, while
 * every FORGE sprint file is YAML. On any real project it returned
 * "No active sprint files found" and nothing else.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"

import { getSprintStatus } from "../../mcp-server/src/tools/sprint-status"
import { parseSprintFile, stripComment } from "../../mcp-server/src/lib/sprint-parse"

const SPRINT_YAML = `version: 1
sprint:
  number: 3
  goal: "Ship the installer contract"
  start_date: "2026-09-01"
  end_date: "2026-09-14"

  stories:
    - id: "E01-S001"
      title: "Extend the projection"
      status: done
      points: 5
    - id: "E01-S002"
      title: "Write the contract test"
      status: in_progress
      points: 3
    - id: "E01-S003"
      title: "Fix Codex paths"
      status: blocked
      points: 2
      blocked_reason: "needs a root escape hatch"
    - id: "E01-S004"
      title: "Docs"
      status: pending
      points: 2

  velocity:
    planned: 12
    completed: 5
`

let root: string

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "forge-sprint-"))
})
afterEach(() => rmSync(root, { recursive: true, force: true }))

function writeSprint(name: string, content: string): void {
  const dir = join(root, ".forge", "sprints", "active")
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, name), content, "utf-8")
}

// ---------------------------------------------------------------------------

describe("parseSprintFile", () => {
  it("reads the canonical FORGE sprint schema", () => {
    const s = parseSprintFile(SPRINT_YAML)!
    expect(s.number).toBe(3)
    expect(s.goal).toBe("Ship the installer contract")
    expect(s.start_date).toBe("2026-09-01")
    expect(s.end_date).toBe("2026-09-14")
    expect(s.velocity).toEqual({ planned: 12, completed: 5 })
    expect(s.stories).toHaveLength(4)
  })

  it("parses each story field, including the optional blocker", () => {
    const s = parseSprintFile(SPRINT_YAML)!
    expect(s.stories[0]).toEqual({
      id: "E01-S001", title: "Extend the projection", status: "done", points: 5,
    })
    expect(s.stories[2].blocked_reason).toBe("needs a root escape hatch")
    expect(s.stories[3].blocked_reason).toBeUndefined()
  })

  it("returns null when there is no sprint block", () => {
    expect(parseSprintFile("version: 1\nsomething: else\n")).toBeNull()
  })

  it("handles the template's commented-out story list", () => {
    const s = parseSprintFile(`version: 1
sprint:
  number: 1
  goal: "[Sprint goal]"
  start_date: "YYYY-MM-DD"
  end_date: "YYYY-MM-DD"

  stories:
    # - id: "E01-S001"
    #   title: "Story title"

  velocity:
    planned: 0
    completed: 0
`)!
    expect(s.stories).toEqual([])
    expect(s.velocity).toEqual({ planned: 0, completed: 0 })
  })

  it("defaults an unknown status to pending rather than trusting it", () => {
    const s = parseSprintFile(SPRINT_YAML.replace("status: done", "status: banana"))!
    expect(s.stories[0].status).toBe("pending")
  })

  it("defaults non-numeric points to 0", () => {
    const s = parseSprintFile(SPRINT_YAML.replace("points: 5", "points: many"))!
    expect(s.stories[0].points).toBe(0)
  })

  it("tolerates a missing velocity block", () => {
    const s = parseSprintFile(`version: 1
sprint:
  number: 1
  goal: "g"
`)!
    expect(s.velocity).toEqual({ planned: 0, completed: 0 })
  })
})

describe("stripComment", () => {
  it("removes a trailing comment", () => {
    expect(stripComment("  number: 1   # sprint number").trim()).toBe("number: 1")
  })

  it("keeps a # inside a quoted value", () => {
    // `line.replace(/#.*$/, "")` would corrupt any goal containing a '#'.
    expect(stripComment('  goal: "Fix #42"').trim()).toBe('goal: "Fix #42"')
    expect(stripComment("  goal: 'Issue #7'").trim()).toBe("goal: 'Issue #7'")
  })

  it("removes a comment that follows a quoted value", () => {
    expect(stripComment('  goal: "Fix #42"  # note').trim()).toBe('goal: "Fix #42"')
  })

  it("treats a full-line comment as empty", () => {
    expect(stripComment("# header").trim()).toBe("")
  })
})

// ---------------------------------------------------------------------------

describe("getSprintStatus", () => {
  it("reports no sprints when the directory is absent", async () => {
    const out = await getSprintStatus(root)
    expect(out).toContain("No active sprints found")
  })

  it("reports no sprints when the directory is empty", async () => {
    mkdirSync(join(root, ".forge", "sprints", "active"), { recursive: true })
    expect(await getSprintStatus(root)).toContain("No active sprints found")
  })

  it("renders a YAML sprint file — the format FORGE actually writes", async () => {
    writeSprint("sprint-003.yaml", SPRINT_YAML)
    const out = await getSprintStatus(root)

    expect(out).toContain("FORGE Sprint Dashboard")
    expect(out).toContain("Sprint 3: Ship the installer contract")
    expect(out).toContain("2026-09-01 → 2026-09-14")
  })

  it("computes progress from story points", async () => {
    writeSprint("sprint-003.yaml", SPRINT_YAML)
    const out = await getSprintStatus(root)
    // 5 done of 12 total points → 42%
    expect(out).toContain("42%")
    expect(out).toContain("1/4 done | 1 in progress | 1 blocked | 1 pending")
    expect(out).toContain("Points:   5/12")
  })

  it("marks each story with its status icon and surfaces blockers", async () => {
    writeSprint("sprint-003.yaml", SPRINT_YAML)
    const out = await getSprintStatus(root)

    expect(out).toContain("✓ [E01-S001]")
    expect(out).toContain("→ [E01-S002]")
    expect(out).toContain("✗ [E01-S003]")
    expect(out).toContain("○ [E01-S004]")
    expect(out).toContain("[BLOCKED: needs a root escape hatch]")
  })

  it("renders several active sprints in a stable order", async () => {
    writeSprint("sprint-001.yaml", SPRINT_YAML.replace("number: 3", "number: 1"))
    writeSprint("sprint-002.yaml", SPRINT_YAML.replace("number: 3", "number: 2"))
    const out = await getSprintStatus(root)

    expect(out.indexOf("Sprint 1:")).toBeLessThan(out.indexOf("Sprint 2:"))
  })

  it("degrades a malformed file without aborting the whole dashboard", async () => {
    writeSprint("sprint-001.yaml", SPRINT_YAML)
    writeSprint("sprint-002.yaml", "this is not a sprint file\n")
    const out = await getSprintStatus(root)

    expect(out).toContain("Sprint 3: Ship the installer contract")
    expect(out).toContain("⚠ Could not parse: sprint-002.yaml")
  })

  it("does not divide by zero when no story carries points", async () => {
    writeSprint("sprint-001.yaml", `version: 1
sprint:
  number: 1
  goal: "Empty"
  start_date: "2026-01-01"
  end_date: "2026-01-07"
  stories:
  velocity:
    planned: 0
    completed: 0
`)
    const out = await getSprintStatus(root)
    expect(out).toContain("0%")
    expect(out).toContain("No stories yet.")
  })

  it("ignores non-sprint files in the directory", async () => {
    writeSprint("sprint-001.yaml", SPRINT_YAML)
    writeSprint("README.md", "not a sprint")
    const out = await getSprintStatus(root)
    expect(out).not.toContain("Could not parse")
  })
})
