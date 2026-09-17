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
 * What is reported but not gated:
 *   - effective context per agent = agent file + every skill it declares.
 *     A skill counts as declared when its name appears backtick-quoted
 *     (`name`) or bolded (`**name**`) — the two styles every agent file
 *     actually uses (numbered "Load X" steps, `## Skills` bullets, routing
 *     tables). Conditional loads ("load IN ADDITION when...") count toward
 *     the total: the budget guards the worst case, and a conditional that
 *     always fires is just a load. Transitive loads (a skill naming
 *     another skill) are NOT followed.
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
      // meta dir may not exist in all checkouts
    }
  }
  return out.sort()
}

interface AgentReport {
  agent: string
  fileTokens: number
  skills: Array<{ name: string; tokens: number }>
  effective: number
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

  const agents: AgentReport[] = []
  const mention = (text: string, name: string): boolean =>
    new RegExp(`(\`${name}\`|\\*\\*${name}\\*\\*)`).test(text);

  for (const file of agentFiles()) {
    const text = readFileSync(file, "utf-8")
    const fileTokens = tokens(text)
    const rel = file.slice(REPO_ROOT.length + 1)
    if (fileTokens > AGENT_BUDGET) violations.push(`agent ${rel}: ${fileTokens} > ${AGENT_BUDGET}`)

    const declared = [...skills.keys()].filter((n) => mention(text, n))
    const skillTokens = declared.map((name) => ({ name, tokens: skills.get(name) ?? 0 }))
    agents.push({
      agent: rel,
      fileTokens,
      skills: skillTokens,
      effective: fileTokens + skillTokens.reduce((s, x) => s + x.tokens, 0),
    })
  }

  if (asJson) {
    console.log(JSON.stringify({ skillBudget: SKILL_BUDGET, agentBudget: AGENT_BUDGET, skills: [...skills], agents, violations }, null, 2))
  } else {
    console.log("Skill files (budget 3000):")
    for (const [name, t] of skills) {
      console.log(`  ${String(t).padStart(5)}  ${name}${t > SKILL_BUDGET ? "  OVER" : ""}`)
    }
    console.log("\nEffective context per agent (file + declared skills):")
    for (const a of agents) {
      const skillList = a.skills.map((s) => `${s.name}(${s.tokens})`).join(" + ") || "—"
      console.log(`  ${String(a.effective).padStart(5)}  ${a.agent}`)
      console.log(`         = ${a.fileTokens} + ${skillList}`)
    }
  }

  if (violations.length > 0) {
    console.error("\nBUDGET VIOLATIONS:")
    for (const v of violations) console.error(`  - ${v}`)
    process.exit(1)
  }
  console.log("\nAll file budgets hold.")
}

main()
