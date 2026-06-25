/**
 * installer/manifest.ts — Install manifest read/write and idempotency.
 *
 * Manages `.forge/.install-manifest.json` — the persisted state of the last
 * FORGE installation. Used for:
 * - Idempotency (same state → zero writes on re-run)
 * - Drift detection (checksum comparison)
 * - Synthesis for pre-cross-platform upgrades (migration from no-manifest state)
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs"
import { join, resolve, dirname } from "node:path"
import type { InstallManifest, Platform } from "./types"

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MANIFEST_RELATIVE_PATH = ".forge/.install-manifest.json"
const FORGE_VERSION = "2.0.0"

// ---------------------------------------------------------------------------
// Read / Write
// ---------------------------------------------------------------------------

/** Resolve the absolute path to the manifest file. */
export function manifestPath(projectRoot: string): string {
  return resolve(join(projectRoot, MANIFEST_RELATIVE_PATH))
}

/**
 * Read the install manifest from disk.
 * Returns `null` if the file doesn't exist (fresh install or pre-2.0 upgrade).
 */
export function readManifest(projectRoot: string): InstallManifest | null {
  const mPath = manifestPath(projectRoot)
  if (!existsSync(mPath)) return null

  try {
    const raw = readFileSync(mPath, "utf-8")
    return JSON.parse(raw) as InstallManifest
  } catch {
    return null
  }
}

/**
 * Write the install manifest to disk.
 * Creates `.forge/` directory if it doesn't exist.
 */
export function writeManifest(projectRoot: string, manifest: InstallManifest): string {
  const mPath = manifestPath(projectRoot)
  const mDir = dirname(mPath)

  if (!existsSync(mDir)) {
    mkdirSync(mDir, { recursive: true })
  }

  writeFileSync(mPath, JSON.stringify(manifest, null, 2), "utf-8")
  return mPath
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Create a new InstallManifest with the given platforms and checksums.
 */
export function createManifest(
  platforms: Platform[],
  checksums: Record<string, string>,
  excludedPaths: string[] = [],
): InstallManifest {
  return {
    forgeVersion: FORGE_VERSION,
    installedAt: new Date().toISOString(),
    platforms,
    checksums,
    excludedPaths,
  }
}

// ---------------------------------------------------------------------------
// Synthesis (upgrade from pre-2.0)
// ---------------------------------------------------------------------------

/**
 * Check whether this project has a FORGE installation but no manifest.
 * Returns `true` if `.forge/` exists but `.forge/.install-manifest.json` doesn't.
 * This signals a first-run after upgrading from FORGE 1.x.
 */
export function needsManifestSynthesis(projectRoot: string): boolean {
  const forgeDir = join(projectRoot, ".forge")
  return existsSync(forgeDir) && !existsSync(manifestPath(projectRoot))
}

// ---------------------------------------------------------------------------
// Idempotency
// ---------------------------------------------------------------------------

/**
 * Check whether a given platform's artifacts are already installed and
 * match the manifest. Used by NFR-006: re-running on an unchanged project
 * produces zero writes.
 */
export function isPlatformUpToDate(
  projectRoot: string,
  platform: Platform,
  currentChecksums: Record<string, string>,
): boolean {
  const manifest = readManifest(projectRoot)
  if (!manifest) return false

  // Platform must be in manifest
  if (!manifest.platforms.includes(platform)) return false

  // All current checksums must match
  for (const [filePath, checksum] of Object.entries(currentChecksums)) {
    const absolutePath = resolve(join(projectRoot, filePath))
    const storedChecksum = manifest.checksums[absolutePath]
    if (storedChecksum !== checksum) return false
  }

  return true
}
