/**
 * spec-watcher — Server entry (OpenCode v2 native).
 *
 * Advisory spec-consistency checks are delivered by the CLI entry
 * (`tui.ts`): toasts only exist in the terminal client. This server entry
 * registers the plugin ID on the service so it appears in the active
 * plugin list; all detection logic lives in `shared.ts`.
 */

import { Plugin } from "@opencode/plugin"

export default Plugin.define({
  id: "forge.spec-watcher",
  setup() {},
})
