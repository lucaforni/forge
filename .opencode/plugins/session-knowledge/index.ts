/**
 * session-knowledge — Persistent knowledge extraction and injection.
 *
 * OpenCode v2 native plugin (`@opencode/plugin`). Server-side only: it needs
 * no UI surface, so there is no `tui.ts` entry.
 *
 * On every model request (`context` via `ctx.session.hook`):
 *   - Injects `.forge/constitution.md` and the recent decision log as system
 *     context. This is FORGE's governance path on v2: the `instructions`
 *     config key is accepted by v2 but never resolved.
 *
 * On `session.idle` (via `ctx.event.subscribe`):
 *   - Scans conversation for decisions and lessons
 *   - Appends structured entries to decision-log.md and lessons-learned.md
 *
 * On `compaction` (via `ctx.session.hook`):
 *   - Re-injects last 10 decisions and last 5 lessons as system context
 *   - Ensures persistent knowledge survives context compaction
 */

import { Plugin } from "@opencode/plugin"
import { readFile, appendFile } from "node:fs/promises"
import { join } from "node:path"

import {
  fileExists,
  formatDate,
  extractLastEntries,
  extractDecisionsFromMessages,
  extractLessonsFromMessages,
  flattenMessages,
  hashString,
  loadGovernanceText,
  pushGovernance,
} from "./shared"

// Track sessions already processed to avoid duplicates.
const processedSessions = new Set<string>()

/**
 * Governance text already injected per session. The `context` hook fires on
 * every agent-loop request including tool-driven continuations, and the
 * model retains earlier system parts in history — so re-sending the full
 * constitution on each call would burn tokens for no new information.
 * Re-inject only when the text actually changed (constitution or decision
 * log edited mid-session). Compaction summaries are covered separately by
 * the `compaction` hook below, which always injects.
 */
const injectedGovernanceHash = new Map<string, string>()

async function readUtf8(path: string): Promise<string> {
  try {
    return await readFile(path, "utf-8")
  } catch {
    return ""
  }
}

export default Plugin.define({
  id: "forge.session-knowledge",
  async setup(ctx) {
    // V1 used `worktree || directory`; v2 locations expose only the load
    // directory (T-017 verifies worktree-session behavior at runtime).
    const rootDir = ctx.location.directory
    const decisionLogPath = join(rootDir, ".forge", "knowledge", "decision-log.md")
    const lessonsPath = join(rootDir, ".forge", "knowledge", "lessons-learned.md")

    // ----- Context: load FORGE governance into every model request -----
    // OpenCode v2 ignores the `instructions` config key, so this hook is what
    // actually keeps the constitution and decision log in front of the model.
    // The files are small (~8KB total) and read through the page cache, so
    // they are re-read on each call; the per-session hash gate below is what
    // avoids re-sending unchanged text on every tool continuation.
    await ctx.session.hook("context", async (event) => {
      const text = await loadGovernanceText(rootDir, readUtf8)
      if (text === null) return

      const sessionID = (event as { sessionID?: unknown }).sessionID
      if (typeof sessionID === "string" && sessionID.length > 0) {
        const hash = hashString(text)
        if (injectedGovernanceHash.get(sessionID) === hash) return
        injectedGovernanceHash.set(sessionID, hash)
      }

      pushGovernance(event, text)
    })

    // ----- Compaction: inject knowledge into the continuation context -----
    await ctx.session.hook("compaction", async (event) => {
      const contextChunks: string[] = []

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
        // `system` is the documented mutable draft on context hooks; guard
        // the shape so an SDK drift degrades to a no-op, not a crash.
        const system = (event as { system?: unknown }).system
        if (Array.isArray(system)) {
          system.push({
            type: "text",
            text:
              `# FORGE Persistent Knowledge\n\n` +
              `The following knowledge was extracted from previous sessions. ` +
              `Use it to maintain consistency and avoid repeating mistakes.\n\n` +
              contextChunks.join("\n\n---\n\n"),
          })
        }
      }
    })

    // ----- Idle: extract and persist knowledge -----
    const controller = new AbortController()
    void (async () => {
      for await (const event of ctx.event.subscribe({ signal: controller.signal })) {
        if (event.type !== "session.idle") continue
        const sessionId = (event as { properties?: { id?: unknown } }).properties?.id
        if (typeof sessionId !== "string" || sessionId.length === 0) continue
        if (processedSessions.has(sessionId)) continue
        processedSessions.add(sessionId)

        try {
          const raw = await ctx.session.context({ sessionID: sessionId })
          const messages = flattenMessages(raw)
          if (messages.length === 0) continue

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
    })()

    return () => controller.abort()
  },
})
