/**
 * pre-commit-gate — CLI entry (OpenCode v2 native).
 *
 * Listens for file edits in the terminal client and shows an advisory
 * toast when a spec-tracked source file has open validation issues
 * (incomplete tasks, missing tests, clarification markers, constitution
 * gaps). Advisory only — never blocks.
 */

import { Plugin } from "@opencode/plugin/tui"

import {
  findRelatedSpec,
  checkTaskCompletion,
  checkTestExists,
  checkClarificationMarkers,
  checkConstitutionCompliance,
  formatGateMessage,
  gateVariant,
  isCheckablePath,
  type GateIssue,
} from "./shared"

// Debounce: skip files checked in the last 30s (per terminal client).
const recentlyChecked = new Set<string>()
const DEBOUNCE_MS = 30_000

function debounceFile(filePath: string): boolean {
  if (recentlyChecked.has(filePath)) return true
  recentlyChecked.add(filePath)
  setTimeout(() => recentlyChecked.delete(filePath), DEBOUNCE_MS)
  return false
}

export default Plugin.define({
  id: "forge.pre-commit-gate.tui",
  setup(context) {
    // `file.edited` naming follows the dotted server-event convention
    // (`permission.asked`, `session.idle`); T-016 verifies it at runtime.
    const stop = context.data.listen((wrapper) => {
      const details = (wrapper as { details?: unknown }).details as
        | { type?: unknown; properties?: unknown }
        | undefined
      if (details?.type !== "file.edited") return
      const file = (details.properties as { file?: unknown } | undefined)?.file
      if (typeof file !== "string" || file.length === 0) return

      const loc = context.location ?? context.data.location.default()
      const rootDir =
        (loc as { directory?: unknown }).directory ?? process.cwd()
      if (typeof rootDir !== "string") return

      if (debounceFile(file)) return
      if (!isCheckablePath(rootDir, file)) return

      void (async () => {
        const spec = await findRelatedSpec(rootDir, file)
        if (!spec) return // No spec tracking this file, skip

        const allIssues: GateIssue[] = []
        const [taskIssues, testIssues, clarifyIssues, complianceIssues] =
          await Promise.all([
            checkTaskCompletion(spec.specDir, file, rootDir),
            checkTestExists(rootDir, file),
            checkClarificationMarkers(spec.specDir),
            checkConstitutionCompliance(spec.specDir),
          ])
        allIssues.push(
          ...taskIssues,
          ...testIssues,
          ...clarifyIssues,
          ...complianceIssues,
        )

        const message = formatGateMessage(spec.specId, allIssues)
        if (!message) return
        try {
          // Toast variants (`info`/`error`) follow the v1 surface;
          // T-016 verifies the accepted set at runtime.
          context.ui.toast.show({ message, variant: gateVariant(allIssues) })
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
