/**
 * installer/log.ts — Structured logger for the FORGE installer.
 *
 * Provides consistent output formatting with visual prefixes and color
 * signaling (but never color-only — text markers are always present).
 */

// ---------------------------------------------------------------------------
// Log Levels
// ---------------------------------------------------------------------------

export type LogLevel = "info" | "ok" | "warn" | "err" | "skip" | "plan" | "new" | "upd"

let _verbose = false

/** Enable verbose logging (additional detail for --verbose mode). */
export function setVerbose(v: boolean): void {
  _verbose = v
}

/** Current verbose state. */
export function isVerbose(): boolean {
  return _verbose
}

// ---------------------------------------------------------------------------
// Prefixes
// ---------------------------------------------------------------------------

const PREFIXES: Record<LogLevel, string> = {
  info: "[INFO]",
  ok:   "[ OK]",
  warn: "[WARN]",
  err:  "[ERR]",
  skip: "[SKIP]",
  plan: "[PLAN]",
  new:  "[NEW]",
  upd:  "[UPD]",
}

// ---------------------------------------------------------------------------
// Logger
// ---------------------------------------------------------------------------

/**
 * Log a message with structured prefix.
 * Uses both text markers and (where supported) color via ANSI.
 */
export function log(level: LogLevel, message: string): void {
  const prefix = PREFIXES[level]
  const timestamp = new Date().toISOString().slice(11, 19)

  // Always print — color on supporting terminals, text markers always present
  if (level === "err") {
    console.error(`[${timestamp}] ${prefix} ${message}`)
  } else {
    console.log(`[${timestamp}] ${prefix} ${message}`)
  }
}

/** Shorthand for log("ok", ...). */
export function ok(message: string): void {
  log("ok", message)
}

/** Shorthand for log("warn", ...). */
export function warn(message: string): void {
  log("warn", message)
}

/** Shorthand for log("err", ...). */
export function err(message: string): void {
  log("err", message)
}

/** Shorthand for log("info", ...). */
export function info(message: string): void {
  log("info", message)
}

/** Shorthand for log("skip", ...). */
export function skip(message: string): void {
  log("skip", message)
}

/** Shorthand for log("plan", ...). */
export function plan(message: string): void {
  log("plan", message)
}

/** Shorthand for log("new", ...). */
export function newLog(message: string): void {
  log("new", message)
}

/** Shorthand for log("upd", ...). */
export function upd(message: string): void {
  log("upd", message)
}

/** Print a section header separator. */
export function section(title: string): void {
  console.log("")
  console.log(`─── ${title} ───`)
  console.log("")
}

/** Print a summary line (no timestamp, prominent). */
export function summary(message: string): void {
  console.log(`  ${message}`)
}
