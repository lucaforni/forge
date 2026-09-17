/**
 * installer/frontmatter.ts — Minimal frontmatter projection engine.
 *
 * FORGE's canonical artifacts carry OpenCode frontmatter. Byte-copying them
 * onto Claude Code or Codex CLI ships keys those platforms do not understand
 * (`mode:`, `variant:`, `permission:`, `agent:`, `subtask:`) while omitting
 * keys they require (`name:` on Claude agents). This module parses the `---`
 * block, drops platform-wrong keys, and serializes the rest untouched.
 *
 * Deliberately a denylist, not an allowlist: unknown future keys pass
 * through byte-identical instead of being silently eaten. The parser only
 * understands what it needs — top-level `key: value` scalars and
 * indentation-nested blocks (which are dropped wholesale with their key).
 * Values may contain colons (quoted descriptions); multi-line scalars
 * (`|`/`>`) do not occur in FORGE frontmatter and are not supported.
 */

/** A parsed frontmatter block: ordered top-level entries. */
export interface FrontmatterEntry {
  key: string
  /** Raw lines belonging to the entry, including nested lines. */
  lines: string[]
}

export interface ParsedFrontmatter {
  entries: FrontmatterEntry[]
  /** Line index where the body starts (after the closing ---), or null. */
  bodyStart: number | null
}

/**
 * Split a document into frontmatter entries and body.
 * Returns no entries when the file has no valid `---` block.
 */
export function parseFrontmatter(content: string): ParsedFrontmatter {
  const lines = content.split("\n")
  if (lines[0]?.trim() !== "---") return { entries: [], bodyStart: null }

  let closeIdx = -1
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === "---") {
      closeIdx = i
      break
    }
  }
  if (closeIdx === -1) return { entries: [], bodyStart: null }

  const entries: FrontmatterEntry[] = []
  let current: FrontmatterEntry | null = null

  for (const line of lines.slice(1, closeIdx)) {
    const keyMatch = line.match(/^([A-Za-z0-9_-]+):(.*)$/)
    if (keyMatch && !/^\s/.test(line)) {
      current = { key: keyMatch[1], lines: [line] }
      entries.push(current)
    } else if (current) {
      current.lines.push(line)
    }
    // Lines before any key (blank lines, comments) are dropped with the
    // block only if the whole block is dropped; otherwise kept via entries.
    // Stray lines before the first key are appended to nothing — FORGE
    // frontmatter has none, and inventing a home for them would be worse.
  }

  return { entries, bodyStart: closeIdx + 1 }
}

/** Serialize entries back into a `---` block. */
export function serializeFrontmatter(entries: FrontmatterEntry[]): string {
  const lines = entries.flatMap((e) => e.lines)
  return ["---", ...lines, "---"].join("\n")
}

/** Get the scalar value of a top-level key (quotes stripped), if present. */
export function frontmatterValue(entries: FrontmatterEntry[], key: string): string | undefined {
  const entry = entries.find((e) => e.key === key)
  if (!entry) return undefined
  const first = entry.lines[0]
  const raw = first.slice(key.length + 1).trim()
  if (raw === "" || entry.lines.length > 1) return raw === "" ? undefined : raw
  return unquote(raw)
}

function unquote(value: string): string {
  const v = value.trim()
  if (v.length >= 2 && ((v[0] === '"' && v.at(-1) === '"') || (v[0] === "'" && v.at(-1) === "'"))) {
    return v.slice(1, -1)
  }
  return v
}

/**
 * Render a projected file: frontmatter block (possibly empty → omitted)
 * followed by the original body.
 */
export function renderProjected(content: string, entries: FrontmatterEntry[]): string {
  const { bodyStart } = parseFrontmatter(content)
  const body = bodyStart === null ? content : content.split("\n").slice(bodyStart).join("\n")
  if (entries.length === 0) return body
  return `${serializeFrontmatter(entries)}\n${body}`
}
