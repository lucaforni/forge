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
 */

import { pathToFileURL } from "node:url"
import { run, CliOptions, EXIT_USAGE } from "./installer/install"
import { setVerbose } from "./installer/log"
import { detectProjectState } from "./installer/detect"
import type { Platform } from "./installer/types"

// ---------------------------------------------------------------------------
// CLI Argument Parser
// ---------------------------------------------------------------------------

export interface ParsedArgs {
  targetRoot?: string
  options: CliOptions
  showHelp: boolean
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

Exit codes:
  0  success
  2  no supported platform detected in the target
  3  projection check failed
  4  invalid invocation (unknown flag, bad --platform value, or --update
     with nothing to update)

Examples:
  bun install-forge.ts                          # Install to current dir
  bun install-forge.ts /path/to/project         # Install to specific dir
  bun install-forge.ts --dry-run                # Preview without writing
  bun install-forge.ts --platform=claude-code   # Force Claude Code install
`)
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const parsed = parseArgs(process.argv)

  if (parsed.showHelp) {
    showHelp()
    process.exit(0)
  }

  if (parsed.errors.length > 0) {
    for (const err of parsed.errors) console.error(`[install-forge] Error: ${err}`)
    console.error(`[install-forge] Run with --help for usage.`)
    process.exit(EXIT_USAGE)
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
const isEntryPoint =
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href

if (isEntryPoint) {
  main().catch((err) => {
    console.error(`[install-forge] Fatal error:`, err)
    process.exit(1)
  })
}
