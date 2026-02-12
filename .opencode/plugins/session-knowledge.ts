import type { Plugin } from "@opencode-ai/plugin"
import { readFile, appendFile, access } from "node:fs/promises"
import { join } from "node:path"

/**
 * session-knowledge — Persistent knowledge extraction and injection.
 *
 * On session.idle:
 *   - Scans conversation for decisions and lessons
 *   - Appends structured entries to decision-log.md and lessons-learned.md
 *
 * On experimental.session.compacting:
 *   - Injects last 10 decisions and last 5 lessons as context
 *   - Ensures persistent knowledge survives context compaction
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

function formatDate(): string {
  return new Date().toISOString().split("T")[0]
}

/**
 * Extract the last N entries from the decision log or lessons learned.
 * Entries are separated by `### ` headers.
 */
function extractLastEntries(content: string, count: number): string[] {
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

/**
 * Extract decisions from session messages.
 *
 * Looks for patterns that indicate decisions:
 * - "decided to ...", "chose ...", "will use ...", "going with ..."
 * - "selected ... over ...", "picked ..."
 * - Architectural choices, technology selections, pattern choices
 */
function extractDecisionsFromMessages(
  messages: Array<{ role: string; content: string }>,
): string[] {
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

/**
 * Extract lessons from session messages.
 *
 * Looks for patterns that indicate debugging, errors, or insights:
 * - "the issue was ...", "the problem was ...", "fixed by ..."
 * - "lesson learned ...", "note to self ...", "remember to ..."
 * - "error:", "bug:", "found that ...", "turns out ..."
 */
function extractLessonsFromMessages(
  messages: Array<{ role: string; content: string }>,
): string[] {
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

// Track sessions we've already processed to avoid duplicates
const processedSessions = new Set<string>()

// ---------------------------------------------------------------------------
// Plugin export
// ---------------------------------------------------------------------------

export const SessionKnowledge: Plugin = async ({
  client,
  directory,
  worktree,
}) => {
  const rootDir = worktree || directory
  const decisionLogPath = join(rootDir, ".forge", "knowledge", "decision-log.md")
  const lessonsPath = join(rootDir, ".forge", "knowledge", "lessons-learned.md")

  return {
    event: async ({ event }) => {
      // ----- session.idle: extract and persist knowledge -----
      if (event.type === "session.idle") {
        const sessionId = (event.properties as { id?: string })?.id
        if (!sessionId) return
        if (processedSessions.has(sessionId)) return
        processedSessions.add(sessionId)

        try {
          // Get session messages
          const messagesResult = await client.session.messages({
            path: { id: sessionId },
          })

          if (!messagesResult.data) return

          // Flatten messages into role + content pairs
          const messages: Array<{ role: string; content: string }> = []
          for (const msg of messagesResult.data) {
            const role = msg.info?.role || "unknown"
            const textParts = (msg.parts || [])
              .filter(
                (p: { type?: string }) => p.type === "text",
              )
              .map(
                (p: { type?: string; text?: string }) => p.text || "",
              )
            if (textParts.length > 0) {
              messages.push({
                role,
                content: textParts.join("\n"),
              })
            }
          }

          if (messages.length === 0) return

          // Extract decisions
          const decisions = extractDecisionsFromMessages(messages)
          if (decisions.length > 0 && (await fileExists(decisionLogPath))) {
            const date = formatDate()
            let entry = `\n### ${date} — Session ${sessionId.slice(0, 8)}\n\n`
            for (const decision of decisions) {
              entry += `- ${decision}\n`
            }
            entry += `\n`

            try {
              await appendFile(decisionLogPath, entry, "utf-8")
            } catch {
              // Non-critical — log append failed
            }
          }

          // Extract lessons (only for debugging-heavy sessions)
          const lessons = extractLessonsFromMessages(messages)
          if (lessons.length > 0 && (await fileExists(lessonsPath))) {
            const date = formatDate()
            let entry = `\n### ${date} — Session ${sessionId.slice(0, 8)}\n\n`
            for (const lesson of lessons) {
              entry += `- ${lesson}\n`
            }
            entry += `\n`

            try {
              await appendFile(lessonsPath, entry, "utf-8")
            } catch {
              // Non-critical — log append failed
            }
          }
        } catch {
          // Session message retrieval failed — non-critical
        }
      }
    },

    // ----- Compaction: inject knowledge into continuation context -----
    "experimental.session.compacting": async (_input, output) => {
      const contextChunks: string[] = []

      // Inject last 10 decisions
      if (await fileExists(decisionLogPath)) {
        try {
          const content = await readFile(decisionLogPath, "utf-8")
          const recentDecisions = extractLastEntries(content, 10)
          if (recentDecisions.length > 0) {
            contextChunks.push(
              `## Recent Decisions (from .forge/knowledge/decision-log.md)\n\n` +
                recentDecisions.join("\n\n"),
            )
          }
        } catch {
          // Non-critical
        }
      }

      // Inject last 5 lessons
      if (await fileExists(lessonsPath)) {
        try {
          const content = await readFile(lessonsPath, "utf-8")
          const recentLessons = extractLastEntries(content, 5)
          if (recentLessons.length > 0) {
            contextChunks.push(
              `## Recent Lessons Learned (from .forge/knowledge/lessons-learned.md)\n\n` +
                recentLessons.join("\n\n"),
            )
          }
        } catch {
          // Non-critical
        }
      }

      if (contextChunks.length > 0) {
        output.context.push(
          `# FORGE Persistent Knowledge\n\n` +
            `The following knowledge was extracted from previous sessions. ` +
            `Use it to maintain consistency and avoid repeating mistakes.\n\n` +
            contextChunks.join("\n\n---\n\n"),
        )
      }
    },
  }
}
