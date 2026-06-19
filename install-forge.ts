#!/usr/bin/env node
/**
 * FORGE Installation & Update Script
 * 
 * This script installs or updates FORGE in a target project.
 * 
 * Usage:
 *   npx tsx install-forge.ts /path/to/target/project [--update]
 *   
 * Features:
 *   - Installs all FORGE components (.opencode/ and .forge/)
 *   - Protects user-created files during updates
 *   - Creates backups before overwriting
 *   - Validates installation integrity
 */

import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { execSync } from 'child_process';

// ============================================================================
// Configuration
// ============================================================================

const FORGE_SOURCE = path.resolve(__dirname);
const VERSION = '1.0.0';

/** Files/patterns that should NEVER be overwritten during updates */
const PROTECTED_PATTERNS = [
  '.forge/constitution.md',
  '.forge/specs/**',
  '.forge/knowledge/**',
  '.forge/epics/**',
  '.forge/sprints/**',
  '.forge/product/**',
  '.forge/presets.json',
  'AGENTS.md',
  'CONTRIBUTING.md',
];

/** Directories to copy from FORGE source */
const DIRECTORIES_TO_COPY = [
  { source: '.opencode/agents', target: '.opencode/agents' },
  { source: '.opencode/commands', target: '.opencode/commands' },
  { source: '.opencode/skills', target: '.opencode/skills' },
  { source: '.opencode/plugins', target: '.opencode/plugins' },
  { source: '.opencode/tools', target: '.opencode/tools' },
  { source: '.opencode/templates', target: '.opencode/templates' },
  { source: '.opencode/docs', target: '.opencode/docs' },
];

/** Individual files to copy (simple copy, no merge) */
const FILES_TO_COPY = [
  { source: '.opencode/package.json', target: '.opencode/package.json' },
];

/** Template opencode.json to copy (NOT the repo's opencode.json) */
const OPENCODE_JSON_TEMPLATE = '.opencode/templates/opencode.json';

/** Template files (copied only on fresh install, not updates) */
const TEMPLATE_FILES = [
  { source: '.forge/constitution.md', target: '.forge/constitution.md' },
  { source: 'AGENTS.md', target: 'AGENTS.md' },
];

// ============================================================================
// Provider Presets — Model Provider Configuration
// ============================================================================

interface ModelTierConfig {
  model: string;
  agents: string[];
}

interface ProviderModelOptions {
  [key: string]: any;
}

interface ProviderModels {
  [modelId: string]: {
    options?: ProviderModelOptions;
  };
}

interface ProviderPreset {
  /** Unique identifier (e.g. "github-copilot", "opencode-anthropic", "opencode-deepseek") */
  id: string;
  /** Display name shown to users */
  name: string;
  /** Short description shown during selection */
  description: string;
  /** Default model for all agents unless overridden */
  defaultModel: string;
  /** Provider configurations (provider name → models → options) */
  providers: Record<string, { models: ProviderModels }>;
  /** Agent model assignments by tier */
  agentModels: {
    reasoning: ModelTierConfig;
    execution: ModelTierConfig;
    peer?: ModelTierConfig;
  };
  /** Alternative models available for each tier */
  alternatives: {
    reasoning: string[];
    execution: string[];
    peer?: string[];
  };
}

/**
 * Raw JSON schema for a preset file.
 * Matches the structure of .opencode/templates/presets.json
 */
interface PresetsFile {
  presets: Record<string, Omit<ProviderPreset, 'id'>>;
  order?: string[];  // optional display order override
}

/** FORGE-shipped presets file (always available) */
const FORGE_PRESETS_FILE = '.opencode/templates/presets.json';

/** User override presets file (project-specific, never overwritten) */
const USER_PRESETS_FILE = '.forge/presets.json';

/** Runtime preset registry — populated by loadPresets() */
let PROVIDER_PRESETS: Record<string, ProviderPreset> = {};

/** Display order — set by loadPresets() */
let PROVIDER_ORDER: string[] = [];

/**
 * Load presets from FORGE defaults and optional user overrides.
 * Must be called before any preset access (getPreset, listPresets).
 *
 * Load order:
 *   1. FORGE defaults: {source}/.opencode/templates/presets.json
 *   2. User overrides:  {target}/.forge/presets.json (presets with same id replace)
 */
