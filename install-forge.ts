#!/usr/bin/env node
/**
 * FORGE Installation & Update Script — CLI Shim (v2.0.0)
 *
 * Thin entry point that parses CLI arguments and delegates to the
 * installer/ modules. All logic lives in installer/.
 *
 * Usage:
 *   bun install-forge.ts /path/to/target/project [options]
 *
 * Options:
 *   --dry-run         Plan without writing files
 *   --check           Verify projection correctness
 *   --platform=<name> Override platform detection (comma-separated)
 *   --interactive     Interactive mode for drifted files
 *   --force           Overwrite without backup
 *   --verbose         Detailed logging
 *   --update          Update existing installation
 *   --help            Show this help
 *
 * Reconfigure (011): --reconfigure --provider=<id> --policy=<quality|speed|cheap>
 *   [--list] [--dry-run] [--yes] [--allow-free-private]
 */

import { realpathSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { run, CliOptions, EXIT_USAGE } from "./installer/install"
import { setVerbose } from "./installer/log"
import { runReconfigure } from "./installer/model-config"
import type { Platform } from "./installer/types"

// ---------------------------------------------------------------------------
// CLI Argument Parser
// ---------------------------------------------------------------------------

export interface ParsedArgs {
  targetRoot?: string
  options: CliOptions
  showHelp: boolean
  /**
   * Reconfigure mode (011): set when `--reconfigure` or `--list` is passed.
   * Handled entirely by `installer/model-config.ts`; the install path in
   * `run()` never reads this field, so existing flag behaviour is preserved.
   */
  reconfigure?: {
    provider?: string
    policy?: string
    list?: boolean
    yes?: boolean
    allowFreePrivate?: boolean
  }
  /** Usage errors. When non-empty the caller must not proceed. */
  errors: string[]
}

/** Platforms the installer understands. Checked before anything else. */
const KNOWN_PLATFORMS: readonly string[] = ["opencode", "claude-code", "codex"]

export function parseArgs(argv: string[]): ParsedArgs {
  const result: ParsedArgs = { options: {}, showHelp: false, errors: [] }
  const args = argv.slice(2) // skip node + script path

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]

    switch (true) {
      case arg === "--help" || arg === "-h":
        result.showHelp = true
        break
      case arg === "--dry-run":
        result.options.dryRun = true
        break
      case arg === "--check":
        result.options.check = true
        break
      case arg === "--platform":
        result.errors.push(
          `"--platform" needs the "=" form: --platform=opencode,claude-code.`,
        )
        break
      case arg.startsWith("--platform="): {
        const raw = arg.slice("--platform=".length)
        const platforms = raw.split(",").map((p) => p.trim()).filter((p) => p !== "")
        const unknown = platforms.filter((p) => !KNOWN_PLATFORMS.includes(p))
        if (platforms.length === 0) {
          result.errors.push(
            `--platform= needs at least one platform. Supported: ${KNOWN_PLATFORMS.join(", ")}.`,
          )
        } else if (unknown.length > 0) {
          result.errors.push(
            `Unknown platform(s): ${unknown.join(", ")}. Supported: ${KNOWN_PLATFORMS.join(", ")}.`,
          )
        } else {
          result.options.platform = platforms as Platform[]
        }
        break
      }
      case arg === "--interactive":
        result.options.interactive = true
        break
      case arg === "--force":
        result.options.force = true
        break
      case arg === "--verbose":
        result.options.verbose = true
        break
      case arg === "--update":
        result.options.update = true
        break
      case arg === "--reconfigure":
        result.reconfigure = { ...result.reconfigure }
        break
      case arg === "--list":
        result.reconfigure = { ...result.reconfigure, list: true }
        break
      case arg === "--yes":
        result.reconfigure = { ...result.reconfigure, yes: true }
        break
      case arg === "--allow-free-private":
        result.reconfigure = { ...result.reconfigure, allowFreePrivate: true }
        break
      case arg.startsWith("--provider="): {
        const value = arg.slice("--provider=".length).trim()
        if (value === "") {
          result.errors.push(`"--provider=" needs a value: --provider=<id>.`)
        } else {
          result.reconfigure = { ...result.reconfigure, provider: value }
        }
        break
      }
      case arg.startsWith("--policy="): {
        const value = arg.slice("--policy=".length).trim()
        if (value === "") {
          result.errors.push(`"--policy=" needs a value: --policy=<quality|speed|cheap>.`)
        } else {
          result.reconfigure = { ...result.reconfigure, policy: value }
        }
        break
      }
      case !arg.startsWith("-"):
        // Positional arg: target project path. A second positional is
        // almost certainly a swallowed flag value (e.g. `--provider openai`
        // silently installing into `./openai`), so it is an error, not a
        // silent override.
        if (result.targetRoot === undefined) {
          result.targetRoot = arg
        } else {
          result.errors.push(
            `Unexpected extra argument: "${arg}" (target is already "${result.targetRoot}"). ` +
              `Did you pass a value to a flag that takes none?`,
          )
        }
        break
      default:
        // Unknown flags used to warn and continue, which let a typo'd value
        // become the install target. Fail instead.
        result.errors.push(
          `Unknown option: "${arg}". See --help for the supported flags.`,
        )
    }
  }

  return result
}

