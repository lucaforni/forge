/**
 * installer/projection.ts — Install plan builder.
 *
 * Walks the canonical artifacts (.opencode/{agents,commands,skills}/) and
 * produces a complete InstallPlan for the detected platforms.
 */

import { readdirSync, readFileSync, existsSync } from "node:fs"
import { join, resolve, relative, sep } from "node:path"
import { createHash } from "node:crypto"
import type { Platform, PlatformDescriptor, CanonicalArtifact, InstallPlan, InstallOperation } from "./types"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** SHA-256 hex digest of a UTF-8 string. */
function sha256(content: string): string {
  return createHash("sha256").update(content, "utf-8").digest("hex")
}

/**
 * Normalise a path to POSIX separators.
 *
 * Projection rules match on relative paths (e.g. `skills/foo/SKILL.md`).
 * On Windows `relative()` yields backslashes, which would silently defeat
 * every such match, so all comparisons are done on POSIX form.
 */
function toPosix(p: string): string {
  return sep === "/" ? p : p.split(sep).join("/")
}

/**
 * Directory names that are never part of a distributed artifact set.
 *
 * `node_modules` matters most: once `mcp-server/` gained a lockfile,
 * building locally creates `mcp-server/node_modules/`, and an unfiltered
 * walk copied ~3,900 dependency files into every target project. Worse,
 * the catalogue reads every entry as UTF-8, so native `.node` binaries
 * would have been silently corrupted on the way in.
 */
const IGNORED_DIRS = new Set(["node_modules", ".git", "dist", "coverage", ".turbo", ".next"])

/**
 * Recursively walk a directory, returning all file paths.
 *
 * Skips build output, dependency trees and dotted directories — nothing
 * FORGE distributes lives in one, and walking them is how a 89-file install
 * became a 4,028-file install.
 */
function walkDir(dirPath: string): string[] {
  const results: string[] = []
  const entries = readdirSync(dirPath, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = join(dirPath, entry.name)
    if (entry.isDirectory()) {
      if (IGNORED_DIRS.has(entry.name) || entry.name.startsWith(".")) continue
      results.push(...walkDir(fullPath))
    } else {
      results.push(fullPath)
    }
  }
  return results
}

// ---------------------------------------------------------------------------
// Canonical Source
// ---------------------------------------------------------------------------

const CANONICAL_DIRS = ["agents", "commands", "skills"] as const

/**
 * Directories under `.opencode/` that are projected to the platform-neutral
 * `.forge/` root instead of a platform directory.
 *
 * Templates and docs are referenced by agents and commands using a single
 * hardcoded path. Keeping them platform-neutral means that path resolves
 * identically on OpenCode, Claude Code and Codex, instead of being correct
 * on one platform and broken on two. See spec 004 § D-1.
 */
const FORGE_NEUTRAL_DIRS = ["templates", "docs"] as const

/**
 * Meta-development documents that live in `.opencode/docs/` but must never
 * reach a user project (constitution Art. 2.3 / 4.3). These are internal
 * engineering reports, not user documentation.
 */
/** Exported so the coherence test enforces the same boundary the installer ships. */
export const EXCLUDED_DOCS = new Set([
  "automatic-monitoring-setup.md",
  "decision-log-archiviation-implementation.md",
  "pre-flight-checks-implementation.md",
])

/**
 * Templates that are NOT distributed:
 * - `opencode.json*` — the installer generates these per platform
 * - `presets.json` — orphaned v1 provider-preset engine (#72)
 */
const EXCLUDED_TEMPLATES = new Set([
  "opencode.json",
  "opencode.json.example-customized",
  "presets.json",
])

/**
 * `.opencode/plugins/` is OpenCode-specific: the plugins import
 * `@opencode-ai/plugin`. Claude Code hooks are a separate projection
 * problem (#71). See spec 004 § D-3.
 *
 * `.opencode/tools/` is deliberately excluded — it duplicates
 * `mcp-server/src/tools/` with divergent algorithms (#68), and the MCP
 * server is the constitutional cross-platform tool surface (Art. 3.1).
 * See spec 004 § D-2.
 */
const OPENCODE_ONLY_DIRS = ["plugins"] as const

/**
 * Files created once from a template and then owned by the user. The
 * installer writes them on a fresh install and never touches them again.
 */
export const SCAFFOLD_FILES: ReadonlyArray<{ template: string; target: string }> = [
  { template: "constitution.md", target: ".forge/constitution.md" },
  { template: "decision-log.md", target: ".forge/knowledge/decision-log.md" },
  { template: "agents.md", target: "AGENTS.md" },
]