function loadPresets(sourceDir: string, targetDir: string): boolean {
  const forgePresetsPath = path.join(sourceDir, FORGE_PRESETS_FILE);
  const userPresetsPath = path.join(targetDir, USER_PRESETS_FILE);

  // 1. Load FORGE defaults
  if (!fs.existsSync(forgePresetsPath)) {
    log(`FORGE presets file not found: ${forgePresetsPath}`, 'error');
    return false;
  }

  let forgeFile: PresetsFile;
  try {
    const raw = fs.readFileSync(forgePresetsPath, 'utf-8');
    forgeFile = JSON.parse(stripJsonComments(raw));
  } catch (err: any) {
    log(`Failed to parse FORGE presets: ${err.message}`, 'error');
    return false;
  }

  if (!forgeFile.presets || Object.keys(forgeFile.presets).length === 0) {
    log('FORGE presets file contains no presets', 'error');
    return false;
  }

  // Populate registry from FORGE defaults
  PROVIDER_PRESETS = {};
  for (const [id, presetData] of Object.entries(forgeFile.presets)) {
    PROVIDER_PRESETS[id] = { id, ...presetData } as ProviderPreset;
  }
  PROVIDER_ORDER = forgeFile.order || Object.keys(forgeFile.presets);

  // 2. Merge user overrides if present
  if (fs.existsSync(userPresetsPath)) {
    log('Loading user preset overrides from .forge/presets.json', 'info');

    let userFile: PresetsFile;
    try {
      const raw = fs.readFileSync(userPresetsPath, 'utf-8');
      userFile = JSON.parse(stripJsonComments(raw));
    } catch (err: any) {
      log(`Failed to parse user presets: ${err.message}. Using FORGE defaults.`, 'warn');
      return true;
    }

    if (userFile.presets) {
      let replacedCount = 0;
      let addedCount = 0;

      for (const [id, presetData] of Object.entries(userFile.presets)) {
        const fullPreset = { id, ...presetData } as ProviderPreset;

        if (PROVIDER_PRESETS[id]) {
          PROVIDER_PRESETS[id] = fullPreset;
          replacedCount++;
        } else {
          PROVIDER_PRESETS[id] = fullPreset;
          addedCount++;
        }
      }

      if (replacedCount > 0) {
        log(`  Replaced ${replacedCount} FORGE preset(s) with user overrides`, 'info');
      }
      if (addedCount > 0) {
        log(`  Added ${addedCount} user-defined preset(s)`, 'success');
      }
    }

    // User can override display order too
    if (userFile.order) {
      PROVIDER_ORDER = userFile.order;
    }
  }

  return true;
}

/**
 * Strip JSON comments (// and /* style) to allow human-readable preset files.
 */
function stripJsonComments(content: string): string {
  // Remove single-line // comments (but not inside strings)
  const lines = content.split('\n');
  const result = lines.map(line => {
    let inString = false;
    let escaped = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (escaped) { escaped = false; continue; }
      if (char === '\\') { escaped = true; continue; }
      if (char === '"') { inString = !inString; continue; }
      if (!inString && char === '/' && line[i + 1] === '/') {
        return line.substring(0, i);
      }
    }
    return line;
  }).join('\n');

  // Remove block comments /* ... */ (simple — not nested)
  return result.replace(/\/\*[\s\S]*?\*\//g, '');
}

function getPreset(id: string): ProviderPreset | undefined {
  return PROVIDER_PRESETS[id];
}

function listPresets(): ProviderPreset[] {
  return PROVIDER_ORDER.map(id => PROVIDER_PRESETS[id]).filter(Boolean);
}

// ============================================================================
// Utility Functions
// ============================================================================

function log(message: string, level: 'info' | 'success' | 'warn' | 'error' = 'info') {
  const icons = { info: 'ℹ', success: '✓', warn: '⚠', error: '✗' };
  const colors = { info: '\x1b[36m', success: '\x1b[32m', warn: '\x1b[33m', error: '\x1b[31m' };
  console.log(`${colors[level]}${icons[level]} ${message}\x1b[0m`);
}

async function askYesNo(question: string, defaultYes: boolean = true): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    const defaultOption = defaultYes ? 'Y/n' : 'y/N';
    rl.question(`${question} [${defaultOption}]: `, (answer) => {
      rl.close();
      
      const normalized = answer.trim().toLowerCase();
      if (normalized === '') {
        resolve(defaultYes);
      } else if (normalized === 'y' || normalized === 'yes') {
        resolve(true);
      } else if (normalized === 'n' || normalized === 'no') {
        resolve(false);
      } else {
        resolve(defaultYes);
      }
    });
  });
}

async function askChoice(
  question: string,
  options: string[],
  defaultIndex: number = 0
): Promise<number | null> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    const defaultLabel = options[defaultIndex] ? ` [${defaultIndex + 1}]` : '';
    rl.question(`${question}${defaultLabel}: `, (answer) => {
      rl.close();

      const trimmed = answer.trim();
      if (trimmed === '') {
        resolve(defaultIndex + 1);
        return;
      }

      // Try numeric index
      const num = parseInt(trimmed, 10);
      if (!isNaN(num) && num >= 1 && num <= options.length) {
        resolve(num);
        return;
      }

      // Try matching by option string (case-insensitive prefix match)
      const lower = trimmed.toLowerCase();
      for (let i = 0; i < options.length; i++) {
        if (options[i].toLowerCase().startsWith(lower)) {
          resolve(i + 1);
          return;
        }
      }

      // No match
      resolve(defaultIndex + 1);
    });
  });
}

async function askString(question: string, defaultValue: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(`${question}: `, (answer) => {
      rl.close();
      const trimmed = answer.trim();
      resolve(trimmed === '' ? defaultValue : trimmed);
    });
  });
}

function isProtected(filePath: string): boolean {
  return PROTECTED_PATTERNS.some(pattern => {
    if (pattern.includes('**')) {
      const prefix = pattern.replace('/**', '');
      return filePath.startsWith(prefix);
    }
    return filePath === pattern;
  });
}

function createBackup(filePath: string) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = `${filePath}.backup-${timestamp}`;
  fs.copyFileSync(filePath, backupPath);
  log(`Created backup: ${backupPath}`, 'info');
}

function ensureDir(dirPath: string) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function copyDirectory(source: string, target: string, isUpdate: boolean, createBackups: boolean = true) {
  ensureDir(target);
  
  const entries = fs.readdirSync(source, { withFileTypes: true });
  
  for (const entry of entries) {
    const sourcePath = path.join(source, entry.name);
    const targetPath = path.join(target, entry.name);
    const relativeTarget = path.relative(process.cwd(), targetPath);
    
    if (entry.isDirectory()) {
      copyDirectory(sourcePath, targetPath, isUpdate, createBackups);
    } else {
      // Check if file is protected
      if (isUpdate && isProtected(relativeTarget)) {
        log(`Skipping protected file: ${relativeTarget}`, 'warn');
        continue;
      }
      
      // Create backup if file exists and we're updating
      if (isUpdate && createBackups && fs.existsSync(targetPath)) {
        createBackup(targetPath);
      }
      
      fs.copyFileSync(sourcePath, targetPath);
    }
  }
}

