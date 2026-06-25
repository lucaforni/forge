/**
 * installer/detect.ts — Platform detection module.
 *
 * Probes the target project root for `.opencode/`, `.claude/`, and `.codex/`
 * directories to determine which platforms FORGE should install to.
 */

import { accessSync, constants } from "node:fs"
import { join, resolve } from "node:path"
import type { Platform, DetectionResult } from "./types"

// ---------------------------------------------------------------------------
// Detection
// ---------------------------------------------------------------------------

/** Known platform root directories in order of detection priority. */
const PLATFORM_DIRS: Record<Platform, string> = {
  "opencode": ".opencode",
  "claude-code": ".claude",
  "codex": ".codex",
}

/**
 * Probe the project root for each platform's directory.
 * Returns the list of platforms whose root directory exists.
 */
export function detectPlatforms(projectRoot: string): Platform[] {
  const found: Platform[] = []

  for (const [platform, dirName] of Object.entries(PLATFORM_DIRS)) {
    const dirPath = join(projectRoot, dirName)
    if (dirExists(dirPath)) {
      found.push(platform as Platform)
    }
  }

  return found
}

/**
 * Full detection including metadata about the project state.
 */
export function detectProjectState(projectRoot: string): DetectionResult {
  const platforms = detectPlatforms(projectRoot)

  const foundPaths: DetectionResult["foundPaths"] = {}
  for (const p of platforms) {
    foundPaths[p] = join(projectRoot, PLATFORM_DIRS[p])
  }

  return {
    platforms,
    projectRoot: resolve(projectRoot),
    hasExistingForgeInstall: dirExists(join(projectRoot, ".forge")),
    foundPaths,
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function dirExists(dirPath: string): boolean {
  try {
    accessSync(dirPath, constants.F_OK)
    return true
  } catch {
    return false
  }
}
