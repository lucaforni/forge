/**
 * session-knowledge/shared — Pure knowledge extraction helpers.
 *
 * Zero plugin-SDK imports: this module is unit-testable without OpenCode
 * and is shared by the server entry (`index.ts`). Kept dependency-free
 * (constitution Art. 2.2 applies by analogy — helpers must run anywhere).
 *
 * The `context`-hook delivery path is deliberately split into these seams
 * so the suite can prove the injection logic without the OpenCode runtime:
 * `loadGovernanceText` (file reads) + `pushGovernance` (event mutation) +
 * `hashString` (per-session dedup key). `index.ts` stays thin wiring.
 */

import { access } from "node:fs/promises"
import { join } from "node:path"

// ---------------------------------------------------------------------------
// File helpers
// ---------------------------------------------------------------------------

export async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

export function formatDate(): string {
  return new Date().toISOString().split("T")[0]
}

// ---------------------------------------------------------------------------
// Log slicing
// ---------------------------------------------------------------------------

/**
 * Extract the last N entries from the decision log or lessons learned.
 * Entries are separated by `### ` headers.
 */
export function extractLastEntries(content: string, count: number): string[] {
  const entries: string[] = []
  const parts = content.split(/(?=^### )/gm)

  for (const part of parts) {
    const trimmed = part.trim()
    if (trimmed.startsWith("### ")) {
      entries.push(trimmed)
    }
  }

  return entries.slice(-count)
}

// ---------------------------------------------------------------------------
// Governance context
// ---------------------------------------------------------------------------

export interface GovernanceContextInput {
  /** Contents of `.forge/constitution.md` (empty string when absent). */
  constitution: string
  /** Contents of `.forge/knowledge/decision-log.md` (empty string when absent). */
  decisionLog: string
  /** How many trailing decision entries to include. Defaults to 10. */
  maxDecisions?: number
}

/**
 * Build the FORGE governance block injected into every model request.
 *
 * OpenCode v2 does **not** resolve the `instructions` config key, so the
 * constitution and decision log have to reach the model through a session
 * `context` hook instead. Returns `null` when there is nothing to inject, so
 * the caller can skip the push entirely rather than send an empty block.
 */
export function buildGovernanceContext(input: GovernanceContextInput): string | null {
  const chunks: string[] = []

  const constitution = input.constitution.trim()
  if (constitution.length > 0) {
    chunks.push(`## Project Constitution (.forge/constitution.md)\n\n${constitution}`)
  }

  const decisions = extractLastEntries(input.decisionLog, input.maxDecisions ?? 10)
  if (decisions.length > 0) {
    chunks.push(
      `## Recent Decisions (.forge/knowledge/decision-log.md)\n\n${decisions.join("\n\n")}`,
    )
  }

  if (chunks.length === 0) return null

  return (
    `# FORGE Governance\n\n` +
    `The following project governance is loaded automatically. ` +
    `Treat the constitution as binding and keep decisions consistent with it.\n\n` +
    chunks.join("\n\n---\n\n")
  )
}

// ---------------------------------------------------------------------------
// Context-hook delivery seams (kept here so tests can drive them)
// ---------------------------------------------------------------------------

/** Minimal shape the delivery seams need — a subset of SessionContext. */
export interface SystemEvent {
  system?: unknown
}

/**
 * 32-bit FNV-1a hash, hex-encoded. Dependency-free content key for the
 * per-session injection gate in `index.ts`: re-inject only when the
 * governance text actually changed (e.g. constitution edited mid-session).
 */
export function hashString(input: string): string {
  let hash = 0x811c9dc5
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return (hash >>> 0).toString(16).padStart(8, "0")
}

/**
 * Read the governance sources and build the injectable block.
 *
 * `readFile` is injected so tests can stub the filesystem. A missing file
 * reads as empty; when both sources are empty the result is `null` (caller
 * skips the push rather than sending an empty block).
 */
export async function loadGovernanceText(
  rootDir: string,
  readFile: (path: string) => Promise<string>,
): Promise<string | null> {
  const [constitution, decisionLog] = await Promise.all([
    readFile(join(rootDir, ".forge", "constitution.md")).catch(() => ""),
    readFile(join(rootDir, ".forge", "knowledge", "decision-log.md")).catch(() => ""),
  ])
  return buildGovernanceContext({ constitution, decisionLog })
}

/**
 * Append the governance block to the hook event's system draft.
 *
 * Returns `true` when a part was pushed. Returns `false` (no-op, no throw)
 * when there is nothing to inject or the event lacks a system array — the
 * latter guards against SDK shape drift the same way `index.ts` does.
 */
export function pushGovernance(event: SystemEvent, text: string | null): boolean {
  if (text === null) return false
  const system = event.system
  if (!Array.isArray(system)) return false
  system.push({ type: "text", text })
  return true
}

// ---------------------------------------------------------------------------
// Message flattening
// ---------------------------------------------------------------------------

export interface FlatMessage {
  role: string
  content: string
}

/**
 * Flatten raw session messages into role + text pairs.
 *
 * Defensive by design: the exact `SessionMessageInfo` part layout is a
 * runtime-verification item (T-017). Unknown shapes yield no messages
 * rather than a crash.
 */
export function flattenMessages(raw: unknown): FlatMessage[] {
  if (!Array.isArray(raw)) return []
  const out: FlatMessage[] = []
  for (const item of raw) {
    const msg = item as {
      info?: { role?: unknown }
      role?: unknown
      parts?: unknown
    }
    const role =
      typeof msg.info?.role === "string"
        ? msg.info.role
        : typeof msg.role === "string"
          ? msg.role
          : "unknown"
    const parts = Array.isArray(msg.parts) ? msg.parts : []
    const texts: string[] = []
    for (const p of parts) {
      const part = p as { type?: unknown; text?: unknown }
      if (part.type === "text" && typeof part.text === "string" && part.text.length > 0) {
        texts.push(part.text)
      }
    }
    if (texts.length > 0) {
      out.push({ role, content: texts.join("\n") })
    }
  }
  return out
}

// ---------------------------------------------------------------------------
// Decision extraction
// ---------------------------------------------------------------------------

/**
 * Extract decisions from session messages.
 *
 * Looks for patterns that indicate decisions:
 * - "decided to ...", "chose ...", "will use ...", "going with ..."
 * - "selected ... over ...", "picked ..."
 * - Architectural choices, technology selections, pattern choices
 */
export function extractDecisionsFromMessages(messages: FlatMessage[]): string[] {
  const decisions: string[] = []
  const decisionPatterns = [
    /(?:decided|choosing|chose|will use|going with|selected|picking|opted for|switching to)\s+(.{10,120})/gi,
    /(?:architecture|pattern|approach|strategy|design):\s*(.{10,120})/gi,
    /(?:using|adopting|implementing)\s+(\S+)\s+(?:for|as|to)\s+(.{5,100})/gi,
  ]

  for (const msg of messages) {
    if (msg.role !== "assistant") continue

    for (const pattern of decisionPatterns) {
      let match: RegExpExecArray | null
      // Reset lastIndex for global regex
      pattern.lastIndex = 0
      while ((match = pattern.exec(msg.content)) !== null) {
        const decision = match[0].trim()
        // Filter out very generic matches
        if (
          decision.length > 15 &&
          !decision.includes("```") &&
          !decisions.includes(decision)
        ) {
          decisions.push(decision)
        }
      }
    }
  }

  return decisions.slice(0, 10) // Cap at 10 to avoid flooding
}

// ---------------------------------------------------------------------------
// Lesson extraction
// ---------------------------------------------------------------------------

/**
 * Extract lessons from session messages.
 *
 * Looks for patterns that indicate debugging, errors, or insights:
 * - "the issue was ...", "the problem was ...", "fixed by ..."
 * - "lesson learned ...", "note to self ...", "remember to ..."
 * - "error:", "bug:", "found that ...", "turns out ..."
 */
export function extractLessonsFromMessages(messages: FlatMessage[]): string[] {
  const lessons: string[] = []
  const lessonPatterns = [
    /(?:the issue was|the problem was|fixed by|the fix was|root cause)\s+(.{10,150})/gi,
    /(?:lesson learned|note to self|remember to|important to|don't forget)\s+(.{10,150})/gi,
    /(?:turns out|found that|realized that|discovered that)\s+(.{10,150})/gi,
    /(?:mistake was|error was caused by|failed because)\s+(.{10,150})/gi,
  ]

  // Also check for debugging indicators (multiple error mentions suggest a debugging session)
  let errorMentions = 0
  for (const msg of messages) {
    if (
      msg.content.includes("error") ||
      msg.content.includes("Error") ||
      msg.content.includes("bug") ||
      msg.content.includes("fix")
    ) {
      errorMentions++
    }
  }

  // Only extract lessons if session had significant debugging (3+ error mentions)
  if (errorMentions < 3) return lessons

  for (const msg of messages) {
    if (msg.role !== "assistant") continue

    for (const pattern of lessonPatterns) {
      let match: RegExpExecArray | null
      pattern.lastIndex = 0
      while ((match = pattern.exec(msg.content)) !== null) {
        const lesson = match[0].trim()
        if (
          lesson.length > 15 &&
          !lesson.includes("```") &&
          !lessons.includes(lesson)
        ) {
          lessons.push(lesson)
        }
      }
    }
  }

  return lessons.slice(0, 5) // Cap at 5
}