function copyFile(source: string, target: string, isUpdate: boolean, createBackups: boolean = true, optional = false) {
  const relativeTarget = path.relative(process.cwd(), target);
  
  // Check if source exists
  if (!fs.existsSync(source)) {
    if (optional) {
      log(`Optional file not found, skipping: ${source}`, 'info');
      return;
    }
    log(`Source file not found: ${source}`, 'error');
    process.exit(1);
  }
  
  // Check if file is protected
  if (isUpdate && isProtected(relativeTarget)) {
    log(`Skipping protected file: ${relativeTarget}`, 'warn');
    return;
  }
  
  // Create backup if file exists and we're updating
  if (isUpdate && createBackups && fs.existsSync(target)) {
    createBackup(target);
  }
  
  ensureDir(path.dirname(target));
  fs.copyFileSync(source, target);
}

/**
 * Merge JSON files intelligently during updates
 * - Preserves user customizations
 * - Adds new keys from template
 * - Logs what was merged
 */
function mergeJsonFile(source: string, target: string, isUpdate: boolean, createBackups: boolean = true) {
  const relativeTarget = path.relative(process.cwd(), target);
  
  // Check if source exists
  if (!fs.existsSync(source)) {
    log(`Source file not found: ${source}`, 'error');
    process.exit(1);
  }
  
  // Fresh install: just copy
  if (!isUpdate || !fs.existsSync(target)) {
    log(`  → ${relativeTarget} (fresh copy)`, 'info');
    ensureDir(path.dirname(target));
    fs.copyFileSync(source, target);
    return;
  }
  
  // Update: merge intelligently
  log(`  → ${relativeTarget} (merging with existing)`, 'info');
  
  try {
    // Create backup FIRST (using absolute path)
    if (createBackups) {
      createBackup(target);
    }
    
    // Read and parse both files (strip comments for parsing)
    const stripJsonComments = (content: string) => {
      // Remove single-line // comments but only when they're not inside strings
      const lines = content.split('\n');
      const result = lines.map(line => {
        // Find // that's not inside a string
        let inString = false;
        let escaped = false;
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          
          if (escaped) {
            escaped = false;
            continue;
          }
          
          if (char === '\\') {
            escaped = true;
            continue;
          }
          
          if (char === '"') {
            inString = !inString;
            continue;
          }
          
          // If we find // outside of a string, remove from here to end
          if (!inString && char === '/' && line[i + 1] === '/') {
            return line.substring(0, i);
          }
        }
        return line;
      }).join('\n');
      
      // Remove trailing commas before } or ]
      return result.replace(/,(\s*[}\]])/g, '$1');
    };
    
    const sourceContent = fs.readFileSync(source, 'utf-8');
    const targetContent = fs.readFileSync(target, 'utf-8');
    
    const templateConfig = JSON.parse(stripJsonComments(sourceContent));
    const userConfig = JSON.parse(stripJsonComments(targetContent));
    
    // Deep merge function that preserves user values but adds new keys
    function deepMerge(template: any, user: any, path = ''): any {
      if (typeof template !== 'object' || template === null) {
        // If user has a value, keep it; otherwise use template
        return user !== undefined ? user : template;
      }
      
      if (Array.isArray(template)) {
        // For arrays, prefer user's array if it exists
        return user !== undefined ? user : template;
      }
      
      // For objects, start with user's values
      const result: any = {};
      
      // First, copy all user values
      for (const key of Object.keys(user || {})) {
        result[key] = user[key];
      }
      
      // Then, add missing keys from template
      for (const key of Object.keys(template)) {
        const currentPath = path ? `${path}.${key}` : key;
        
        if (!(key in result)) {
          // New key from template - add it
          result[key] = template[key];
          log(`    + Added: ${currentPath}`, 'success');
        } else if (typeof template[key] === 'object' && !Array.isArray(template[key]) && template[key] !== null
                   && typeof result[key] === 'object' && !Array.isArray(result[key]) && result[key] !== null) {
          // Both are objects - decide how to merge
          
          // Special case: for permission.bash and similar maps, do shallow merge
          // to preserve user's custom entries while adding new template entries
          if (currentPath === 'permission.bash' || currentPath === 'agent' || currentPath === 'mcp') {
            // Shallow merge: add template keys that user doesn't have
            const userObj = result[key];
            for (const subKey of Object.keys(template[key])) {
              if (!(subKey in userObj)) {
                userObj[subKey] = template[key][subKey];
                log(`    + Added: ${currentPath}.${subKey}`, 'success');
              }
            }
          } else {
            // Recurse for other nested objects
            result[key] = deepMerge(template[key], result[key], currentPath);
          }
        }
        // else: user's value wins, keep it
      }
      
      return result;
    }
    
    const mergedConfig = deepMerge(templateConfig, userConfig);
    
    // Write merged config with pretty formatting
    const mergedContent = JSON.stringify(mergedConfig, null, 2) + '\n';
    
    // Preserve comments if they exist in the original
    let finalContent = mergedContent;
    if (targetContent.includes('//')) {
      // Try to preserve top comments
      const topComments = targetContent.split('\n')
        .filter(line => line.trim().startsWith('//') || line.trim().startsWith('{'))
        .slice(0, 5); // Get first few lines including opening brace
      
      if (topComments.length > 1 && !topComments[0].includes('{')) {
        log(`    ℹ Note: Comments may need manual adjustment`, 'warn');
      }
    }
    
    fs.writeFileSync(target, finalContent);
    log(`    ✓ Merged successfully. Review changes and restore comments if needed.`, 'success');
    
  } catch (error: any) {
    log(`Failed to merge JSON: ${error.message}`, 'error');
    log(`Copying template as fallback. Check ${target}.backup-*`, 'warn');
    fs.copyFileSync(source, target);
  }
}