/** Directories scaffolded empty in `.forge/` so FORGE commands have a home. */
const FORGE_SCAFFOLD_DIRS = [
  "specs",
  "architecture",
  "knowledge/adr",
  "epics",
  "sprints/active",
  "sprints/completed",
  "sprints/retrospectives",
  "product",
] as const

/** Frontend files that are user-customizable — created once, never overwritten on update. */
const USER_OWNED_FRONTEND_FILES = new Set(["stack-decisions.md", "design-system.md"])

/** Catalog MCP server artifacts from mcp-server/ source. */
function catalogMcpServerArtifacts(sourceRoot: string): CanonicalArtifact[] {
  const artifacts: CanonicalArtifact[] = []
  const mcpDir = join(sourceRoot, "mcp-server")

  if (!existsSync(mcpDir)) return artifacts

  // Walk all files in mcp-server/ recursively
  const entries = walkDir(mcpDir)
  for (const entry of entries) {
    const relPath = relative(mcpDir, entry)
    const content = readFileSync(entry, "utf-8")
    const checksum = sha256(content)

    artifacts.push({
      category: "config",
      sourcePath: join("mcp-server", relPath),
      targetPath: join(".forge", "mcp-server", relPath),
      content,
      checksum,
    })
  }

  return artifacts
}

/** Catalog frontend pattern library artifacts from frontend/ source. */
function catalogFrontendArtifacts(sourceRoot: string): CanonicalArtifact[] {
  const artifacts: CanonicalArtifact[] = []
  const frontendDir = join(sourceRoot, "frontend")

  if (!existsSync(frontendDir)) return artifacts

  const entries = walkDir(frontendDir)
  for (const entry of entries) {
    const relPath = relative(frontendDir, entry)

    // Skip internal documentation — not distributed to target projects
    if (relPath === "DISTRIBUTE.md") continue

    const content = readFileSync(entry, "utf-8")
    const checksum = sha256(content)

    artifacts.push({
      category: USER_OWNED_FRONTEND_FILES.has(relPath) ? "user-template" : "config",
      sourcePath: join("frontend", relPath),
      targetPath: join(".forge", "frontend", relPath),
      content,
      checksum,
    })
  }

  return artifacts
}

/** Catalog all FORGE-shared artifacts (mcp-server + frontend patterns). */
export function catalogForgeArtifacts(sourceRoot: string): CanonicalArtifact[] {
  return [
    ...catalogMcpServerArtifacts(sourceRoot),
    ...catalogFrontendArtifacts(sourceRoot),
    ...catalogNeutralArtifacts(sourceRoot),
    ...catalogScaffoldArtifacts(sourceRoot),
  ]
}

/**
 * Catalog platform-neutral artifacts: `.opencode/templates/` and
 * `.opencode/docs/` project to `.forge/templates/` and `.forge/docs/`.
 *
 * These are referenced by agents and commands through a single hardcoded
 * path, so they must land somewhere that resolves on every platform.
 */
export function catalogNeutralArtifacts(sourceRoot: string): CanonicalArtifact[] {
  const artifacts: CanonicalArtifact[] = []
  const opencodeDir = join(sourceRoot, ".opencode")

  if (!existsSync(opencodeDir)) return artifacts

  for (const dir of FORGE_NEUTRAL_DIRS) {
    const dirPath = join(opencodeDir, dir)
    if (!existsSync(dirPath)) continue

    for (const entry of walkDir(dirPath)) {
      const relPath = toPosix(relative(dirPath, entry))

      if (dir === "docs" && EXCLUDED_DOCS.has(relPath)) continue
      if (dir === "templates" && EXCLUDED_TEMPLATES.has(relPath)) continue

      const content = readFileSync(entry, "utf-8")

      artifacts.push({
        category: "config",
        sourcePath: join(".opencode", dir, relPath),
        targetPath: join(".forge", dir, relPath),
        content,
        checksum: sha256(content),
      })
    }
  }

  return artifacts
}

/**
 * Catalog the `.forge/` scaffolding a fresh project needs.
 *
 * These use the `user-template` category: created once on a fresh install,
 * never overwritten on update, because the user edits them (spec 004 § D-4).
 */
