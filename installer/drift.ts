/**
 * installer/drift.ts — Drift detection for installed FORGE files.
 *
 * Compares on-disk file checksums against the stored install manifest
 * to detect user modifications (drift).
 */

import { existsSync, readFileSync } from "node:fs"
import { createHash } from "node:crypto"
import type { InstallManifest } from "./types"

// ---------------------------------------------------------------------------
// Checksum
// ---------------------------------------------------------------------------

/** Compute the SHA-256 hex digest of a file's UTF-8 content. */
export function fileChecksum(filePath: string): string | null {
  if (!existsSync(filePath)) return null

  try {
    const content = readFileSync(filePath, "utf-8")
    return createHash("sha256").update(content, "utf-8").digest("hex")
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// Drift Classification
// ---------------------------------------------------------------------------

export type DriftClassification = "unchanged" | "drift" | "user-created" | "missing"

export interface DriftEntry {
  /** Absolute path to the file. */
  filePath: string
  /** How this file classifies relative to the manifest. */
  classification: DriftClassification
  /** Expected checksum from manifest (null if user-created). */
  expectedChecksum: string | null
  /** Actual checksum on disk (null if missing). */
  actualChecksum: string | null
}

/**
 * Classify every file in the manifest against what's on disk.
 * Returns a DriftEntry for each tracked path + any extra files found
 * in platform directories that aren't in the manifest.
 */
export function detectDrift(
  manifest: InstallManifest,
  platformDirs: string[],
): DriftEntry[] {
  const results: DriftEntry[] = []

  // Check every file the manifest knows about
  for (const [absolutePath, expectedChecksum] of Object.entries(manifest.checksums)) {
    const actualChecksum = fileChecksum(absolutePath)

    if (actualChecksum === null) {
      results.push({
        filePath: absolutePath,
        classification: "missing",
        expectedChecksum,
        actualChecksum: null,
      })
    } else if (actualChecksum === expectedChecksum) {
      results.push({
        filePath: absolutePath,
        classification: "unchanged",
        expectedChecksum,
        actualChecksum,
      })
    } else {
      results.push({
        filePath: absolutePath,
        classification: "drift",
        expectedChecksum,
        actualChecksum,
      })
    }
  }

  return results
}

/**
 * Quick check: does any file have drift?
 * Returns `true` if at least one manifest-tracked file changed on disk.
 */
export function hasDrift(manifest: InstallManifest, platformDirs: string[]): boolean {
  return detectDrift(manifest, platformDirs).some((e) => e.classification === "drift")
}