// ============================================================================
// Model Provider — Configuration Generation & Interactive Selection
// ============================================================================

/**
 * Generate a complete opencode.json from a provider preset.
 * Produces the full config with comments explaining each section.
 */
function generateOpenCodeJson(preset: ProviderPreset, overrides?: {
  reasoningModel?: string;
  executionModel?: string;
  peerModel?: string;
}): string {
  const reasoningModel = overrides?.reasoningModel || preset.agentModels.reasoning.model;
  const executionModel = overrides?.executionModel || preset.agentModels.execution.model;
  const peerTier = preset.agentModels.peer;
  const peerModel = overrides?.peerModel || peerTier?.model;

  // Build provider config section
  const providerSection: Record<string, any> = {};
  for (const [providerName, providerConfig] of Object.entries(preset.providers)) {
    providerSection[providerName] = { models: {} };
    for (const [modelId, modelConfig] of Object.entries(providerConfig.models)) {
      providerSection[providerName].models[modelId] = modelConfig.options
        ? { options: modelConfig.options }
        : {};
    }
  }

  // Build agent overrides
  const agentOverrides: Record<string, any> = {
    forge: { variant: 'high' },
  };

  // Reasoning agents
  for (const agent of preset.agentModels.reasoning.agents) {
    agentOverrides[agent] = { model: reasoningModel };
  }

  // Execution agents (except forge, which uses variant)
  for (const agent of preset.agentModels.execution.agents) {
    if (agent !== 'forge') {
      agentOverrides[agent] = { model: executionModel };
    }
  }

  // Peer reviewer (if present)
  if (peerTier && peerModel) {
    for (const agent of peerTier.agents) {
      agentOverrides[agent] = { model: peerModel };
    }
  }

  const config = {
    $schema: 'https://opencode.ai/config.json',
    _comment: `FORGE configuration — provider: ${preset.name}`,
    model: preset.defaultModel,
    default_agent: 'forge',
    provider: providerSection,
    agent: agentOverrides,
    permission: {
      bash: {
        'git *': 'allow',
        'npm *': 'allow',
        'npx *': 'allow',
        'node *': 'allow',
        'yarn *': 'allow',
        'ls *': 'allow',
        pwd: 'allow',
        'cat *': 'allow',
        'head *': 'allow',
        'tail *': 'allow',
        'grep *': 'allow',
        'find *': 'allow',
        'wc *': 'allow',
        'tree *': 'allow',
        'make *': 'allow',
        'mkdir *': 'allow',
        'touch *': 'allow',
        'cp *': 'allow',
        'mv *': 'allow',
        'rm -f *': 'allow',
        'echo *': 'allow',
        '*': 'ask',
      },
      edit: 'allow',
      write: 'allow',
      read: 'allow',
      glob: 'allow',
      grep: 'allow',
    },
    instructions: [
      '.forge/constitution.md',
      '.forge/knowledge/decision-log.md',
    ],
    mcp: {
      github: {
        type: 'local',
        command: ['npx', '-y', '@modelcontextprotocol/server-github'],
        environment: {
          GITHUB_PERSONAL_ACCESS_TOKEN: '{env:GITHUB_TOKEN}',
        },
      },
    },
  };

  // Generate the JSON with section comments
  const lines: string[] = [];
  lines.push('{');
  lines.push(`  "$schema": "${config.$schema}",`);
  lines.push('');
  lines.push('  // FORGE — Framework for Orchestrated Requirements, Governance & Engineering');
  lines.push(`  // Provider: ${preset.name} (${preset.description})`);
  lines.push(`  // Generated by FORGE installer v${VERSION}`);
  lines.push('  // To reconfigure models, run: npx tsx install-forge.ts . --reconfigure');
  lines.push('');
  lines.push('  // Default model for all agents unless overridden');
  lines.push(`  "model": "${config.model}",`);
  lines.push('');
  lines.push('  // Default agent — FORGE orchestrator handles all workflow routing');
  lines.push(`  "default_agent": "${config.default_agent}",`);
  lines.push('');
  lines.push('  // Provider configuration with model options');
  lines.push(`  "provider": ${JSON.stringify(config.provider, null, 4).replace(/\n/g, '\n  ')},`);
  lines.push('');
  lines.push('  // Agent model overrides');
  lines.push('  // Reasoning agents (PM, Architect, Reviewer, UX): ' + reasoningModel);
  lines.push('  // Execution agents (Scrum, QA, Analyst): ' + executionModel);
  if (peerModel) {
    lines.push('  // Peer reviewer: ' + peerModel);
  }
  lines.push(`  "agent": ${JSON.stringify(config.agent, null, 4).replace(/\n/g, '\n  ')},`);
  lines.push('');
  lines.push('  // Global tool permissions');
  lines.push(`  "permission": ${JSON.stringify(config.permission, null, 4).replace(/\n/g, '\n  ')},`);
  lines.push('');
  lines.push('  // Constitution and knowledge base always loaded as context');
  lines.push(`  "instructions": ${JSON.stringify(config.instructions)},`);
  lines.push('');
  lines.push('  // MCP server integrations');
  lines.push(`  "mcp": ${JSON.stringify(config.mcp, null, 4).replace(/\n/g, '\n  ')}`);
  lines.push('}');
  lines.push('');

  return lines.join('\n');
}