export function catalogScaffoldArtifacts(sourceRoot: string): CanonicalArtifact[] {
  const artifacts: CanonicalArtifact[] = []
  const templatesDir = join(sourceRoot, ".opencode", "templates")

  for (const { template, target } of SCAFFOLD_FILES) {
    const sourceFile = join(templatesDir, template)
    if (!existsSync(sourceFile)) continue

    const content = readFileSync(sourceFile, "utf-8")

    artifacts.push({
      category: "user-template",
      sourcePath: join(".opencode", "templates", template),
      targetPath: target,
      content,
      checksum: sha256(content),
    })
  }

  return artifacts
}

/**
 * Catalog OpenCode-only artifacts (`.opencode/plugins/` + its package
 * manifest). Returned separately because they must not be projected to
 * Claude Code or Codex (spec 004 § D-3).
 */
export function catalogOpenCodeOnlyArtifacts(sourceRoot: string): CanonicalArtifact[] {
  const artifacts: CanonicalArtifact[] = []
  const opencodeDir = join(sourceRoot, ".opencode")

  if (!existsSync(opencodeDir)) return artifacts

  for (const dir of OPENCODE_ONLY_DIRS) {
    const dirPath = join(opencodeDir, dir)
    if (!existsSync(dirPath)) continue

    for (const entry of walkDir(dirPath)) {
      const relPath = toPosix(relative(opencodeDir, entry))
      const content = readFileSync(entry, "utf-8")

      artifacts.push({
        category: "plugin",
        sourcePath: relPath,
        targetPath: relPath,
        content,
        checksum: sha256(content),
      })
    }
  }

  // The plugins import @opencode-ai/plugin — ship the manifest that declares it.
  const pkgPath = join(opencodeDir, "package.json")
  if (artifacts.length > 0 && existsSync(pkgPath)) {
    const content = readFileSync(pkgPath, "utf-8")
    artifacts.push({
      category: "plugin",
      sourcePath: "package.json",
      targetPath: "package.json",
      content,
      checksum: sha256(content),
    })
  }

  return artifacts
}

/** Catalog all canonical artifacts from .opencode/ source. */
export function catalogCanonicalArtifacts(sourceRoot: string): CanonicalArtifact[] {
  const artifacts: CanonicalArtifact[] = []
  const opencodeDir = join(sourceRoot, ".opencode")

  if (!existsSync(opencodeDir)) return artifacts

  for (const dir of CANONICAL_DIRS) {
    const dirPath = join(opencodeDir, dir)
    if (!existsSync(dirPath)) continue

    const entries = walkDir(dirPath)
    for (const entry of entries) {
      const relPath = toPosix(relative(opencodeDir, entry))
      const content = readFileSync(entry, "utf-8")
      const checksum = sha256(content)

      artifacts.push({
        category: dir === "agents" ? "agent" : dir === "commands" ? "command" : "skill",
        sourcePath: relPath,
        targetPath: relPath,
        content,
        checksum,
      })
    }
  }

  return artifacts
}

// ---------------------------------------------------------------------------
// Platform Layout Helpers
// ---------------------------------------------------------------------------

/**
 * Determine where a canonical artifact lands on a given platform.
 * Most artifacts map directly (agents/forge-pm.md → agents/forge-pm.md),
 * but skills live in a different root on Codex CLI (.agents/skills/ vs .opencode/skills/).
 */