// ---------------------------------------------------------------------------
// Help
// ---------------------------------------------------------------------------

function showHelp(): void {
  console.log(`
FORGE Installer v2.0.0 — Cross-Platform

Usage:
  bun install-forge.ts [target] [options]

Arguments:
  target                Project directory (default: current directory)

Options:
  --dry-run             Plan without writing files
  --check               Verify projection correctness
  --platform=<names>    Override platform detection (comma-separated:
                        opencode,claude-code,codex)
  --update              Require an existing install; fail if the target has
                        none (without it, fresh vs update is auto-detected)
  --interactive         Accepted for compatibility; per-file prompts are not
                        implemented, so the installer warns once and proceeds
                        non-interactively with automatic backups
  --force               Overwrite without backup
  --verbose             Detailed logging
  --help                Show this help

  Reconfigure (model presets, 011):
  --reconfigure         Regenerate model/providers/agents in opencode.json
                        from a provider preset (requires --provider + --policy)
  --provider=<id>       Preset id (see --reconfigure --list)
  --policy=<p>          REQUIRED: quality | speed | cheap (no default)
  --list                List presets (use with --reconfigure)
  --yes                 Confirm paid upgrades / free-on-private (for CI)
  --allow-free-private  Confirm -free models on private repos
  (Note: --dry-run also previews a reconfigure without writing.)

Exit codes:
  0  success
  1  fatal/internal error (unexpected exception)
  2  no supported platform detected in the target
  3  projection check failed
  4  invalid invocation (unknown flag, bad --platform value, or --update
     with nothing to update)

Examples:
  bun install-forge.ts                          # Install to current dir
  bun install-forge.ts /path/to/project         # Install to specific dir
  bun install-forge.ts --dry-run                # Preview without writing
  bun install-forge.ts --platform=claude-code   # Force Claude Code install
  bun install-forge.ts . --reconfigure --provider=github-copilot --policy=quality
  bun install-forge.ts . --reconfigure --list    # Show presets
`)
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const parsed = parseArgs(process.argv)

  if (parsed.errors.length > 0) {
    for (const err of parsed.errors) console.error(`[install-forge] Error: ${err}`)
    if (parsed.showHelp) {
      showHelp()
    } else {
      console.error(`[install-forge] Run with --help for usage.`)
    }
    process.exit(EXIT_USAGE)
  }

  if (parsed.showHelp) {
    showHelp()
    process.exit(0)
  }

  // Reconfigure mode (011/ADR-005): thin alias over installer/model-config.ts.
  // The install path below never runs in this mode.
  if (parsed.reconfigure) {
    const result = runReconfigure({
      projectRoot: parsed.targetRoot ?? process.cwd(),
      provider: parsed.reconfigure.provider,
      policy: parsed.reconfigure.policy,
      list: parsed.reconfigure.list,
      dryRun: parsed.options.dryRun,
      yes: parsed.reconfigure.yes,
      allowFreePrivate: parsed.reconfigure.allowFreePrivate,
    })
    console.log(result.output)
    process.exit(result.exitCode)
  }

  if (parsed.options.verbose) {
    setVerbose(true)
  }

  const result = await run({
    targetRoot: parsed.targetRoot,
    ...parsed.options,
  })

  process.exit(result.exitCode)
}

// Only run when this file is the process entry point. Importing it — for
// example, to unit-test parseArgs — must never execute the installer.
// Without this guard, `import ... from "../../install-forge"` in a test
// ran a full install into the repository itself (target defaulting to cwd),
// rewriting the repo's own opencode.json mid-suite.
// Compare real paths, not URL strings: through a symlink (the normal shape
// of a global install) the argv href and the module URL differ, and the old
// strict comparison silently skipped main() — exiting 0 having done nothing.
let isEntryPoint = false
try {
  isEntryPoint =
    process.argv[1] !== undefined &&
    realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)
} catch {
  isEntryPoint = false
}

if (isEntryPoint) {
  main().catch((err) => {
    console.error(`[install-forge] Fatal error:`, err)
    process.exit(1)
  })
}