/**
 * Interactive provider selection flow.
 * Shows available providers, lets user pick one, reviews the recommended config,
 * and returns the selected preset with any user overrides.
 */
async function interactiveProviderSelection(): Promise<{
  preset: ProviderPreset;
  overrides?: { reasoningModel?: string; executionModel?: string; peerModel?: string };
} | null> {
  const presets = listPresets();

  console.log('');
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║         FORGE — Model Provider Selection             ║');
  console.log('╚══════════════════════════════════════════════════════╝');
  console.log('');
  console.log('Select your model provider:');
  console.log('');

  for (let i = 0; i < presets.length; i++) {
    const num = i + 1;
    const p = presets[i];
    console.log(`  ${num}. ${p.id.padEnd(17)} ${p.description}`);
  }
  console.log('');

  const choice = await askChoice(
    'Choice',
    presets.map(p => p.id),
    1
  );

  if (choice === null) {
    const defaultPreset = PROVIDER_PRESETS[PROVIDER_ORDER[0]];
    log(`No valid selection. Using default (${defaultPreset?.name || 'unknown'}).`, 'warn');
    return { preset: defaultPreset };
  }

  const preset = presets[choice - 1];

  // Show recommended configuration
  const rModel = preset.agentModels.reasoning.model;
  const eModel = preset.agentModels.execution.model;
  const pTier = preset.agentModels.peer;

  console.log('');
  console.log('─'.repeat(54));
  console.log(`  ${preset.name} — Recommended Configuration`);
  console.log('─'.repeat(54));
  console.log('');
  console.log(`  Default model:         ${preset.defaultModel}`);
  console.log(`  Reasoning agents:      ${rModel}`);
  console.log(`    • ${preset.agentModels.reasoning.agents.join(', ')}`);
  console.log(`  Execution agents:      ${eModel}`);
  console.log(`    • ${preset.agentModels.execution.agents.join(', ')}`);
  if (pTier) {
    console.log(`  Peer reviewer:        ${pTier.model}`);
    console.log(`    • ${pTier.agents.join(', ')}`);
  }
  console.log('');

  // Run compatibility check
  const compatWarnings = checkCommandCompatibility(preset);
  if (compatWarnings.length > 0) {
    console.log('─'.repeat(54));
    log('Compatibility Notice:', 'warn');
    for (const warning of compatWarnings) {
      console.log(`  ${warning}`);
    }
    console.log('─'.repeat(54));
    console.log('');
  }

  console.log('─'.repeat(54));

  const confirmed = await askYesNo('Accept this configuration?', true);

  if (confirmed) {
    return { preset };
  }

  // Custom configuration path
  console.log('');
  log('Custom configuration mode.', 'info');
  console.log('Leave blank to accept the recommended model.');
  console.log('');

  const customReasoning = await askString(
    `Reasoning model [${rModel}]`,
    rModel
  );

  const customExecution = await askString(
    `Execution model [${eModel}]`,
    eModel
  );

  let customPeerModel: string | undefined;
  if (pTier) {
    customPeerModel = await askString(
      `Peer reviewer model [${pTier.model}] (or "none" to skip)`,
      pTier.model
    );
    if (customPeerModel.toLowerCase() === 'none') {
      customPeerModel = undefined;
    }
  }

  console.log('');
  log('Custom configuration:', 'info');
  console.log(`  Reasoning:  ${customReasoning}`);
  console.log(`  Execution:  ${customExecution}`);
  if (customPeerModel) {
    console.log(`  Peer:      ${customPeerModel}`);
  }
  console.log('');

  const customConfirmed = await askYesNo('Proceed with custom configuration?', true);

  if (!customConfirmed) {
    log('Configuration cancelled. Using defaults.', 'warn');
    return { preset };
  }

  return {
    preset,
    overrides: {
      reasoningModel: customReasoning !== rModel ? customReasoning : undefined,
      executionModel: customExecution !== eModel ? customExecution : undefined,
      peerModel: customPeerModel && pTier && customPeerModel !== pTier.model ? customPeerModel : undefined,
    },
  };
}

/**
 * Check whether the commands in .opencode/commands/ use models that are
 * available in the selected provider preset. Returns warning messages
 * for each mismatch found.
 */
