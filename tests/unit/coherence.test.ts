/**
 * tests/unit/coherence.test.ts — Framework self-consistency invariants.
 *
 * FORGE's agents, commands, skills, docs, templates and meta agents must
 * agree with each other: one severity scale, one dimension count, one sprint
 * layout, one answer to "who implements". Every finding in spec 006 was a
 * case of two files disagreeing, and prose cannot enforce agreement — this
 * test can.
 *
 * Scope discipline matters here: the first version of this test scanned
 * only agents/commands/skills and passed while docs/, templates/ and
 * .opencode-meta/ still taught the old severity scale and named a Build
 * agent. The scan below covers every directory that ships or governs, and
 * each exclusion is justified inline.
 */

import { describe, it, expect } from "vitest"
import { readdirSync, readFileSync, statSync } from "node:fs"
import { join, dirname, basename } from "node:path"
import { fileURLToPath } from "node:url"

import { EXCLUDED_DOCS } from "../../installer/projection"

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const OPENCODE_DIR = join(REPO_ROOT, ".opencode")
const META_DIR = join(REPO_ROOT, ".opencode-meta")

interface Doc {
  path: string
  /** Path relative to the repo root, for readable failure output. */
  rel: string
  content: string
}

function collectMarkdown(roots: string[]): Doc[] {
  const docs: Doc[] = []
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry)
      if (statSync(full).isDirectory()) {
        walk(full)
      } else if (entry.endsWith(".md")) {
        docs.push({
          path: full,
          rel: full.slice(REPO_ROOT.length + 1),
          content: readFileSync(full, "utf-8"),
        })
      }
    }
  }
  for (const root of roots) walk(root)
  return docs
}

/** Strip fenced code blocks so examples of output format don't false-positive. */
function withoutFences(content: string): string {
  return content
    .split("\n")
    .filter((_, i, lines) => {
      let fence = false
      for (let j = 0; j <= i; j++) {
        if (/^\s*(`{3,}|~{3,})/.test(lines[j])) fence = !fence
      }
      return !fence
    })
    .join("\n")
}

/**
 * Everything that ships to user projects, plus the meta agents that govern
 * this repository. Docs excluded from distribution by the installer are
 * excluded here too — via the same exported set, so the two cannot drift.
 */
function shippedDocs(): Doc[] {
  return collectMarkdown([
    join(OPENCODE_DIR, "agents"),
    join(OPENCODE_DIR, "commands"),
    join(OPENCODE_DIR, "skills"),
    join(OPENCODE_DIR, "templates"),
    join(META_DIR),
  ])
    .concat(
      collectMarkdown([join(OPENCODE_DIR, "docs")]).filter(
        (d) => !EXCLUDED_DOCS.has(basename(d.path)),
      ),
    )
}

const hits = (docs: Doc[], re: RegExp): string[] => {
  const out: string[] = []
  for (const d of docs) {
    for (const line of withoutFences(d.content).split("\n")) {
      if (re.test(line)) out.push(`${d.rel}: ${line.trim().slice(0, 100)}`)
    }
  }
  return out
}

describe("coherence — one severity vocabulary (#63)", () => {
  it("no shipped file uses HIGH / MEDIUM / LOW as finding severities", () => {
    // Review findings are uppercase by convention ([HIGH], `Severity: HIGH`,
    // `- **HIGH**`). Lowercase prose ("high-velocity teams",
    // `"variant": "high"`) is ordinary English and out of scope — banning
    // the word itself would be absurd.
    expect(hits(shippedDocs(), /\b(HIGH|MEDIUM|LOW)\b/)).toEqual([])
  })
})

describe("coherence — review dimensions (#64)", () => {
  it("nothing numbers UX as Dimension 6, in any casing or form", () => {
    const docs = shippedDocs()
    expect(hits(docs, /\b[Dd]imension\s*6\b/)).toEqual([])
    expect(hits(docs, /6th[^a-zA-Z]*dimension/i)).toEqual([])
    expect(hits(docs, /checks?\s+6[b-e]\b/)).toEqual([])
  })

  it("nothing claims a 5- or 6-dimension review", () => {
    const docs = shippedDocs()
    expect(hits(docs, /\b[56][ -]?dimensions?\b/)).toEqual([])
  })
})

describe("coherence — sprint layout (#65)", () => {
  it("no live read path uses the legacy single-file sprint-status.yaml", () => {
    // forge-sprint.md documents the old→new migration (the "Old:" line, the
    // .bak rollback); those mentions are the migration itself, not a live
    // read path. Anything else referencing the legacy file is a regression
    // to the pre-migration layout.
    const migrationContext = /old|migrat|rollback|legacy|previous|\.bak|continue with old/i
    const out: string[] = []
    for (const d of shippedDocs()) {
      for (const line of withoutFences(d.content).split("\n")) {
        if (/\.forge\/sprints\/sprint-status\.yaml/.test(line) && !migrationContext.test(line)) {
          out.push(`${d.rel}: ${line.trim().slice(0, 100)}`)
        }
      }
    }
    expect(out).toEqual([])
  })

  it("retro reports use one filename width: sprint-NNN-retro.md", () => {
    // Sprint files are sprint-NNN.yaml; mapping 001→01 was never defined,
    // so the 2-digit variant produced spurious retrospective-missing warnings.
    const docs = shippedDocs()
    expect(hits(docs, /retrospectives\/retro-NNN\.md/)).toEqual([])
    expect(hits(docs, /sprint-NN-retro\.md/)).toEqual([])
  })
})

describe("coherence — who implements (#67)", () => {
  it("nothing routes work to a Build agent, in any casing", () => {
    // "Query Building" and "building" are ordinary words; the separator
    // requirement keeps them out.
    const docs = shippedDocs()
    expect(hits(docs, /build[ _-]agent/i)).toEqual([])
    expect(hits(docs, /handoff to Build|delegate to Build|→ Build|Build →|\(Build\)/)).toEqual([])
  })
})

describe("coherence — template paths (#56, still enforced)", () => {
  it("no distributed artifact references .opencode/templates, .opencode/docs or a ../ escape", () => {
    // .opencode-meta/ is excluded here on purpose: those files run at the
    // repo root and legitimately read the source templates. What must never
    // appear anywhere — distributed or not — is the dead dev/ convention.
    const distributed = shippedDocs().filter((d) => !d.rel.startsWith(".opencode-meta/"))
    const out = distributed.filter((d) =>
      /\.opencode\/(templates|docs)\//.test(d.content) || d.content.includes("../.opencode/"),
    ).map((d) => d.rel)
    expect(out).toEqual([])
  })

  it("no file anywhere uses the dead ../.opencode/ sandbox convention", () => {
    const out = shippedDocs()
      .filter((d) => d.content.includes("../.opencode/"))
      .map((d) => d.rel)
    expect(out).toEqual([])
  })
})
