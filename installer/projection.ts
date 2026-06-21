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
  const artifacts = [
    ...catalogCanonicalArtifacts(sourceRoot),
    ...catalogMcpServerArtifacts(sourceRoot),
  ]
  const operations: InstallOperation[] = []
  const requiredDirectories: Set<string> = new Set()

  for (const platform of platforms) {
    const descriptor = descriptors[platform]
    const platformRoot = join(targetRoot, descriptor.rootDir)

    // Ensure the platform root dir exists
    requiredDirectories.add(platformRoot)

    for (const artifact of artifacts) {
      const relTarget = targetPathForPlatform(descriptor, artifact)
      const absTarget = join(targetRoot, descriptor.rootDir, relTarget)
      const targetDir = resolve(join(absTarget, ".."))

      requiredDirectories.add(targetDir)

      // Check if file exists
      const fileExists = existsSync(absTarget)

      if (!fileExists) {
        // Fresh install — create
        operations.push({
          platform,
          kind: "create",
          targetPath: absTarget,
          content: artifact.content,
          reason: "new file",
        })
      } else {
        // Check for drift against manifest
        const prevChecksum = existingManifestChecksums?.[absTarget]
        if (prevChecksum === artifact.checksum) {
          // No change — skip
          operations.push({
            platform,
            kind: "skip",
            targetPath: absTarget,
            previousChecksum: prevChecksum,
            reason: "unchanged",
          })
        } else if (prevChecksum) {
          // Content differs from manifest → drift (user edited it)
          operations.push({
            platform,
            kind: "backup",
            targetPath: absTarget,
            content: artifact.content,
            previousChecksum: prevChecksum,
            reason: "drift detected — user file backed up",
          })
        } else {
          // File exists but not in manifest → update (pre-2.0 upgrade or manual install)
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

  return {
    platforms,
    isUpdate: !!existingManifestChecksums,
    sourceRoot: resolve(sourceRoot),
    targetRoot: resolve(targetRoot),
    operations,
    requiredDirectories: [...requiredDirectories],
  }
}