function checkCommandCompatibility(preset: ProviderPreset): string[] {
  const warnings: string[] = [];
  const commandsDir = path.join(FORGE_SOURCE, '.opencode/commands');

  if (!fs.existsSync(commandsDir)) {
    return warnings;
  }

  // Collect all available model IDs from this preset (all providers)
  const availableModels = new Set<string>();
  for (const [providerName, providerConfig] of Object.entries(preset.providers)) {
    for (const modelId of Object.keys(providerConfig.models)) {
      availableModels.add(modelId);
      availableModels.add(`${providerName}/${modelId}`);
    }
  }

  // Scan command files for model references
  const commandFiles = fs.readdirSync(commandsDir).filter(f => f.endsWith('.md'));
  const mismatchedFiles: string[] = [];

  for (const file of commandFiles) {
    const filePath = path.join(commandsDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);

    if (frontmatterMatch) {
      const modelMatch = frontmatterMatch[1].match(/^model:\s*(.+)$/m);
      if (modelMatch) {
        const commandModel = modelMatch[1].trim();
        // Extract just the model ID (after provider/)
        const modelParts = commandModel.split('/');
        const modelId = modelParts.length > 1 ? modelParts[1] : commandModel;

        if (!availableModels.has(commandModel) && !availableModels.has(modelId)) {
          mismatchedFiles.push(`.opencode/commands/${file} (uses ${commandModel})`);
        }
      }
    }
  }

  if (mismatchedFiles.length > 0) {
    warnings.push(
      `${mismatchedFiles.length} command(s) use models not available in ${preset.name}:`
    );
    for (const f of mismatchedFiles) {
      warnings.push(`    • ${f}`);
    }
    warnings.push('');
    warnings.push('  These commands will fall back to the agent default model.');
    warnings.push('  To update them, edit the model: line in each file,');
    warnings.push('  or run: grep -rl "model:" .opencode/commands/');
  }

  return warnings;
}

// ============================================================================
// Main Installation Logic
// ============================================================================

async function install(
  targetPath: string,
  isUpdate: boolean,
  createBackups: boolean = true,
  preset?: ProviderPreset,
  modelOverrides?: { reasoningModel?: string; executionModel?: string; peerModel?: string }
) {
  const startTime = Date.now();
  
  log(`${isUpdate ? 'Updating' : 'Installing'} FORGE v${VERSION}...`, 'info');
  log(`Target: ${targetPath}`, 'info');
  log(`Source: ${FORGE_SOURCE}`, 'info');
  
  if (isUpdate && !createBackups) {
    log('Backup creation: DISABLED', 'warn');
  }
  console.log('');
  
  // Change to target directory
  process.chdir(targetPath);
  
  // Step 1: Copy directories
  log('Copying FORGE components...', 'info');
  for (const { source, target } of DIRECTORIES_TO_COPY) {
    const sourcePath = path.join(FORGE_SOURCE, source);
    const targetFilePath = path.join(targetPath, target);
    
    if (!fs.existsSync(sourcePath)) {
      log(`Warning: Source directory not found: ${source}`, 'warn');
      continue;
    }
    
    log(`  → ${target}`, 'info');
    copyDirectory(sourcePath, targetFilePath, isUpdate, createBackups);
  }
  console.log('');
  
  // Step 2: Copy individual files
  log('Copying configuration files...', 'info');
  for (const { source, target } of FILES_TO_COPY) {
    const sourcePath = path.join(FORGE_SOURCE, source);
    const targetFilePath = path.join(targetPath, target);
    
    log(`  → ${target}`, 'info');
    copyFile(sourcePath, targetFilePath, isUpdate, createBackups);
  }
  console.log('');
  
  // Step 2b: Generate or merge opencode.json
  const opencodeJsonTarget = path.join(targetPath, 'opencode.json');

  if (preset) {
    // A provider preset is selected: generate dynamically (fresh install or reconfigure)
    log('Generating opencode.json from provider preset...', 'info');
    log(`  Provider: ${preset.name}`, 'info');

    const generatedJson = generateOpenCodeJson(preset, modelOverrides);

    // Create backup if target already exists (during update/reconfigure)
    if (fs.existsSync(opencodeJsonTarget) && createBackups) {
      createBackup(opencodeJsonTarget);
    }

    ensureDir(path.dirname(opencodeJsonTarget));
    fs.writeFileSync(opencodeJsonTarget, generatedJson);
    log(`  ✓ opencode.json generated with ${preset.name} configuration`, 'success');
    if (isUpdate) {
      log('  ℹ Previous configuration was backed up', 'info');
    }
  } else if (isUpdate) {
    // Standard update (no reconfigure): merge with existing config to preserve user choices
    log('Merging opencode.json configuration...', 'info');
    const templateSource = path.join(FORGE_SOURCE, OPENCODE_JSON_TEMPLATE);

    if (!fs.existsSync(templateSource)) {
      log(`Warning: Template opencode.json not found at ${OPENCODE_JSON_TEMPLATE}`, 'warn');
      log('Skipping opencode.json merge. You may need to update it manually.', 'warn');
    } else {
      mergeJsonFile(templateSource, opencodeJsonTarget, isUpdate, createBackups);
    }
  } else {
    // Fallback: copy template as-is
    log('Generating opencode.json from template...', 'info');
    const templateSource = path.join(FORGE_SOURCE, OPENCODE_JSON_TEMPLATE);

    if (!fs.existsSync(templateSource)) {
      log(`Warning: Template opencode.json not found at ${OPENCODE_JSON_TEMPLATE}`, 'warn');
      log('Skipping opencode.json generation. You may need to create it manually.', 'warn');
    } else {
      ensureDir(path.dirname(opencodeJsonTarget));
      fs.copyFileSync(templateSource, opencodeJsonTarget);
      log(`  ✓ opencode.json copied from template`, 'success');
    }
  }
  console.log('');
  
  // Step 3: Copy template files (only on fresh install)
  if (!isUpdate) {
    log('Installing template files...', 'info');
    for (const { source, target } of TEMPLATE_FILES) {
      const sourcePath = path.join(FORGE_SOURCE, source);
      const targetFilePath = path.join(targetPath, target);
      
      if (fs.existsSync(targetFilePath)) {
        log(`  → ${target} (already exists, skipping)`, 'warn');
        continue;
      }
      
      log(`  → ${target}`, 'info');
      copyFile(sourcePath, targetFilePath, false, true);
    }
    console.log('');
    
    // Create default .forge structure
    log('Creating .forge/ directory structure...', 'info');
    const forgeStructure = [
      '.forge/specs',
      '.forge/knowledge/adr',
      '.forge/epics',
      '.forge/sprints',
      '.forge/product',
      '.forge/architecture',
    ];
    
    for (const dir of forgeStructure) {
      const dirPath = path.join(targetPath, dir);
      ensureDir(dirPath);
      log(`  → ${dir}/`, 'info');
      
      // Create .gitkeep files
      const gitkeepPath = path.join(dirPath, '.gitkeep');
      if (!fs.existsSync(gitkeepPath)) {
        fs.writeFileSync(gitkeepPath, '');
      }
    }
    
    // Create default decision-log.md and lessons-learned.md
    const decisionLog = path.join(targetPath, '.forge/knowledge/decision-log.md');
    if (!fs.existsSync(decisionLog)) {
      fs.writeFileSync(decisionLog, `# Decision Log

> This file captures session-level decisions made during development. The
> \`session-knowledge\` plugin auto-appends entries when sessions end. Important
> decisions should be promoted to formal ADRs in \`.forge/knowledge/adr/\`.
>
> **Format**: Each entry records the date, session context, and decisions made.
>
> **Maintenance**: Weekly review by tech lead. Promote significant decisions
> to ADRs. Archive stale entries.

---

<!-- Decisions will be appended below by the session-knowledge plugin and /forge-adr command -->
`);
      log('  → .forge/knowledge/decision-log.md', 'info');
    }
    
    const lessonsLearned = path.join(targetPath, '.forge/knowledge/lessons-learned.md');
    if (!fs.existsSync(lessonsLearned)) {
      fs.writeFileSync(lessonsLearned, `# Lessons Learned

> This file captures mistakes, surprises, and insights from development. The
> \`session-knowledge\` plugin may auto-append entries. Review weekly and use
> insights to improve processes and prevent repeat mistakes.

---

<!-- Lessons will be appended below -->
`);
      log('  → .forge/knowledge/lessons-learned.md', 'info');
    }
    console.log('');
  }
  
  // Step 4: Install npm dependencies (if .opencode/package.json exists)
  const packageJsonPath = path.join(targetPath, '.opencode/package.json');
  if (fs.existsSync(packageJsonPath)) {
    log('Installing npm dependencies...', 'info');
    try {
      execSync('npm install', {
        cwd: path.join(targetPath, '.opencode'),
        stdio: 'inherit',
      });
      console.log('');
    } catch (error) {
      log('Warning: npm install failed. You may need to run it manually.', 'warn');
      console.log('');
    }
  }
  
  // Step 5: Summary
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log('='.repeat(60));
  log(`FORGE ${isUpdate ? 'update' : 'installation'} completed in ${elapsed}s!`, 'success');
  console.log('='.repeat(60));
  console.log('');
  
  if (!isUpdate) {
    console.log('Next steps:');
    console.log('  1. Customize .forge/constitution.md for your project');
    console.log('  2. Customize AGENTS.md with your project conventions');
    console.log('  3. Run: opencode');
    console.log('  4. Try: /forge-help');
    console.log('');
    console.log('Learn more: .opencode/docs/FORGE-GUIDE.md');
  } else {
    console.log('Update complete. Your protected files were preserved:');
    PROTECTED_PATTERNS.forEach(p => console.log(`  • ${p}`));
    console.log('');
    if (createBackups) {
      console.log('Backup files created for any overwritten files.');
    } else {
      console.log('No backup files created (--no-backup flag used).');
    }
    console.log('Review changes with: git diff');
  }
}

