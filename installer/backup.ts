/**
 * installer/backup.ts — Drifted file backup manager.
 *
 * Implements the OQ-07 resolution: drifted files are backed up to
 * `.forge/.backups/<ISO-timestamp>/<original-path>` before being overwritten.
 * The backup directory is inside `.forge/` (conventionally gitignored).
 */

import { copyFileSync, mkdirSync, openSync, readSync, writeSync, fstatSync, closeSync } from "node:fs"
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

  // mkdirSync with recursive:true is idempotent — no TOCTOU-prone
  // existsSync check needed (js/file-system-race).
  mkdirSync(targetDir, { recursive: true })

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

  // mkdirSync with recursive:true is idempotent — no existsSync check needed.
  mkdirSync(dirname(gitignorePath), { recursive: true })

  // Open once with "a+" (O_CREAT, no truncation) and perform all
  // read/write operations on the same file descriptor. This avoids the
  // check-then-act race (js/file-system-race) of existsSync → writeFileSync
  // / readFileSync → appendFileSync on the path.
  const fd = openSync(gitignorePath, "a+")
  try {
    const { size } = fstatSync(fd)
    if (size === 0) {
      writeSync(fd, `${pattern}\n`)
      return
    }
    const buf = Buffer.alloc(size)
    readSync(fd, buf, 0, size, 0)
    const content = buf.toString("utf-8")
    if (!content.includes(pattern)) {
      const sep = content.endsWith("\n") ? "" : "\n"
      writeSync(fd, `${sep}${pattern}\n`)
    }
  } finally {
    closeSync(fd)
  }
}
