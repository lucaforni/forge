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

6 advanced elicitation techniques for deeper analysis. Used as a **second pass** after initial analysis. Surface hidden requirements, risks, assumptions.

## When to Use

After producing initial output (spec, PRD, architecture, plan), suggest 3 relevant techniques; user chooses. Do NOT apply all 6.

## Technique Selection Guide

| Technique | Best for |
|-----------|----------|
| Pre-mortem Analysis | Risk-heavy projects, new products |
| First Principles | Solving the right problem, innovation |
| Red Team / Blue Team | Security-critical, high-stakes features |
| Socratic Questioning | Unclear requirements, stakeholder alignment |
| Constraint Removal | Innovative solutions, breaking out of ruts |
| Inversion Analysis | Edge cases, failure mode discovery |

## The 6 Techniques

### 1. Pre-mortem Analysis

**Question**: "Imagine this project has failed spectacularly 6 months from now. What went wrong?"

**Process**:
1. List 5-7 plausible failure scenarios.
2. Per scenario: cause? early warning signs missed? prevention?
3. Map prevention actions to specific requirements/design decisions.
4. Add new requirements discovered to spec.

**Output**: risk register entries with mitigations.

### 2. First Principles Thinking

**Question**: "Stripping all assumptions, what's the fundamental problem we're solving?"

**Process**:
1. State the problem without solution bias.
2. Identify assumptions baked into the design.
3. Challenge each: actually true? necessary?
4. Rebuild the solution from ground truth.
5. Compare rebuilt vs original.

**Output**: validated/revised requirements with explicit assumption list.

### 3. Red Team / Blue Team

**Question**: "How would an adversary exploit, break, or misuse this system?"

**Process**:
1. **Red Team** (attacker): How could auth be bypassed? Data stolen/corrupted? System made unavailable? Business logic exploited? System used for unintended purposes?
2. **Blue Team** (defender): per attack, what defenses exist / are missing? What monitoring would detect it?
3. Map defensive gaps to security requirements.

**Output**: security requirements + threat model additions.

### 4. Socratic Questioning

**Question**: "Why do we need this, and what happens if we don't build it?"

**Process**:
1. Per major feature/requirement, ask:
   - Why needed? (purpose)
   - What evidence supports the need? (validation)
   - Alternatives? (options)
   - Consequences of NOT doing it? (impact)
   - Who benefits and who is affected? (stakeholders)
   - Underlying assumptions? (assumptions)
2. Answers supported by evidence, not opinion.
3. Remove/deprioritize requirements that fail questioning.

**Output**: prioritized requirements with validated justification.

### 5. Constraint Removal

**Question**: "What would we build with unlimited time, budget, no technical constraints?"

**Process**:
1. Describe the ideal unconstrained solution.
2. Reintroduce constraints one by one:
   - Time: what do we cut?
   - Budget: what do we simplify?
   - Technical: what do we compromise on?
   - Team: what do we defer?
3. Per cut/simplification, note what's lost and preserved.
4. Constrained solution still solves the core problem.

**Output**: prioritized feature list with rationale for cuts.

### 6. Inversion Analysis

**Question**: "What would guarantee this feature FAILS?"

**Process**:
1. List 5-7 failure guarantors:
   - "Users cannot figure out how to..."
   - "The system crashes when..."
   - "Data is lost if..."
   - "Performance degrades to unusable when..."
2. Invert each into a success criterion:
   - "Users can complete X in under Y seconds"
   - "The system handles Z without crashing"
3. Check if these are covered in the spec.
4. Add missing criteria as acceptance criteria or NFRs.

**Output**: acceptance criteria + NFRs from failure analysis.

## Presentation Format

When suggesting techniques:

```
I've completed the initial [spec/architecture/plan]. To go deeper, I can
apply one or more of these analysis techniques:

1. Pre-mortem Analysis -- surface hidden risks by imagining failure
2. Red Team / Blue Team -- identify security gaps and attack vectors
3. Inversion Analysis -- discover missing acceptance criteria

Which would you like to explore? (You can select multiple or skip.)
```

Always suggest exactly 3 techniques chosen for relevance. User decides.