// ============================================================================
// CLI Entry Point
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  
  // Show help
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
FORGE Installation & Update Script v${VERSION}

Usage:
  npx tsx install-forge.ts <target-directory> [options]
  
Arguments:
  <target-directory>  Path to the project where FORGE should be installed
  
Install Options:
  --update              Update existing FORGE installation (preserves user files)
  --no-backup           Skip creating backup files during update (not recommended)
  --reconfigure         Force model provider re-selection during update

Model Provider Options:
  --provider <id>       Select model provider (skips interactive selection)
                        Available: github-copilot, opencode-anthropic, opencode-deepseek, opencode-free, openai, google
  --non-interactive     Skip all prompts, use defaults (github-copilot)
  --reasoning-model <m> Override model for reasoning agents (PM, Architect, Reviewer, UX)
  --execution-model <m> Override model for execution agents (Forge, Scrum, QA, Analyst)

Other:
  --help, -h            Show this help message
  
Examples:
  # Fresh installation (interactive provider selection)
  npx tsx install-forge.ts /path/to/my-project
  
  # Fresh install with OpenCode (choose your variant)
  npx tsx install-forge.ts /path/to/my-project --provider opencode-anthropic
  npx tsx install-forge.ts /path/to/my-project --provider opencode-deepseek
  npx tsx install-forge.ts /path/to/my-project --provider opencode-free
  
  # Non-interactive install with GitHub Copilot
  npx tsx install-forge.ts /path/to/my-project --non-interactive
  
  # Reconfigure models during update
  npx tsx install-forge.ts /path/to/my-project --update --reconfigure
  
  # Update without creating backups
  npx tsx install-forge.ts /path/to/my-project --update --no-backup
  
