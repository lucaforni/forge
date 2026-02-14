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

/** Individual files to copy */
const FILES_TO_COPY = [
  { source: '.opencode/package.json', target: '.opencode/package.json' },
  { source: 'opencode.json', target: 'opencode.json', optional: true },
];

/** Template files (copied only on fresh install, not updates) */
const TEMPLATE_FILES = [
  { source: '.forge/constitution.md', target: '.forge/constitution.md' },
  { source: 'AGENTS.md', target: 'AGENTS.md' },
];

// ============================================================================
// Utility Functions
// ============================================================================

function log(message: string, level: 'info' | 'success' | 'warn' | 'error' = 'info') {
  const icons = { info: 'ℹ', success: '✓', warn: '⚠', error: '✗' };
  const colors = { info: '\x1b[36m', success: '\x1b[32m', warn: '\x1b[33m', error: '\x1b[31m' };
  console.log(`${colors[level]}${icons[level]} ${message}\x1b[0m`);
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

function copyDirectory(source: string, target: string, isUpdate: boolean) {
  ensureDir(target);
  
  const entries = fs.readdirSync(source, { withFileTypes: true });
  
  for (const entry of entries) {
    const sourcePath = path.join(source, entry.name);
    const targetPath = path.join(target, entry.name);
    const relativeTarget = path.relative(process.cwd(), targetPath);
    
    if (entry.isDirectory()) {
      copyDirectory(sourcePath, targetPath, isUpdate);
    } else {
      // Check if file is protected
      if (isUpdate && isProtected(relativeTarget)) {
        log(`Skipping protected file: ${relativeTarget}`, 'warn');
        continue;
      }
      
      // Create backup if file exists and we're updating
      if (isUpdate && fs.existsSync(targetPath)) {
        createBackup(targetPath);
      }
      
      fs.copyFileSync(sourcePath, targetPath);
    }
  }
}

function copyFile(source: string, target: string, isUpdate: boolean, optional = false) {
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
  if (isUpdate && fs.existsSync(target)) {
    createBackup(target);
  }
  
  ensureDir(path.dirname(target));
  fs.copyFileSync(source, target);
}

// ============================================================================
// Main Installation Logic
// ============================================================================

async function install(targetPath: string, isUpdate: boolean) {
  const startTime = Date.now();
  
  log(`${isUpdate ? 'Updating' : 'Installing'} FORGE v${VERSION}...`, 'info');
  log(`Target: ${targetPath}`, 'info');
  log(`Source: ${FORGE_SOURCE}`, 'info');
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
    copyDirectory(sourcePath, targetFilePath, isUpdate);
  }
  console.log('');
  
  // Step 2: Copy individual files
  log('Copying configuration files...', 'info');
  for (const { source, target, optional } of FILES_TO_COPY) {
    const sourcePath = path.join(FORGE_SOURCE, source);
    const targetFilePath = path.join(targetPath, target);
    
    log(`  → ${target}`, 'info');
    copyFile(sourcePath, targetFilePath, isUpdate, optional);
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
      copyFile(sourcePath, targetFilePath, false);
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
    console.log('Backup files created for any overwritten files.');
    console.log('Review changes with: git diff');
  }
}

// ============================================================================
// CLI Entry Point
// ============================================================================

function main() {
  const args = process.argv.slice(2);
  
  // Show help
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
FORGE Installation & Update Script v${VERSION}

Usage:
  npx tsx install-forge.ts <target-directory> [--update]
  
Arguments:
  <target-directory>  Path to the project where FORGE should be installed
  
Options:
  --update           Update existing FORGE installation (preserves user files)
  --help, -h         Show this help message
  
Examples:
  # Fresh installation
  npx tsx install-forge.ts /path/to/my-project
  
  # Update existing installation
  npx tsx install-forge.ts /path/to/my-project --update
  
Protected files (never overwritten during updates):
${PROTECTED_PATTERNS.map(p => `  • ${p}`).join('\n')}
`);
    process.exit(0);
  }
  
  // Parse arguments
  const targetPath = args[0];
  const isUpdate = args.includes('--update');
  
  if (!targetPath) {
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
  
  // Run installation
  install(resolvedTarget, isUpdate).catch(error => {
    log(`Installation failed: ${error.message}`, 'error');
    console.error(error);
    process.exit(1);
  });
}

main();
