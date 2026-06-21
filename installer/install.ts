/**
 * installer/install.ts — Top-level install orchestrator.
 *
 * Chains the full install pipeline:
 *   detect → plan → drift-check → backup → execute → manifest → summary
 *
 * This is the entry point called by the CLI shim (install-forge.ts).
 */

import { existsSync, mkdirSync, writeFileSync, readFileSync, appendFileSync } from "node:fs"
import { join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { createHash } from "node:crypto"
import type { Platform, PlatformDescriptor, InstallPlan, InstallOperation, InstallResult } from "./types"

import { detectProjectState } from "./detect"
import { buildInstallPlan, catalogCanonicalArtifacts } from "./projection"
import { readManifest, writeManifest, createManifest, needsManifestSynthesis } from "./manifest"
import { buildDefaultConfig } from "./config"
import { detectDrift } from "./drift"
import { backupDriftedFiles, ensureBackupGitignore } from "./backup"
import { log, section, summary } from "./log"

import { OPENCODE_DESCRIPTOR, generateOpenCodeConfig } from "./platforms/opencode"
import { CLAUDE_CODE_DESCRIPTOR, generateClaudeCodeConfig, generateClaudeMd } from "./platforms/claude-code"
import { CODEX_DESCRIPTOR, generateCodexConfig } from "./platforms/codex"

// ---------------------------------------------------------------------------
// Resolve FORGE source root (ESM-safe replacement for __dirname)
// ---------------------------------------------------------------------------

const _filename = fileURLToPath(import.meta.url)
const _dirname = resolve(join(_filename, ".."))

// ---------------------------------------------------------------------------
// Platform Descriptor Registry
// ---------------------------------------------------------------------------

const DESCRIPTORS: Record<Platform, PlatformDescriptor> = {
  "opencode": OPENCODE_DESCRIPTOR,
  "claude-code": CLAUDE_CODE_DESCRIPTOR,
  "codex": CODEX_DESCRIPTOR,
}

// ---------------------------------------------------------------------------
// Config Emitters
// ---------------------------------------------------------------------------

type ConfigEmitter = (model: ReturnType<typeof buildDefaultConfig>) => { path: string; content: string; instructionsContent?: string }

const CONFIG_EMITTERS: Partial<Record<Platform, ConfigEmitter>> = {
  "opencode": (model) => ({
    path: OPENCODE_DESCRIPTOR.configFile,
    content: generateOpenCodeConfig(model),
  }),
  "claude-code": (model) => ({
    path: CLAUDE_CODE_DESCRIPTOR.configFile,
    content: generateClaudeCodeConfig(model),
    instructionsContent: generateClaudeMd(),
  }),
  "codex": (model) => ({
    path: CODEX_DESCRIPTOR.configFile,
    content: generateCodexConfig(model),
  }),
}

// ---------------------------------------------------------------------------
// CLI Options
// ---------------------------------------------------------------------------

export interface CliOptions {
  /** Target project root (defaults to cwd). */
  targetRoot?: string
  /** Dry-run: plan but don't write. */
  dryRun?: boolean
  /** Check-only: verify projection correctness, exit 3 on mismatch. */
  check?: boolean
  /** Override detected platforms. */
  platform?: Platform[]
  /** Interactive mode: prompt per drifted file. */
  interactive?: boolean
  /** Force overwrite without backup. */
  force?: boolean
  /** Verbose logging. */
  verbose?: boolean
}

// ---------------------------------------------------------------------------
// Main Entry
// ---------------------------------------------------------------------------

/**
 * Run the full install pipeline.
 * This is the single entry point called by the CLI shim.
 */
export async function run(options: CliOptions = {}): Promise<InstallResult> {
  const projectRoot = resolve(options.targetRoot ?? process.cwd())
  const isDryRun = options.dryRun ?? false
  const isCheck = options.check ?? false

  log("plan", `FORGE v2.0.0 cross-platform installer`)
  log("info", `Target: ${projectRoot}`)
  console.log("")

  // Step 1: Detect platforms
  section("Platform Detection")
  const state = detectProjectState(projectRoot)
  const platforms = options.platform ?? state.platforms

  if (platforms.length === 0) {
    log("err", "No supported platform detected.")
    log("info", "FORGE supports: OpenCode (.opencode/), Claude Code (.claude/), Codex CLI (.codex/)")
    log("info", "Create one of these directories or use --platform to override.")
    return { success: false, installed: [], warnings: [], exitCode: 2 }
  }

  for (const p of platforms) {
    log("ok", `Detected: ${DESCRIPTORS[p].label} (${DESCRIPTORS[p].rootDir}/)`)
  }

  // Step 2: Read existing manifest (or synthesize from pre-2.0 install)
  let existingManifest = readManifest(projectRoot)
  const needsSynthesis = needsManifestSynthesis(projectRoot)
  const isUpdate = existingManifest !== null || needsSynthesis

  if (needsSynthesis) {
    log("info", "Pre-2.0 installation detected — synthesizing install manifest...")
    // Walk existing .opencode/ tree, checksum every file, create manifest
    const opencodeDir = join(projectRoot, ".opencode")
    const synthesizedChecksums: Record<string, string> = {}
    if (existsSync(opencodeDir)) {
      const artifacts = catalogCanonicalArtifacts(resolve(_dirname, ".."))
[...]
    resolve(_dirname, ".."),      // FORGE source root (repo root)
    projectRoot,
    existingManifest?.checksums,
  )

  // Step 4: Config generation
  const configModel = buildDefaultConfig(projectRoot)
  for (const platform of platforms) {
    const emitter = CONFIG_EMITTERS[platform]
    if (!emitter) {
      log("skip", `Config generation not available for ${platform}`)
      continue
    }
    const config = emitter(configModel)
    plan.operations.push({
      platform,
      kind: isUpdate ? "update" : "create",
      targetPath: join(projectRoot, config.path),
      content: config.content,
      reason: "platform config",
    })
    // Project instructions (CLAUDE.md / AGENTS.md)
    if (config.instructionsContent) {
      plan.operations.push({
        platform,
        kind: isUpdate ? "update" : "create",
        targetPath: join(projectRoot, DESCRIPTORS[platform].projectInstructions),
        content: config.instructionsContent,
        reason: "project instructions",
      })
    }
  }

  // Report plan
  // Compute per-platform operation counts
  const createsByPlatform: Record<string, number> = {}
  const updatesByPlatform: Record<string, number> = {}
  for (const op of plan.operations) {
    if (op.kind === "create") createsByPlatform[op.platform] = (createsByPlatform[op.platform] ?? 0) + 1
    if (op.kind === "update") updatesByPlatform[op.platform] = (updatesByPlatform[op.platform] ?? 0) + 1
  }
  const totalCreates = plan.operations.filter((o) => o.kind === "create").length
  const totalUpdates = plan.operations.filter((o) => o.kind === "update").length
  const totalSkips = plan.operations.filter((o) => o.kind === "skip").length
  const totalBackups = plan.operations.filter((o) => o.kind === "backup").length

  log("info", `Operations: ${totalCreates} create, ${totalUpdates} update, ${totalSkips} skip, ${totalBackups} backup (all platforms)`)

  // Step 5: Check mode — verify projection matches expected, don't write
  if (isCheck) {
    log("info", "Check mode: verifying projection correctness...")
    // Check that the plan is coherent (no missing source dirs, etc.)
    const sourceExists = existsSync(join(projectRoot, ".opencode"))
    if (!sourceExists && platforms.includes("opencode")) {
      log("err", "Projection check failed: .opencode/ source not found for OpenCode platform")
      return { success: false, installed: platforms, warnings: [], exitCode: 3 }
    }
    log("ok", "Projection check passed.")
    return { success: true, installed: platforms, warnings: [], exitCode: 0 }
  }

  // Step 6: Dry run — stop here
  if (isDryRun) {
    log("ok", "Dry run complete. Use without --dry-run to install.")
    return { success: true, installed: platforms, warnings: [], exitCode: 0 }
  }

  // Step 7: Execute install
  section("Installing")
  const warnings: string[] = []
  const backupPaths: string[] = []
  const newChecksums: Record<string, string> = { ...existingManifest?.checksums }

  // Ensure required directories
  for (const dir of plan.requiredDirectories) {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true })
      if (options.verbose) log("info", `Created directory: ${dir}`)
    }
  }

  // Execute operations
  for (const op of plan.operations) {
    switch (op.kind) {
      case "create":
      case "update":
        writeFileSync(op.targetPath, op.content!, "utf-8")
        newChecksums[op.targetPath] = createHash("sha256").update(op.content!, "utf-8").digest("hex")
        if (options.verbose) log(op.kind === "create" ? "new" : "upd", op.targetPath)
        break

      case "backup": {
        if (options.interactive) {
          // TODO: interactive prompt — show diff, ask overwrite/keep/merge
          log("warn", `Interactive backup for ${op.targetPath} — showing diff (future)`)
        }
        if (options.force) {
          log("warn", `Force mode: overwriting ${op.targetPath} without backup`)
          writeFileSync(op.targetPath, op.content!, "utf-8")
          newChecksums[op.targetPath] = createHash("sha256").update(op.content!, "utf-8").digest("hex")
        } else {
          // Backup and overwrite
          const driftEntries = [{
            filePath: op.targetPath,
            classification: "drift" as const,
            expectedChecksum: op.previousChecksum ?? null,
            actualChecksum: null,
          }]
          const result = backupDriftedFiles(driftEntries, projectRoot)
          backupPaths.push(...result.backupPaths)
          ensureBackupGitignore(projectRoot)

          writeFileSync(op.targetPath, op.content!, "utf-8")
          newChecksums[op.targetPath] = createHash("sha256").update(op.content!, "utf-8").digest("hex")
          log("warn", `Backed up: ${op.targetPath}`)
        }
        break
      }

      case "skip":
        // No action needed
        break
    }
  }

  // Step 8: Write manifest
  section("Summary")
  const manifestPath = writeManifest(projectRoot, createManifest(
    platforms,
    newChecksums,
    [".forge/.install-manifest.json"],
  ))
  log("ok", `Install manifest written: ${manifestPath}`)

  // Print summary (per-platform)
  for (const p of platforms) {
    const pc = createsByPlatform[p] ?? 0
    const pu = updatesByPlatform[p] ?? 0
    summary(`✓ ${DESCRIPTORS[p].label}: ${pc} created, ${pu} updated`)
  }
  if (backupPaths.length > 0) {
    log("warn", `${backupPaths.length} file(s) backed up:`)
    for (const bp of backupPaths) {
      summary(`  ${bp}`)
    }
  }
  if (warnings.length > 0) {
    for (const w of warnings) {
      log("warn", w)
    }
  }

  log("ok", "FORGE installation complete.")
  return { success: true, installed: platforms, warnings, backupPaths, manifestPath, exitCode: 0 }
}
