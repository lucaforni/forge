/**
 * installer/types.ts — Shared TypeScript interfaces for the cross-platform
 * FORGE installer. All installer modules and platform adapters share these
 * types as the single source of truth for data shapes.
 */

// ---------------------------------------------------------------------------
// Platform Identification
// ---------------------------------------------------------------------------

/** Supported target platforms for FORGE installation. */
export type Platform = "opencode" | "claude-code" | "codex"

/** Static descriptor for a platform's directory layout and file locations. */
export interface PlatformDescriptor {
  /** Unique identifier matching the Platform union. */
  id: Platform
  /** Human-readable label (e.g., "Claude Code"). */
  label: string
  /** Root directory name (e.g., ".claude"). */
  rootDir: string
  /** Relative path to the platform's config file. */
  configFile: string
  /** Relative path to agent definitions directory. */
  agentsDir: string
  /** Relative path to slash commands directory. */
  commandsDir: string
  /** Relative path to skills directory. */
  skillsDir: string
  /** Relative path to hooks directory (platforms with hook systems). */
  hooksDir?: string
  /** Project instructions file at project root (e.g., "AGENTS.md", "CLAUDE.md"). */
  projectInstructions: string
  /** Where in the platform config the MCP server reference should be injected. */
  mcpConfigTarget: string
}

// ---------------------------------------------------------------------------
// Artifacts
// ---------------------------------------------------------------------------

/** Categories of canonical artifacts that get projected per platform. */
export type ArtifactCategory = "agent" | "command" | "skill" | "config" | "plugin" | "instructions" | "user-template"

/** A single file or directory that FORGE installs to a target location. */
export interface CanonicalArtifact {
  /** Artifact category for grouping and projection rules. */
  category: ArtifactCategory
  /** Relative path within the canonical source (e.g., "agents/forge-pm.md"). */
  sourcePath: string
  /** Relative path within the target platform layout. */
  targetPath: string
  /** File content as UTF-8 string (text files) or base64 (binaries). */
  content?: string
  /** SHA-256 hex digest for drift detection. */
  checksum: string
}

// ---------------------------------------------------------------------------
// Install Operations
// ---------------------------------------------------------------------------

/** The kind of operation the installer performs on a single file. */
export type OperationKind = "create" | "update" | "skip" | "backup"

/** A single install operation targeting one platform. */
export interface InstallOperation {
  /** Which platform this operation applies to ("forge" = platform-neutral FORGE artifact). */
  platform: Platform | "forge"
  /** What to do. */
  kind: OperationKind
  /** Absolute path on disk. */
  targetPath: string
  /** New content (for create/update operations). */
  content?: string
  /** Previous checksum if the file existed (for drift detection). */
  previousChecksum?: string
  /** Reason for skip/backup decisions (for post-install summary). */
  reason?: string
}

// ---------------------------------------------------------------------------
// Install Plan & Result
// ---------------------------------------------------------------------------

/** Complete installation plan — what to do, where, and what to back up. */
export interface InstallPlan {
  /** Platforms detected in the target project. */
  platforms: Platform[]
  /** Whether this is an update (true) or fresh install (false). */
  isUpdate: boolean
  /** Absolute path to the FORGE source (this repo). */
  sourceRoot: string
  /** Absolute path to the target project. */
  targetRoot: string
  /** All operations to execute, in dependency order. */
  operations: InstallOperation[]
  /** Directories that need to exist before operations run. */
  requiredDirectories: string[]
}

/** Outcome of an installation attempt. */
export interface InstallResult {
  /** Whether the entire install succeeded. */
  success: boolean
  /** Platforms that were installed to. */
  installed: Platform[]
  /** Non-fatal warnings to display to the user. */
  warnings: string[]
  /** Paths to backup directories (empty if none were needed). */
  backupPaths: string[]
  /** Path to the install manifest written after success. */
  manifestPath?: string
  /** Exit code for the CLI (0 = success, 2-7 = error codes). */
  exitCode: number
}

// ---------------------------------------------------------------------------
// Install Manifest (persisted to .forge/.install-manifest.json)
// ---------------------------------------------------------------------------

/** Persisted state of a FORGE installation, used for idempotency and drift. */
export interface InstallManifest {
  /** FORGE version that created this manifest. */
  forgeVersion: string
  /** ISO 8601 timestamp of the last successful install. */
  installedAt: string
  /** Platforms that were installed. */
  platforms: Platform[]
  /** SHA-256 checksums of every installed file, keyed by absolute path. */
  checksums: Record<string, string>
  /** Files that FORGE explicitly excludes from checksum comparison (user-editable). */
  excludedPaths: string[]
}

// ---------------------------------------------------------------------------
// Configuration Model (internal, before per-platform serialization)
// ---------------------------------------------------------------------------

/** Internal model for FORGE configuration, projected per platform. */
export interface ForgeConfigModel {
  /** Agents that should be registered. */
  agents: AgentConfig[]
  /** MCP server configuration. */
  mcpServers: McpServerConfig[]
  /** Hook/plugin registrations. */
  hooks: HookConfig[]
}

export interface AgentConfig {
  name: string
  description: string
  model?: string
  path?: string
}

export interface McpServerConfig {
  name: string
  command: string[]
  env?: Record<string, string>
}

export interface HookConfig {
  event: string
  command: string[]
}

// ---------------------------------------------------------------------------
// Platform-specific detection result
// ---------------------------------------------------------------------------

export interface DetectionResult {
  /** Platforms found in the project root. */
  platforms: Platform[]
  /** Project root absolute path. */
  projectRoot: string
  /** Whether .forge/ directory exists (indicates prior FORGE install). */
  hasExistingForgeInstall: boolean
  /** Paths to existing platform config dirs that were found. */
  foundPaths: Partial<Record<Platform, string>>
}
