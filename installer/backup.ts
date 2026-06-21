/**
 * installer/backup.ts — Drifted file backup manager.
 *
 * Implements the OQ-07 resolution: drifted files are backed up to
 * `.forge/.backups/<ISO-timestamp>/<original-path>` before being overwritten.
 * The backup directory is inside `.forge/` (conventionally gitignored).
 */

import { copyFileSync, existsSync, mkdirSync, writeFileSync, readFileSync, appendFileSync } from "node:fs"
import { join, dirname, resolve, relative } from "node:path"
import type { DriftEntry } from "./drift"

// ---------------------------------------------------------------------------
// Backup
// ---------------------------------------------------------------------------

/**
 * Create a timestamped backup directory path.
 * Pattern: `.forge/.backups/YYYY-MM-DDTHHmmss/`
 */
export function backupDirPath(projectRoot: string): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19)
  return join(projectRoot, ".forge", ".backups", timestamp)
}

/**
 * Back up a single drifted file.
 *
 * @param filePath - Absolute path to the file being backed up
 * @param backupRoot - Absolute path to the backup directory root
 * @param projectRoot - Absolute path to the project root (for computing relative path)
 * @returns The absolute path where the backup was written
 */
export function backupFile(filePath: string, backupRoot: string, projectRoot: string): string {
  const relPath = relative(projectRoot, filePath)
  const targetPath = join(backupRoot, relPath)
  const targetDir = dirname(targetPath)

  if (!existsSync(targetDir)) {
    mkdirSync(targetDir, { recursive: true })
  }

  copyFileSync(filePath, targetPath)
  return targetPath
}

/**
 * Back up all drifted files from a drift detection result.
 *
 * @param driftEntries - Drift entries (only "drift" classified files are backed up)
 * @param projectRoot - Project root for computing the backup directory
 * @returns List of backup paths created
 */
export function backupDriftedFiles(
  driftEntries: DriftEntry[],
  projectRoot: string,
): { backupPaths: string[]; backupRoot: string } {
  const drifted = driftEntries.filter((e) => e.classification === "drift")
  if (drifted.length === 0) return { backupPaths: [], backupRoot: "" }

  const backupRoot = backupDirPath(projectRoot)
  const backupPaths: string[] = []

  for (const entry of drifted) {
    const path = backupFile(entry.filePath, backupRoot, projectRoot)
    backupPaths.push(path)
  }

  return { backupPaths, backupRoot }
}

/**
 * Ensure `.forge/.gitignore` exists and includes the backups pattern.
 * This prevents backup directories from being committed accidentally (RISK-007).
 */
export function ensureBackupGitignore(projectRoot: string): void {
  const gitignorePath = join(projectRoot, ".forge", ".gitignore")
  const pattern = ".backups/"

  if (!existsSync(gitignorePath)) {
    const forgeDir = dirname(gitignorePath)
    if (!existsSync(forgeDir)) {
      mkdirSync(forgeDir, { recursive: true })
    }
    writeFileSync(gitignorePath, `${pattern}\n`, "utf-8")
    return
  }

  const content = readFileSync(gitignorePath, "utf-8")
  if (!content.includes(pattern)) {
    appendFileSync(gitignorePath, `\n${pattern}\n`, "utf-8")
  }
}
