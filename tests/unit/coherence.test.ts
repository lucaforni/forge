/**
 * tests/unit/coherence.test.ts — Framework self-consistency invariants.
 *
 * FORGE's agents, commands and skills must agree with each other: one
 * severity scale, one dimension count, one sprint layout, one answer to
 * "who implements". Every finding in spec 006 was a case of two files
 * disagreeing, and prose cannot enforce agreement — this test can.
 *
 * It scans the shipped sources (the same tree the installer projects),
 * so a new contradiction fails CI at the commit that introduces it.
 */

import { describe, it, expect } from "vitest"
import { readdirSync, readFileSync, statSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..")
const SCAN_ROOTS = ["agents", "commands", "skills"].map((d) => join(REPO_ROOT, ".opencode", d))

interface Doc {
  path: string
  content: string
}

function collectMarkdown(): Doc[] {
  const docs: Doc[] = []
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry)
      if (statSync(full).isDirectory()) {
        walk(full)
      } else if (entry.endsWith(".md")) {
        docs.push({ path: full, content: readFileSync(full, "utf-8") })
      }
    }
  }
  for (const root of SCAN_ROOTS) walk(root)
  return docs
}

const offenders = (docs: Doc[], re: RegExp): string[] =>
  docs.filter((d) => re.test(d.content)).map((d) => d.path);

describe("coherence — one severity vocabulary (#63)", () => {
  it("no framework file scores HIGH / MEDIUM / LOW", () => {
    // The single scale is CRITICAL / WARNING / INFO. A leftover HIGH/MEDIUM
    // resurrects the unmapped-scale bug: the defining skill and its
    // consumers would again speak different languages.
    // Match the severity-list pattern (`- **HIGH** ...`), not prose that
    // happens to contain the words.
    const docs = collectMarkdown()
    const real = docs
      .filter((d) => /(?:^|\n)\s*-\s*\*\*(HIGH|MEDIUM|LOW)\*\*/.test(d.content))
      .map((d) => d.path)
    expect(real).toEqual([])
  })
})

describe("coherence — review dimensions (#64)", () => {
  it("no file numbers UX as Dimension 6", () => {
    const docs = collectMarkdown()
    expect(offenders(docs, /Dimension 6[^0-9]/)).toEqual([])
  })

  it("no file claims a 5-dimension review", () => {
    const docs = collectMarkdown()
    expect(offenders(docs, /across 5 dimensions|5-dimension review/)).toEqual([])
  })
})

describe("coherence — sprint layout (#65)", () => {
  it("no command reads the legacy single-file sprint-status.yaml from .forge/sprints/", () => {
    // forge-sprint.md documents the old→new migration (the "Old:" line, the
    // .bak rollback); those mentions are the migration itself, not a live
    // read path. Anything else referencing the legacy file is a regression
    // to the pre-migration layout.
    const migrationContext = /old|migrat|rollback|legacy|previous|\.bak|continue with old/i
    const hits: string[] = []
    for (const d of collectMarkdown()) {
      for (const line of d.content.split("\n")) {
        if (/\.forge\/sprints\/sprint-status\.yaml/.test(line) && !migrationContext.test(line)) {
          hits.push(`${d.path}: ${line.trim()}`)
        }
      }
    }
    expect(hits).toEqual([])
  })

  it("retro reports land on the filename /forge-retro writes", () => {
    const docs = collectMarkdown()
    expect(offenders(docs, /retrospectives\/retro-NNN\.md/)).toEqual([])
  })
})

describe("coherence — who implements (#67)", () => {
  it("no file routes work to a Build agent", () => {
    const docs = collectMarkdown()
    const hits = docs.filter((d) =>
      /Build agent|handoff to Build|delegate to Build|→ Build|Build →|\(Build\)/.test(d.content),
    ).map((d) => d.path)
    expect(hits).toEqual([])
  })
})

describe("coherence — template paths (#56, still enforced)", () => {
  it("no artifact references .opencode/templates, .opencode/docs or a ../ escape", () => {
    const docs = collectMarkdown()
    const hits = docs.filter((d) =>
      /\.opencode\/(templates|docs)\//.test(d.content) || d.content.includes("../.opencode/"),
    ).map((d) => d.path)
    expect(hits).toEqual([])
  })
})
