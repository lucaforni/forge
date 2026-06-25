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

import { run, CliOptions } from "./installer/install"
import { setVerbose } from "./installer/log"
import { detectProjectState } from "./installer/detect"
import type { Platform } from "./installer/types"

// ---------------------------------------------------------------------------
// CLI Argument Parser
// ---------------------------------------------------------------------------

interface ParsedArgs {
  targetRoot?: string
  options: CliOptions
  showHelp: boolean
}

function parseArgs(argv: string[]): ParsedArgs {
  const result: ParsedArgs = { options: {}, showHelp: false }
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
      case arg.startsWith("--platform="):
        const platforms = arg.slice("--platform=".length).split(",").map((p) => p.trim()) as Platform[]
        result.options.platform = platforms
        break
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
        // Update is auto-detected; flag is accepted but not needed
        break
      case !arg.startsWith("--"):
        // Positional arg: target project path
        result.targetRoot = arg
        break
      default:
        console.warn(`Unknown option: ${arg}`)
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
  --interactive         Interactive mode for drifted files
  --force               Overwrite without backup
  --verbose             Detailed logging
  --help                Show this help

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

  if (parsed.options.verbose) {
    setVerbose(true)
  }

  const result = await run({
    targetRoot: parsed.targetRoot,
    ...parsed.options,
  })

  process.exit(result.exitCode)
}

main().catch((err) => {
  console.error(`[install-forge] Fatal error:`, err)
  process.exit(1)
})
