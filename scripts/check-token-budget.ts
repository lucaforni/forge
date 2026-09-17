#!/usr/bin/env node
/**
 * scripts/check-token-budget.ts — Token budget enforcement (constitution Art. 4.2).
 *
 * Token counts are approximated as `words × 1.3`. That is deliberately crude:
 * what matters is a deterministic, documented estimator that fails CI when a
 * file grows past its budget — not a precise model-token count, which no
 * static script can produce anyway.
 *
 * What is gated (exit non-zero on violation):
 *   - every SKILL.md                       <= 3000 tokens
 *   - every agent definition file          <= 5000 tokens
 *     (both `.opencode/agents/` and `.opencode-meta/agents/`)
 *
 * Mandatory vs conditional: only load directives count — a `- **name**:`
 *     bullet, a `Load \`name\`` step, or any mention explicitly tagged
 *     `(conditional)`. Bare cross-references ("see Step 1.1") never load
 *     anything. A skill is conditional only when EVERY directive is tagged;
 *     one untagged "Load X" means it always loads. The gate applies to
 *     mandatory effective context (file + mandatory skills); worst-case
 *     (mandatory + conditional) is reported alongside.
 * Transitive loads (a skill naming another skill) are NOT followed.
 *
 * The 5000-token effective target from Art. 4.2 is reported, not enforced:
 * the UX chain legitimately exceeds it today (see the table below), and an
 * unenforced article must read as an aspiration per Art. 4.4 — which is
 * exactly what the constitution now says.
 *
 * Usage:
 *   npx tsx scripts/check-token-budget.ts            # human-readable table
 *   npx tsx scripts/check-token-budget.ts --json     # machine-readable
 */

import { readdirSync, readFileSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..")
const SKILL_BUDGET = 3000
const AGENT_BUDGET = 5000

function tokens(text: string): number {
  return Math.round(text.split(/\s+/).filter(Boolean).length * 1.3)
}

function skillNames(): string[] {
  return readdirSync(join(REPO_ROOT, ".opencode", "skills"), { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort()
}

function agentFiles(): string[] {
  const out: string[] = []
  for (const dir of ["../.opencode/agents", "../.opencode-meta/agents"]) {
    const abs = join(REPO_ROOT, "scripts", dir)
    try {
      for (const e of readdirSync(abs)) {
        if (e.endsWith(".md")) out.push(join(abs, e))
      }
    } catch {
      // The meta dir legitimately absents itself outside the framework repo,
      // but a missing directory must be visible, not silent: skipping it
      // without a word would let a deleted agents dir pass the gate vacuously.
      console.error(`note: agent directory absent, skipped: ${abs}`)
    }
  }
  return out.sort()
}

interface AgentReport {
  agent: string
  fileTokens: number
  mandatory: Array<{ name: string; tokens: number }>
  conditional: Array<{ name: string; tokens: number }>
  mandatoryEffective: number
  worstCase: number
}

function main(): void {
  const asJson = process.argv.includes("--json")
  const skills = new Map<string, number>()
  for (const name of skillNames()) {
    skills.set(name, tokens(readFileSync(join(REPO_ROOT, ".opencode", "skills", name, "SKILL.md"), "utf-8")))
  }

  const violations: string[] = []
  for (const [name, t] of skills) {
    if (t > SKILL_BUDGET) violations.push(`skill ${name}: ${t} > ${SKILL_BUDGET}`)
  }

  const MANDATORY_EFFECTIVE_BUDGET = 5000;

  const agents: AgentReport[] = []
  const linesOf = (text: string): string[] => text.split("\n")
  const mentionOn = (line: string, name: string): boolean =>
    new RegExp(`(\`${name}\`|\\*\\*${name}\\*\\*)`).test(line);
  // A load directive: Skills bullet, Load step, or an explicitly tagged mention.
  const directiveOn = (line: string, name: string): boolean => {
    if (!mentionOn(line, name)) return false
    if (line.includes("(conditional)")) return true
    if (/^\s*-\s*(\*\*`?[^`*]+`?\*\*|`[^`]+`)/.test(line)) return true
    if (/^\s*(?:\d+[.)]\s*)?Load\s+`/.test(line)) return true
    return false
  };

  for (const file of agentFiles()) {
    const text = readFileSync(file, "utf-8")
    const lines = linesOf(text)
    const fileTokens = tokens(text)
    const rel = file.slice(REPO_ROOT.length + 1)
    if (fileTokens > AGENT_BUDGET) violations.push(`agent ${rel}: ${fileTokens} > ${AGENT_BUDGET}`)

    const mandatory: Array<{ name: string; tokens: number }> = []
    const conditional: Array<{ name: string; tokens: number }> = []
    for (const name of skills.keys()) {
      const directives = lines.filter((l) => directiveOn(l, name))
      if (directives.length === 0) continue
      const entry = { name, tokens: skills.get(name) ?? 0 }
      // Conditional only when EVERY directive is tagged: one untagged
      // "Load X" means the skill loads regardless.
      if (directives.every((l) => l.includes("(conditional)"))) conditional.push(entry)
      else mandatory.push(entry)
    }
    const sum = (xs: Array<{ tokens: number }>): number => xs.reduce((s, x) => s + x.tokens, 0)
    const mandatoryEffective = fileTokens + sum(mandatory)
    if (mandatoryEffective > MANDATORY_EFFECTIVE_BUDGET) {
      violations.push(`agent ${rel}: mandatory effective ${mandatoryEffective} > ${MANDATORY_EFFECTIVE_BUDGET}`)
    }
    agents.push({
      agent: rel,
      fileTokens,
      mandatory,
      conditional,
      mandatoryEffective,
      worstCase: mandatoryEffective + sum(conditional),
    })
  }

  if (asJson) {
    console.log(JSON.stringify({ skillBudget: SKILL_BUDGET, agentBudget: AGENT_BUDGET, mandatoryEffectiveBudget: 5000, skills: [...skills], agents, violations }, null, 2))
  } else {
    console.log("Skill files (budget 3000):")
    for (const [name, t] of skills) {
      console.log(`  ${String(t).padStart(5)}  ${name}${t > SKILL_BUDGET ? "  OVER" : ""}`)
    }
    console.log("\nEffective context per agent (mandatory gated at 5000, worst-case reported):")
    for (const a of agents) {
      const fmt = (xs: Array<{ name: string; tokens: number }>): string =>
        xs.map((s) => `${s.name}(${s.tokens})`).join(" + ") || "—"
      const flag = a.mandatoryEffective > 5000 ? "  OVER" : ""
      console.log(`  ${String(a.mandatoryEffective).padStart(5)}  ${a.agent}${flag}`)
      console.log(`         mandatory: ${a.fileTokens} + ${fmt(a.mandatory)}`)
      if (a.conditional.length > 0) {
        console.log(`         worst-case: ${a.worstCase} (conditional: ${fmt(a.conditional)})`)
      }
    }
  }

  if (violations.length > 0) {
    // Violations go to stderr so --json stays parseable on stdout.
    console.error("\nBUDGET VIOLATIONS:")
    for (const v of violations) console.error(`  - ${v}`)
    process.exit(1)
  }
  if (!asJson) console.log("\nAll file budgets hold.")
}

main()