function targetPathForPlatform(descriptor: PlatformDescriptor, artifact: CanonicalArtifact): string {
  // For skills on Codex CLI, map to .agents/skills/ instead of .codex/skills/
  // NOTE: the caller joins this under descriptor.rootDir, so the result today
  // is .codex/.agents/skills/ rather than the documented .agents/skills/.
  // Tracked in #70 — fixing it requires a project-root escape hatch in the
  // operation model, which is out of scope for spec 004.
  if (descriptor.id === "codex" && artifact.category === "skill") {
    // skills/foo/SKILL.md → .agents/skills/foo/SKILL.md
    return toPosix(artifact.sourcePath).replace(/^skills\//, ".agents/skills/")
  }

  return artifact.sourcePath
}

// ---------------------------------------------------------------------------
// Install Plan Builder
// ---------------------------------------------------------------------------

/**
 * Build a complete InstallPlan for the given platforms.
 *
 * @param platforms - detected platforms to install for
 * @param descriptors - platform descriptor map
 * @param sourceRoot - FORGE source root (this repo)
 * @param targetRoot - target project root
 * @param existingManifestChecksums - checksums from previous manifest (if updating)
 * @returns A complete InstallPlan
 */
export function buildInstallPlan(
  platforms: Platform[],
  descriptors: Record<Platform, PlatformDescriptor>,
  sourceRoot: string,
  targetRoot: string,
  existingManifestChecksums?: Record<string, string>,
): InstallPlan {
  const platformArtifacts = catalogCanonicalArtifacts(sourceRoot)
  const forgeArtifacts = catalogForgeArtifacts(sourceRoot)
  const openCodeOnlyArtifacts = catalogOpenCodeOnlyArtifacts(sourceRoot)

  const operations: InstallOperation[] = []
  const requiredDirectories: Set<string> = new Set()

  // Scaffold the .forge/ directory tree so FORGE commands have somewhere to
  // write. Empty directories carry no artifact, so they are registered
  // directly as required directories (spec 004 FR-005).
  for (const dir of FORGE_SCAFFOLD_DIRS) {
    requiredDirectories.add(join(targetRoot, ".forge", ...dir.split("/")))
  }

  // --- Platform-specific artifacts (installed once per detected platform) ---
  for (const platform of platforms) {
    const descriptor = descriptors[platform]
    const platformRoot = join(targetRoot, descriptor.rootDir)

    // Ensure the platform root dir exists
    requiredDirectories.add(platformRoot)

    // Plugins are OpenCode-only: they import @opencode-ai/plugin, which has
    // no equivalent on Claude Code or Codex (spec 004 § D-3).
    const artifactsForPlatform =
      platform === "opencode"
        ? [...platformArtifacts, ...openCodeOnlyArtifacts]
        : platformArtifacts

    for (const artifact of artifactsForPlatform) {
      const relTarget = targetPathForPlatform(descriptor, artifact)
      const absTarget = join(targetRoot, descriptor.rootDir, relTarget)
      const targetDir = resolve(join(absTarget, ".."))

      requiredDirectories.add(targetDir)

      const fileExists = existsSync(absTarget)

      if (!fileExists) {
        operations.push({
          platform,
          kind: "create",
          targetPath: absTarget,
          content: artifact.content,
          reason: "new file",
        })
      } else {
        const prevChecksum = existingManifestChecksums?.[absTarget]
        if (prevChecksum === artifact.checksum) {
          operations.push({
            platform,
            kind: "skip",
            targetPath: absTarget,
            previousChecksum: prevChecksum,
            reason: "unchanged",
          })
        } else if (prevChecksum) {
          operations.push({
            platform,
            kind: "backup",
            targetPath: absTarget,
            content: artifact.content,
            previousChecksum: prevChecksum,
            reason: "drift detected — user file backed up",
          })
        } else {
          operations.push({
            platform,
            kind: "update",
            targetPath: absTarget,
            content: artifact.content,
            reason: "update (no prior manifest)",
          })
        }
      }
    }
  }

  // --- FORGE shared artifacts (installed once, platform-neutral → .forge/) ---
  // These use artifact.targetPath directly and are NOT multiplied per platform.
  for (const artifact of forgeArtifacts) {
    const absTarget = join(targetRoot, artifact.targetPath)
    const targetDir = resolve(join(absTarget, ".."))

    requiredDirectories.add(targetDir)

    const fileExists = existsSync(absTarget)

    if (!fileExists) {
      operations.push({
        platform: "forge",
        kind: "create",
        targetPath: absTarget,
        content: artifact.content,
        reason: "new file",
      })
    } else if (artifact.category === "user-template") {
      // User-owned files (stack-decisions.md, design-system.md) — create once, never overwrite
      operations.push({
        platform: "forge",
        kind: "skip",
        targetPath: absTarget,
        reason: "user-owned template",
      })
    } else {
      const prevChecksum = existingManifestChecksums?.[absTarget]
      if (prevChecksum === artifact.checksum) {
        operations.push({
          platform: "forge",
          kind: "skip",
          targetPath: absTarget,
          previousChecksum: prevChecksum,
          reason: "unchanged",
        })
      } else if (prevChecksum) {
        operations.push({
          platform: "forge",
          kind: "backup",
          targetPath: absTarget,
          content: artifact.content,
          previousChecksum: prevChecksum,
          reason: "drift detected — user file backed up",
        })
      } else {
        operations.push({
          platform: "forge",
          kind: "update",
          targetPath: absTarget,
          content: artifact.content,
          reason: "update (no prior manifest)",
        })
      }
    }
  }

  return {
    platforms,
    isUpdate: !!existingManifestChecksums,
    sourceRoot: resolve(sourceRoot),
    targetRoot: resolve(targetRoot),
    operations,
    requiredDirectories: [...requiredDirectories],
  }
}
