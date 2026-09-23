/**
 * spec-watcher — CLI entry (OpenCode v2 native).
 *
 * Monitors `.forge/specs/` for changes and checks consistency:
 *   1. Whether corresponding plan.md and/or tasks.md exist
 *   2. Lightweight requirement drift:
 *      - New requirements in spec not in the plan/tasks?
 *      - Removed requirements the plan still references?
 * Shows an advisory toast suggesting /forge-analyze on drift.
 */

import { Plugin } from "@opencode/plugin/tui"
import { readFile } from "node:fs/promises"
import { basename } from "node:path"

import {
  getSpecDir,
  isWatchedSpecFile,
  checkSpecConsistency,
  formatWatcherMessage,
} from "./shared"

// Debounce: track recently checked spec dirs (per terminal client).
const recentlyChecked = new Map<string, number>()
const DEBOUNCE_MS = 15_000

function shouldDebounce(specDir: string): boolean {
  const now = Date.now()
  const lastCheck = recentlyChecked.get(specDir)
  if (lastCheck && now - lastCheck < DEBOUNCE_MS) return true
  recentlyChecked.set(specDir, now)
  return false
}

export default Plugin.define({
  id: "forge.spec-watcher.tui",
  setup(context) {
    // `file.edited` naming follows the dotted server-event convention;
    // T-016 verifies it at runtime.
    const stop = context.data.listen((wrapper) => {
      const details = (wrapper as { details?: unknown }).details as
        | { type?: unknown; properties?: unknown }
        | undefined
      if (details?.type !== "file.edited") return
      const filePath = (details.properties as { file?: unknown } | undefined)?.file
      if (typeof filePath !== "string" || filePath.length === 0) return

      const loc = context.location ?? context.data.location.default()
      const rootDir =
        (loc as { directory?: unknown }).directory ?? process.cwd()
      if (typeof rootDir !== "string") return
      if (!isWatchedSpecFile(rootDir, filePath)) return

      const specDir = getSpecDir(filePath, rootDir)
      if (!specDir) return
      if (shouldDebounce(specDir)) return

      void (async () => {
        let specContent: string
        try {
          specContent = await readFile(filePath, "utf-8")
        } catch {
          return
        }

        const issues = await checkSpecConsistency(specDir, specContent)
        const message = formatWatcherMessage(basename(specDir), issues)
        if (!message) return
        try {
          context.ui.toast.show({ message, variant: "info" })
        } catch {
          // Toast display failed — non-critical
        }
      })().catch(() => {
        // Check pipeline failed — non-critical
      })
    })

    return () => stop()
  },
})
