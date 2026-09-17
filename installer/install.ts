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
import { spawnSync } from "node:child_process"
import type { Platform, PlatformDescriptor, InstallPlan, InstallOperation, InstallResult } from "./types"

import { detectProjectState } from "./detect"
import { buildInstallPlan, catalogCanonicalArtifacts, SCAFFOLD_FILES } from "./projection"
import { readManifest, writeManifest, createManifest, needsManifestSynthesis } from "./manifest"
import { buildDefaultConfig, readExistingJsonConfig } from "./config"
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

/**
 * Emits a platform config file.
 *
 * `existing` carries the parsed contents of a config already present in the
 * target, so an emitter can merge rather than clobber (spec 004 FR-009).
 */
type ConfigEmitter = (
  model: ReturnType<typeof buildDefaultConfig>,
  existing?: Record<string, unknown>,
  warnings?: string[],
) => { path: string; content: string; instructionsContent?: string }

/** Where each platform's config file lives, relative to the project root. */
const CONFIG_PATHS: Record<Platform, string> = {
  "opencode": OPENCODE_DESCRIPTOR.configFile,
  "claude-code": CLAUDE_CODE_DESCRIPTOR.configFile,
  "codex": CODEX_DESCRIPTOR.configFile,
}

const CONFIG_EMITTERS: Partial<Record<Platform, ConfigEmitter>> = {
  "opencode": (model, existing, warnings) => ({
    path: OPENCODE_DESCRIPTOR.configFile,
    content: generateOpenCodeConfig(model, existing, warnings),
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
    return { success: false, installed: [], warnings: [], backupPaths: [], exitCode: 2 }
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
      for (const artifact of artifacts) {
        const targetPath = join(projectRoot, ".opencode", artifact.targetPath)
        if (existsSync(targetPath)) {
          const content = readFileSync(targetPath, "utf-8")
          synthesizedChecksums[targetPath] = createHash("sha256").update(content, "utf-8").digest("hex")
        }
      }
    }
    existingManifest = createManifest(platforms, synthesizedChecksums)
  }

  // Step 3: Build install plan
  section("Install Plan")
  const plan = buildInstallPlan(
    platforms,
    DESCRIPTORS,
    resolve(_dirname, ".."),      // FORGE source root (repo root)
    projectRoot,
    existingManifest?.checksums,
  )

  // Step 4: Config generation
  const configModel = buildDefaultConfig(projectRoot)
  const configWarnings: string[] = []
  for (const platform of platforms) {
    const emitter = CONFIG_EMITTERS[platform]
    if (!emitter) {
      log("skip", `Config generation not available for ${platform}`)
      continue
    }
    // Read any config already in the target so the emitter can merge into it
    // instead of overwriting the user's customisations (spec 004 FR-009).
    const configPath = join(projectRoot, CONFIG_PATHS[platform] ?? "")
    const existing = readExistingJsonConfig(configPath)

    if (existing.malformed) {
      const msg = `${CONFIG_PATHS[platform]} could not be parsed — it will be backed up and replaced.`
      log("warn", msg)
      configWarnings.push(msg)
    }

    const config = emitter(configModel, existing.data, configWarnings)
    plan.operations.push({
      platform,
      kind: existing.existed ? "update" : "create",
      targetPath: join(projectRoot, config.path),
      content: config.content,
      // Any pre-existing config is backed up before being replaced, even
      // when its content came from a previous FORGE install.
      backupBeforeWrite: existing.existed,
      reason: existing.existed ? "platform config (merged)" : "platform config",
    })

    // Project instructions (CLAUDE.md). AGENTS.md is scaffolded as a
    // user-owned template by the projection layer and must not be rewritten.
    if (config.instructionsContent) {
      const instructionsPath = join(projectRoot, DESCRIPTORS[platform].projectInstructions)
      if (!existsSync(instructionsPath)) {
        plan.operations.push({
          platform,
          kind: "create",
          targetPath: instructionsPath,
          content: config.instructionsContent,
          reason: "project instructions",
        })
      } else {
        plan.operations.push({
          platform,
          kind: "skip",
          targetPath: instructionsPath,
          reason: "user-owned project instructions",
        })
      }
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

  log("info", `Operations: ${totalCreates} create, ${totalUpdates} update, ${totalSkips} skip, ${totalBackups} backup (all)`)

  // Step 5: Check mode — verify projection matches expected, don't write
  if (isCheck) {
    log("info", "Check mode: verifying projection correctness...")
    // Check that the plan is coherent (no missing source dirs, etc.)
    const sourceExists = existsSync(join(projectRoot, ".opencode"))
    if (!sourceExists && platforms.includes("opencode")) {
      log("err", "Projection check failed: .opencode/ source not found for OpenCode platform")
      return { success: false, installed: platforms, warnings: configWarnings, backupPaths: [], exitCode: 3 }
    }
    log("ok", "Projection check passed.")
    return { success: true, installed: platforms, warnings: configWarnings, backupPaths: [], exitCode: 0 }
  }

  // Step 6: Dry run — stop here
  if (isDryRun) {
    log("ok", "Dry run complete. Use without --dry-run to install.")
    return { success: true, installed: platforms, warnings: configWarnings, backupPaths: [], exitCode: 0 }
  }

  // Step 7: Execute install
  section("Installing")
  const warnings: string[] = [...configWarnings]
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
      case "update": {
        if (op.content === undefined) {
          const msg = `Skipped ${op.targetPath}: operation had no content.`
          log("warn", msg)
          warnings.push(msg)
          break
        }
        if (op.backupBeforeWrite && existsSync(op.targetPath)) {
          const result = backupDriftedFiles(
            [{
              filePath: op.targetPath,
              classification: "drift" as const,
              expectedChecksum: op.previousChecksum ?? null,
              actualChecksum: null,
            }],
            projectRoot,
          )
          backupPaths.push(...result.backupPaths)
          ensureBackupGitignore(projectRoot)
        }
        writeFileSync(op.targetPath, op.content, "utf-8")
        newChecksums[op.targetPath] = createHash("sha256").update(op.content, "utf-8").digest("hex")
        if (options.verbose) log(op.kind === "create" ? "new" : "upd", op.targetPath)
        break
      }

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
  // User-owned files are intentionally excluded from drift comparison: the
  // user is expected to edit them, and their manifest checksum will always
  // be the pristine template. Recording them as drift would produce a false
  // warning on every subsequent run.
  const manifestPath = writeManifest(projectRoot, createManifest(
    platforms,
    newChecksums,
    [
      ".forge/.install-manifest.json",
      ...SCAFFOLD_FILES.map((f) => f.target),
    ],
  ))
  log("ok", `Install manifest written: ${manifestPath}`)

  // Print summary (per-platform)
  for (const p of platforms) {
    const pc = createsByPlatform[p] ?? 0
    const pu = updatesByPlatform[p] ?? 0
    summary(`✓ ${DESCRIPTORS[p].label}: ${pc} created, ${pu} updated`)
  }
  // Print summary for FORGE shared artifacts (.forge/mcp-server/, .forge/frontend/)
  const forgeCreates = createsByPlatform["forge"] ?? 0
  const forgeUpdates = updatesByPlatform["forge"] ?? 0
  if (forgeCreates > 0 || forgeUpdates > 0) {
    summary(`✓ FORGE shared (.forge/): ${forgeCreates} created, ${forgeUpdates} updated`)
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

  // Step 9: Install MCP server npm dependencies (idempotent)
  installMcpServerDeps(projectRoot)

  return { success: true, installed: platforms, warnings, backupPaths, manifestPath, exitCode: 0 }
}

// ---------------------------------------------------------------------------
// Post-Install: MCP server npm install
// ---------------------------------------------------------------------------

/**
 * Run `npm install` in `.forge/mcp-server/` if needed.
 * Called after the main install pipeline completes.
 *
 * Idempotent: a re-install with no dependency change performs no work and
 * touches no network. Running `npm install` unconditionally would violate
 * the "second run writes nothing" guarantee (spec 004 NFR-003) and would
 * make every install depend on network reachability.
 */
export function installMcpServerDeps(projectRoot: string): void {
  const mcpDir = join(projectRoot, ".forge", "mcp-server")
  const mcpPackageJson = join(mcpDir, "package.json")

  if (!existsSync(mcpPackageJson)) return

  // A marker records the package.json checksum that node_modules was built
  // from. Matching marker + present node_modules means there is nothing to do.
  const markerPath = join(mcpDir, "node_modules", ".forge-install-stamp")
  const pkgChecksum = createHash("sha256")
    .update(readFileSync(mcpPackageJson, "utf-8"), "utf-8")
    .digest("hex")

  // Read the stamp directly rather than existsSync-then-read: the
  // check-then-act pair is a file-system race (js/file-system-race), and the
  // absent-file case is already an expected outcome here. Same reasoning as
  // ensureBackupGitignore in backup.ts.
  try {
    if (readFileSync(markerPath, "utf-8").trim() === pkgChecksum) {
      log("skip", "MCP server dependencies already up to date.")
      return
    }
  } catch {
    // Missing or unreadable stamp — fall through and install.
  }

  log("info", "Installing MCP server dependencies (npm install)...")
  const result = spawnSync("npm", ["install", "--silent"], {
    cwd: mcpDir,
    stdio: "inherit",
    encoding: "utf-8",
  })

  if (result.status === 0) {
    log("ok", "MCP server dependencies installed.")
    try {
      writeFileSync(markerPath, pkgChecksum, "utf-8")
    } catch {
      // The stamp is an optimisation; failing to write it only costs a
      // redundant npm install next time.
    }
  } else {
    log("warn", "npm install in .forge/mcp-server/ failed. Run it manually if the MCP server doesn't start.")
  }
}
