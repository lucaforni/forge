/**
 * tests/unit/mcp-server.test.ts — MCP server entry point.
 *
 * `mcp-server/index.ts` runs in every user project and was excluded from the
 * coverage scope entirely. Importing it used to spawn a stdio transport at
 * module load; the entry-point guard makes it importable so the registry and
 * the output formatters can be tested.
 */

import { describe, it, expect } from "vitest"

import { formatValidateSpecResult, formatTraceResult } from "../../mcp-server/index"
import type { ValidationResult } from "../../mcp-server/src/tools/validate-spec"
import type { TraceResult } from "../../mcp-server/src/tools/trace-requirements"

const CLEAN: ValidationResult = {
  specPath: "/p/spec.md",
  completeness: 100,
  emptyRequiredFields: [],
  needsClarification: [],
  storiesWithoutCriteria: [],
  nfrsWithoutMetrics: [],
  missingSections: [],
  frIssues: [],
  constitutionIssues: [],
  crossReferenceIssues: [],
  critical: 0,
  warnings: 0,
  info: 0,
}

describe("importing the server does not start it", () => {
  it("exposes formatters without opening a transport", () => {
    // If the module still called main() at import time, this file would hang
    // or emit "Server running on stdio transport".
    expect(typeof formatValidateSpecResult).toBe("function")
    expect(typeof formatTraceResult).toBe("function")
  })
})

describe("formatValidateSpecResult", () => {
  it("renders the path and score for a clean spec", () => {
    const out = formatValidateSpecResult(CLEAN)
    expect(out).toContain("/p/spec.md")
    expect(out).toContain("Completeness: 100%")
  })

  it("lists every finding category", () => {
    const out = formatValidateSpecResult({
      ...CLEAN,
      completeness: 40,
      missingSections: ["Edge Cases"],
      emptyRequiredFields: ["Out of Scope"],
      needsClarification: ["which timezone?"],
      storiesWithoutCriteria: ["Log in"],
      nfrsWithoutMetrics: ["NFR-001"],
      critical: 2,
      warnings: 2,
      info: 1,
    })

    expect(out).toContain("Edge Cases")
    expect(out).toContain("Out of Scope")
    expect(out).toContain("which timezone?")
    expect(out).toContain("Log in")
    expect(out).toContain("NFR-001")
  })

  it("does not print empty finding sections for a clean spec", () => {
    const out = formatValidateSpecResult(CLEAN)
    expect(out).not.toContain("Empty Required Fields")
    expect(out).not.toContain("NEEDS CLARIFICATION")
  })

  it("survives a result with missing optional fields", () => {
    // The handler passes through whatever the tool returned; a partial
    // object must not crash the formatter.
    expect(() => formatValidateSpecResult({} as ValidationResult)).not.toThrow()
    expect(formatValidateSpecResult({} as ValidationResult)).toContain("unknown")
  })
})

describe("formatTraceResult", () => {
  const base: TraceResult = { specId: "001-demo", requirements: [], gaps: [], coverage: 0 }

  it("labels a fully traced requirement as covered", () => {
    const out = formatTraceResult({
      ...base,
      requirements: [{
        id: "FR-001", description: "Log in",
        planSections: [], taskItems: [],
        sourceFiles: ["src/auth.ts"], testFiles: ["tests/auth.test.ts"],
      }],
    })
    expect(out).toContain("[COVERED] FR-001: Log in")
    expect(out).toContain("Source: src/auth.ts")
    expect(out).toContain("Tests:  tests/auth.test.ts")
  })

  it("distinguishes NO TESTS from NOT IMPLEMENTED", () => {
    const out = formatTraceResult({
      ...base,
      requirements: [
        { id: "FR-001", description: "a", planSections: [], taskItems: [], sourceFiles: ["s.ts"], testFiles: [] },
        { id: "FR-002", description: "b", planSections: [], taskItems: [], sourceFiles: [], testFiles: [] },
      ],
    })
    expect(out).toContain("[NO TESTS] FR-001")
    expect(out).toContain("[NOT IMPLEMENTED] FR-002")
  })

  it("renders the gap list", () => {
    const out = formatTraceResult({ ...base, gaps: ["FR-002: [NOT IMPLEMENTED] — nothing"] })
    expect(out).toContain("Gaps:")
    expect(out).toContain("FR-002")
  })

  it("renders a header even with nothing to report", () => {
    const out = formatTraceResult(base)
    expect(out).toContain("Requirements Traceability Matrix")
    expect(out).not.toContain("Gaps:")
  })

  it("survives a result with missing optional fields", () => {
    expect(() => formatTraceResult({} as TraceResult)).not.toThrow()
  })
})
