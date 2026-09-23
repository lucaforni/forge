/**
 * session-knowledge/shared — Pure knowledge extraction helpers.
 *
 * Zero plugin-SDK imports: this module is unit-testable without OpenCode
 * and is shared by the server entry (`index.ts`). Kept dependency-free
 * (constitution Art. 2.2 applies by analogy — helpers must run anywhere).
 */

import { access } from "node:fs/promises"

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
