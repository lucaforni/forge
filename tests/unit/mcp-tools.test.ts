/**
 * tests/unit/mcp-tools.test.ts — Unit tests for the shared MCP tools.
 *
 * These three tools are the cross-platform tool surface designated by
 * constitution Art. 3.1, they are installed into every user project, and
 * they had 0% coverage.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"

import { validateSpec } from "../../mcp-server/src/tools/validate-spec"
import { traceRequirements } from "../../mcp-server/src/tools/trace-requirements"

let root: string

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "forge-mcp-"))
})
afterEach(() => rmSync(root, { recursive: true, force: true }))

function write(relPath: string, content: string): string {
  const full = join(root, relPath)
  mkdirSync(join(full, ".."), { recursive: true })
  writeFileSync(full, content, "utf-8")
  return full
}

// ---------------------------------------------------------------------------
// validate-spec
// ---------------------------------------------------------------------------

const COMPLETE_SPEC = `---
id: 001-example
status: Draft
---

## Overview
A feature that does something useful.

## Problem Statement
Users cannot do the thing.

## User Stories

### US-001: Do the thing
As a user I want to do the thing.
Acceptance Criteria:
- Given a thing, when I do it, then it is done.

## Functional Requirements
| ID | Requirement |
|---|---|
| FR-001 | The system does the thing |

## Non-Functional Requirements
| ID | Category | Requirement | Target |
|---|---|---|---|
| NFR-001 | Performance | Responds quickly | < 200 ms |

## Edge Cases
- Empty input.

## Data Requirements
None.

## Out of Scope
Everything else.

## Constitution Compliance
Complies with Article 1.

## Cross-References
None.
`

describe("validateSpec", () => {
  it("scores a complete spec at 100 with no findings", async () => {
    const p = write("spec.md", COMPLETE_SPEC)
    const r = await validateSpec(p)

    expect(r.completeness).toBe(100)
    expect(r.missingSections).toEqual([])
    expect(r.emptyRequiredFields).toEqual([])
    expect(r.storiesWithoutCriteria).toEqual([])
    expect(r.nfrsWithoutMetrics).toEqual([])
    expect(r.critical).toBe(0)
  })

  it("reports missing required sections and lowers the score", async () => {
    const p = write("spec.md", "## Overview\nOnly this one.\n")
    const r = await validateSpec(p)

    expect(r.missingSections).toContain("Problem Statement")
    expect(r.missingSections).toContain("Functional Requirements")
    expect(r.completeness).toBeLessThan(50)
    expect(r.critical).toBeGreaterThan(0)
  })

  it("flags a section that exists but is empty", async () => {
    const p = write("spec.md", COMPLETE_SPEC.replace("## Edge Cases\n- Empty input.", "## Edge Cases\n"))
    const r = await validateSpec(p)

    expect(r.emptyRequiredFields).toContain("Edge Cases")
    expect(r.missingSections).not.toContain("Edge Cases")
  })

  it("collects [NEEDS CLARIFICATION] markers and penalises the score", async () => {
    const p = write("spec.md", COMPLETE_SPEC + "\n[NEEDS CLARIFICATION] which timezone?\n")
    const r = await validateSpec(p)

    expect(r.needsClarification).toHaveLength(1)
    expect(r.needsClarification[0]).toContain("timezone")
    expect(r.info).toBe(1)
    expect(r.completeness).toBe(95)
  })

  it("caps the clarification penalty at 30 points", async () => {
    const markers = Array.from({ length: 20 }, (_, i) => `[NEEDS CLARIFICATION] q${i}`).join("\n")
    const p = write("spec.md", COMPLETE_SPEC + "\n" + markers + "\n")
    const r = await validateSpec(p)

    expect(r.needsClarification).toHaveLength(20)
    expect(r.completeness).toBe(70) // 100 − min(20×5, 30)
  })

  it("flags a user story with no acceptance criteria", async () => {
    const p = write("spec.md", COMPLETE_SPEC.replace(
      "Acceptance Criteria:\n- Given a thing, when I do it, then it is done.",
      "Some prose with no criteria.",
    ))
    const r = await validateSpec(p)

    expect(r.storiesWithoutCriteria).toContain("Do the thing")
    expect(r.warnings).toBeGreaterThan(0)
  })

  it("flags an NFR with no measurable target", async () => {
    const p = write("spec.md", COMPLETE_SPEC.replace("| < 200 ms |", "| fast |"))
    const r = await validateSpec(p)

    expect(r.nfrsWithoutMetrics).toContain("NFR-001")
  })

  it("accepts a variety of metric units", async () => {
    for (const target of ["< 200 ms", "99%", "500 req/s", "10 MB", "24 hour"]) {
      const p = write("spec.md", COMPLETE_SPEC.replace("| < 200 ms |", `| ${target} |`))
      const r = await validateSpec(p)
      expect(r.nfrsWithoutMetrics, `"${target}" should count as a metric`).toEqual([])
    }
  })

  it("uses the tech-spec section set and skips story checks", async () => {
    const p = write("tech-spec.md", `## Overview
Short.

## Requirements
| ID | Requirement |
|---|---|
| FR-001 | Does it |

## Tasks
- [ ] T-001 do it

## Acceptance Criteria
- It is done.

## Cross-References
None.
`)
    const r = await validateSpec(p)

    expect(r.completeness).toBe(100)
    // Spec-only sections must not be demanded of a tech-spec.
    expect(r.missingSections).not.toContain("User Stories")
    expect(r.missingSections).not.toContain("Edge Cases")
  })

  it("never returns a score outside 0..100", async () => {
    const markers = Array.from({ length: 50 }, (_, i) => `[NEEDS CLARIFICATION] q${i}`).join("\n")
    const p = write("spec.md", markers)
    const r = await validateSpec(p)

    expect(r.completeness).toBeGreaterThanOrEqual(0)
    expect(r.completeness).toBeLessThanOrEqual(100)
  })

  it("rejects a missing file rather than reporting a passing score", async () => {
    await expect(validateSpec(join(root, "nope.md"))).rejects.toThrow()
  })
})

// ---------------------------------------------------------------------------
// trace-requirements
// ---------------------------------------------------------------------------

describe("traceRequirements", () => {
  function scaffoldSpec(opts: { plan?: string; tasks?: string } = {}): string {
    const specPath = write("specs/001-demo/spec.md", `## Functional Requirements
| ID | Requirement |
|---|---|
| FR-001 | Log in |
| FR-002 | Log out |

## Non-Functional Requirements
| ID | Category | Requirement | Target |
|---|---|---|---|
| NFR-001 | Performance | Fast | < 100 ms |
`)
    if (opts.plan !== undefined) write("specs/001-demo/plan.md", opts.plan)
    if (opts.tasks !== undefined) write("specs/001-demo/tasks.md", opts.tasks)
    return specPath
  }

  it("extracts every FR and NFR from the spec", async () => {
    const specPath = scaffoldSpec()
    const r = await traceRequirements({ specPath, projectRoot: root })

    const ids = r.requirements.map((x) => x.id)
    expect(ids).toContain("FR-001")
    expect(ids).toContain("FR-002")
    expect(ids).toContain("NFR-001")
  })

  it("carries the requirement description through", async () => {
    const specPath = scaffoldSpec()
    const r = await traceRequirements({ specPath, projectRoot: root })

    const fr001 = r.requirements.find((x) => x.id === "FR-001")
    expect(fr001?.description).toContain("Log in")
  })

  it("links a task back to its requirement", async () => {
    const specPath = scaffoldSpec({ tasks: "- [ ] T-001 [FR-001] build login\n" })
    const r = await traceRequirements({ specPath, projectRoot: root })

    const fr001 = r.requirements.find((x) => x.id === "FR-001")
    expect(fr001?.taskItems.some((t) => t.includes("FR-001"))).toBe(true)

    const fr002 = r.requirements.find((x) => x.id === "FR-002")
    expect(fr002?.taskItems).toEqual([])
  })

  it("links a plan section back to its requirement", async () => {
    const specPath = scaffoldSpec({ plan: "## Auth module\nImplements FR-001.\n" })
    const r = await traceRequirements({ specPath, projectRoot: root })

    const fr001 = r.requirements.find((x) => x.id === "FR-001")
    expect(fr001?.planSections.length).toBeGreaterThan(0)
  })

  it("reports a NOT IMPLEMENTED gap for every unreferenced requirement", async () => {
    const specPath = scaffoldSpec({ tasks: "- [ ] T-001 `[FR-001]` build login\n" })
    const r = await traceRequirements({ specPath, projectRoot: root })

    expect(r.gaps).toHaveLength(3)
    for (const id of ["FR-001", "FR-002", "NFR-001"]) {
      expect(r.gaps.join("\n")).toContain(`${id}: [NOT IMPLEMENTED]`)
    }
    expect(r.coverage).toBe(0)
  })

  it("discovers source and test files that reference a requirement", async () => {
    // This walk was entirely untested: projectRoot was hardcoded to
    // process.cwd(), so the tool scanned the FORGE repo rather than the
    // project under test and reported 100% coverage for an empty fixture.
    const specPath = scaffoldSpec()
    write("src/auth.ts", "// implements FR-001\nexport const login = () => {}\n")
    write("tests/auth.test.ts", "// covers FR-001\n")

    const r = await traceRequirements({ specPath, projectRoot: root })
    const fr001 = r.requirements.find((x) => x.id === "FR-001")!

    expect(fr001.sourceFiles.some((f) => f.endsWith("auth.ts"))).toBe(true)
    expect(fr001.testFiles.some((f) => f.endsWith("auth.test.ts"))).toBe(true)

    // FR-002 is referenced nowhere.
    const fr002 = r.requirements.find((x) => x.id === "FR-002")!
    expect(fr002.sourceFiles).toEqual([])
    expect(r.gaps.join("\n")).toContain("FR-002: [NOT IMPLEMENTED]")
  })

  it("reports NO TESTS when source exists but no test references it", async () => {
    const specPath = scaffoldSpec()
    write("src/auth.ts", "// implements FR-001\n")

    const r = await traceRequirements({ specPath, projectRoot: root })
    expect(r.gaps.join("\n")).toContain("FR-001: [NO TESTS]")
  })

  it("skips node_modules and dotted directories when walking", async () => {
    const specPath = scaffoldSpec()
    write("src/node_modules/dep/index.ts", "// FR-001 in a dependency\n")
    write("src/.hidden/x.ts", "// FR-001 hidden\n")

    const r = await traceRequirements({ specPath, projectRoot: root })
    const fr001 = r.requirements.find((x) => x.id === "FR-001")!
    expect(fr001.sourceFiles).toEqual([])
  })

  it("tolerates a spec with no plan or tasks file", async () => {
    const specPath = scaffoldSpec()
    const r = await traceRequirements({ specPath, projectRoot: root })

    expect(r.requirements.length).toBeGreaterThan(0)
    for (const req of r.requirements) {
      expect(req.planSections).toEqual([])
      expect(req.taskItems).toEqual([])
    }
  })

  it("derives a spec id when only a path is given", async () => {
    const specPath = scaffoldSpec()
    const r = await traceRequirements({ specPath, projectRoot: root })
    // Derived from the file name, not the spec directory. Asserted exactly so
    // the test cannot pass on a broken derivation.
    expect(r.specId).toBe("spec")
  })

  it("requires either specId or specPath", async () => {
    await expect(traceRequirements({})).rejects.toThrow(/specId or specPath/)
  })

  it("rejects a spec path that does not exist", async () => {
    await expect(traceRequirements({ specPath: join(root, "missing.md") })).rejects.toThrow()
  })

  it("returns an empty requirement list for a spec with no FR/NFR tables", async () => {
    const specPath = write("specs/002-empty/spec.md", "## Overview\nNothing here.\n")
    const r = await traceRequirements({ specPath, projectRoot: root })

    expect(r.requirements).toEqual([])
  })

  it("recognises every task format FORGE itself emits", async () => {
    // The previous matcher required `**T-001**`, which none of the three
    // shapes below produce — so taskItems was always empty in practice.
    const shapes = [
      "- [ ] **1.1** `[FR-001]` Create the component",
      "- [ ] `[M]` `[FR-001]` `[P]` Implement the thing",
      "- [ ] T-001 `[M]` `[FR-001]` Do the work",
      "- [x] **T-002** `[FR-001]` Bold task id",
    ]
    const expected = [
      "1.1: Create the component",
      "Implement the thing",
      "T-001: Do the work",
      "T-002: Bold task id",
    ]
    for (const [i, shape] of shapes.entries()) {
      const specPath = scaffoldSpec({ tasks: shape + "\n" })
      const r = await traceRequirements({ specPath, projectRoot: root })
      const fr001 = r.requirements.find((x) => x.id === "FR-001")
      expect(fr001?.taskItems, `not matched: ${shape}`).toEqual([expected[i]])
    }
  })

  it("preserves a bracketed group in the middle of a task description", async () => {
    // A global tag strip would delete this too, silently rewriting user text.
    const specPath = scaffoldSpec({
      tasks: "- [ ] T-001 `[M]` `[FR-001]` Fix the `[login]` button\n",
    })
    const r = await traceRequirements({ specPath, projectRoot: root })
    const fr001 = r.requirements.find((x) => x.id === "FR-001")
    expect(fr001?.taskItems[0]).toBe("T-001: Fix the `[login]` button")
  })

  it("does not match a requirement id that is a prefix of another", async () => {
    const specPath = scaffoldSpec({ tasks: "- [ ] `[M]` `[FR-0012]` unrelated task\n" })
    const r = await traceRequirements({ specPath, projectRoot: root })
    const fr001 = r.requirements.find((x) => x.id === "FR-001")
    expect(fr001?.taskItems).toEqual([])
  })

  it("ignores prose that mentions a requirement outside a checklist item", async () => {
    const specPath = scaffoldSpec({ tasks: "FR-001 is discussed here but is not a task.\n" })
    const r = await traceRequirements({ specPath, projectRoot: root })
    const fr001 = r.requirements.find((x) => x.id === "FR-001")
    expect(fr001?.taskItems).toEqual([])
  })
})