Protected files (never overwritten during updates):
${PROTECTED_PATTERNS.map(p => `  • ${p}`).join('\n')}
`);
    process.exit(0);
  }
  
  // Parse arguments — extract flag values first, then find positional target path
  const isUpdate = args.includes('--update');
  const noBackupFlag = args.includes('--no-backup');
  const reconfigure = args.includes('--reconfigure');
  const nonInteractive = args.includes('--non-interactive');

  // Collect indices of flags that consume the next argument
  const consumedIndices = new Set<number>();

  function parseFlagValue(flag: string): string | undefined {
    const idx = args.indexOf(flag);
    if (idx !== -1 && idx + 1 < args.length && !args[idx + 1].startsWith('--')) {
      consumedIndices.add(idx);
      consumedIndices.add(idx + 1);
      return args[idx + 1];
    }
    return undefined;
  }

  const providerId = parseFlagValue('--provider');
  const reasoningModel = parseFlagValue('--reasoning-model');
  const executionModel = parseFlagValue('--execution-model');

  // Find target path: first non-flag argument that wasn't consumed as a flag value
  const targetPath = args.find(
    (a, i) => !a.startsWith('--') && !consumedIndices.has(i)
  );
  
  if (!targetPath || targetPath.startsWith('--')) {
    log('Error: Target directory required', 'error');
    console.log('Usage: npx tsx install-forge.ts <target-directory> [--update]');
    console.log('Run with --help for more information');
    process.exit(1);
  }
  
  // Validate target path
  const resolvedTarget = path.resolve(targetPath);
  if (!fs.existsSync(resolvedTarget)) {
    log(`Error: Target directory does not exist: ${resolvedTarget}`, 'error');
    process.exit(1);
  }
  
  // Check if FORGE is already installed
  const forgeMarker = path.join(resolvedTarget, '.opencode/agents/forge.md');
  const alreadyInstalled = fs.existsSync(forgeMarker);
  
  if (alreadyInstalled && !isUpdate) {
    log('FORGE is already installed in this project.', 'warn');
    log('Use --update flag to update the installation.', 'info');
    process.exit(1);
  }
  
  if (!alreadyInstalled && isUpdate) {
    log('FORGE is not installed in this project.', 'warn');
    log('Remove --update flag to perform fresh installation.', 'info');
    process.exit(1);
  }
  
  // Determine if we should create backups
  let createBackups = true;
  if (isUpdate) {
    if (noBackupFlag) {
      createBackups = false;
    } else {
      if (!nonInteractive) {
        console.log('');
        log('During update, FORGE can create backup files before overwriting.', 'info');
        log('Example: config.json → config.json.backup-2026-02-16T12-30-00', 'info');
        console.log('');
        createBackups = await askYesNo('Create backup files during update?', true);
        console.log('');
      }
    }
  }

  // --- Load Provider Presets ---
  if (!loadPresets(FORGE_SOURCE, resolvedTarget)) {
    log('Failed to load provider presets. Cannot continue.', 'error');
    process.exit(1);
  }
  log(`Loaded ${Object.keys(PROVIDER_PRESETS).length} provider preset(s)`, 'info');

  // --- Model Provider Selection ---
  let preset: ProviderPreset | undefined;
  let modelOverrides: {
    reasoningModel?: string;
    executionModel?: string;
    peerModel?: string;
  } | undefined;

  // On update, skip provider selection unless --reconfigure is set
  const shouldSelectProvider = !isUpdate || reconfigure;

  if (shouldSelectProvider) {
    if (nonInteractive) {
      // Non-interactive: use first available preset as default
      const defaultId = PROVIDER_ORDER[0] || 'github-copilot';
      preset = PROVIDER_PRESETS[defaultId];
      if (!preset) {
        log(`No provider presets available`, 'error');
        process.exit(1);
      }
      log(`Non-interactive mode: using ${preset.name} defaults`, 'info');
    } else if (providerId) {
      // Explicit provider via CLI flag
      preset = getPreset(providerId);
      if (!preset) {
        log(`Unknown provider: "${providerId}"`, 'error');
        console.log(`Available: ${PROVIDER_ORDER.join(', ')}`);
        process.exit(1);
      }
      log(`Provider: ${preset.name} (via --provider flag)`, 'info');

      // Apply any model overrides from flags
      if (reasoningModel || executionModel) {
        modelOverrides = {
          reasoningModel,
          executionModel,
        };
        log('Model overrides applied from CLI flags', 'info');
      }
    } else {
      // Interactive provider selection
      const selection = await interactiveProviderSelection();
      if (selection) {
        preset = selection.preset;
        modelOverrides = selection.overrides;
      }
      // If selection returned null but still has a valid preset, it was a fallback inside the function
      if (!preset) {
        preset = PROVIDER_PRESETS[PROVIDER_ORDER[0]];
        log(`Using default provider (${preset?.name || 'unknown'})`, 'warn');
      }
    }
  } else {
    log('Update mode: preserving existing model configuration', 'info');
    log('Use --reconfigure to change model provider', 'info');
  }

  if (preset && shouldSelectProvider) {
    console.log('');
    log(`Model configuration: ${preset.name}`, 'success');
    const rModel = modelOverrides?.reasoningModel || preset.agentModels.reasoning.model;
    const eModel = modelOverrides?.executionModel || preset.agentModels.execution.model;
    log(`  Reasoning:  ${rModel}`, 'info');
    log(`  Execution:  ${eModel}`, 'info');
    console.log('');
  }
  
  // Run installation
  install(resolvedTarget, isUpdate, createBackups, preset, modelOverrides).catch(error => {
    log(`Installation failed: ${error.message}`, 'error');
    console.error(error);
    process.exit(1);
  });
}

main();
