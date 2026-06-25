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

/**
 * Recursively walk a directory, returning all file paths.
 */
function walkDir(dirPath: string): string[] {
  const results: string[] = []
  const entries = readdirSync(dirPath, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = join(dirPath, entry.name)
    if (entry.isDirectory()) {
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

/** MCP server source files (copied to .forge/mcp-server/ in target). */
const MCP_SERVER_DIRS = ["index.ts", "package.json", "tsconfig.json", "src"] as const

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
    const checksum = createHash("sha256").update(content, "utf-8").digest("hex")

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
    const checksum = createHash("sha256").update(content, "utf-8").digest("hex")

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
  ]
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
      const relPath = relative(opencodeDir, entry)
      const content = readFileSync(entry, "utf-8")
      const checksum = createHash("sha256").update(content, "utf-8").digest("hex")

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
  if (descriptor.id === "codex" && artifact.category === "skill") {
    // .opencode/skills/foo/SKILL.md → .agents/skills/foo/SKILL.md
    return artifact.sourcePath.replace(/^skills\//, ".agents/skills/")
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

  const operations: InstallOperation[] = []
  const requiredDirectories: Set<string> = new Set()

  // --- Platform-specific artifacts (installed once per detected platform) ---
  for (const platform of platforms) {
    const descriptor = descriptors[platform]
    const platformRoot = join(targetRoot, descriptor.rootDir)

    // Ensure the platform root dir exists
    requiredDirectories.add(platformRoot)

    for (const artifact of platformArtifacts) {
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
