---
name: advanced-elicitation
description: Structured second-pass analysis using 6 named reasoning techniques for deeper requirements and design analysis
license: MIT
compatibility: opencode
metadata:
  audience: forge-pm forge-architect
  workflow: forge
---

## Purpose

You now have access to 6 advanced elicitation techniques for deeper analysis.
These techniques are used as a **second pass** after your initial analysis is
complete. They help surface hidden requirements, risks, and assumptions.

## When to Use

After producing your initial output (spec, PRD, architecture, plan), suggest
3 relevant techniques to the user and let them choose which to apply. Do NOT
apply all 6 -- that would be overwhelming.

## Technique Selection Guide

| Technique              | Best For                                     |
| ---------------------- | -------------------------------------------- |
| Pre-mortem Analysis    | Risk-heavy projects, new products            |
| First Principles       | Solving the right problem, innovation        |
| Red Team / Blue Team   | Security-critical, high-stakes features      |
| Socratic Questioning   | Unclear requirements, stakeholder alignment  |
| Constraint Removal     | Innovative solutions, breaking out of ruts   |
| Inversion Analysis     | Edge cases, failure mode discovery            |

## The 6 Techniques

### Technique 1: Pre-mortem Analysis

**Question**: "Imagine this project has failed spectacularly 6 months from
now. What went wrong?"

**Process**:
1. List 5-7 plausible failure scenarios.
2. For each scenario, identify:
   - What caused the failure?
   - What early warning signs did we miss?
   - What could we have done to prevent it?
3. Map prevention actions to specific requirements or design decisions.
4. Add any new requirements discovered to the spec.

**Output**: Risk register entries with mitigations.

### Technique 2: First Principles Thinking

**Question**: "If we strip away all assumptions, what is the fundamental
problem we are solving?"

**Process**:
1. State the problem without any solution bias.
2. Identify all assumptions currently baked into the design.
3. Challenge each assumption: Is this actually true? Is this necessary?
4. Rebuild the solution from the ground truth up.
5. Compare the rebuilt solution with the original.

**Output**: Validated or revised requirements with explicit assumption list.

### Technique 3: Red Team / Blue Team

**Question**: "How would an adversary exploit, break, or misuse this system?"

**Process**:
1. **Red Team** (attacker perspective):
   - How could authentication be bypassed?
   - How could data be stolen or corrupted?
   - How could the system be made unavailable?
   - How could business logic be exploited?
   - How could the system be used for unintended purposes?
2. **Blue Team** (defender perspective):
   - For each attack, what defenses exist?
   - What defenses are missing?
   - What monitoring would detect the attack?
3. Map defensive gaps to security requirements.

**Output**: Security requirements and threat model additions.

### Technique 4: Socratic Questioning

**Question**: "Why do we need this, and what happens if we don't build it?"

**Process**:
1. For each major feature/requirement, ask:
   - Why is this needed? (purpose)
   - What evidence supports this need? (validation)
   - What are the alternatives? (options)
   - What are the consequences of NOT doing this? (impact)
   - Who benefits and who is affected? (stakeholders)
   - What assumptions underlie this? (assumptions)
2. Each answer should be supported by evidence, not opinion.
3. Remove or deprioritize requirements that cannot withstand questioning.

**Output**: Prioritized requirements with validated justification.

### Technique 5: Constraint Removal

**Question**: "What would we build if we had unlimited time, budget, and
no technical constraints?"

**Process**:
1. Describe the ideal, unconstrained solution.
2. Reintroduce constraints one by one:
   - Time constraint: What do we cut?
   - Budget constraint: What do we simplify?
   - Technical constraint: What do we compromise on?
   - Team constraint: What do we defer?
3. For each cut/simplification, note what is lost and what is preserved.
4. Ensure the constrained solution still solves the core problem.

**Output**: Prioritized feature list with clear rationale for cuts.

### Technique 6: Inversion Analysis

**Question**: "What would guarantee this feature FAILS?"

**Process**:
1. List 5-7 things that would guarantee failure:
   - "Users cannot figure out how to..."
   - "The system crashes when..."
   - "Data is lost if..."
   - "Performance degrades to unusable when..."
2. Invert each failure into a success criterion:
   - "Users can complete X in under Y seconds"
   - "The system handles Z without crashing"
3. Check if these success criteria are covered in the spec.
4. Add any missing criteria as acceptance criteria or NFRs.

**Output**: Acceptance criteria and NFRs derived from failure analysis.

## Presentation Format

When suggesting techniques to the user:

```
I've completed the initial [spec/architecture/plan]. To go deeper, I can
apply one or more of these analysis techniques:

1. Pre-mortem Analysis -- surface hidden risks by imagining failure
2. Red Team / Blue Team -- identify security gaps and attack vectors
3. Inversion Analysis -- discover missing acceptance criteria

Which would you like to explore? (You can select multiple or skip.)
```

Always suggest exactly 3 techniques, chosen for relevance to the current
work. Let the user decide.
