---
name: scope-detection
description: Assess task complexity across 7 factors and recommend the appropriate FORGE workflow track (Hotfix, Quick, Feature, Epic, Product)
license: MIT
compatibility: opencode
metadata:
  audience: forge-orchestrator
  workflow: forge
---

## Purpose

You are evaluating a task's complexity to recommend the appropriate FORGE
workflow track. Apply the 7-factor assessment below and output a structured
recommendation. The user always has the final say.

## The 7 Assessment Factors

Evaluate the task against each factor:

### Factor 1: Files Affected

How many source files will be created or modified?

| Score | Range    | Track Indication |
| ----- | -------- | ---------------- |
| 1     | 1-2      | Hotfix           |
| 2     | 2-5      | Quick            |
| 3     | 5-15     | Feature          |
| 4     | 15-50    | Epic             |
| 5     | 50+      | Product          |

### Factor 2: Estimated Tasks

How many distinct implementation tasks are needed?

| Score | Range    | Track Indication |
| ----- | -------- | ---------------- |
| 1     | 1        | Hotfix           |
| 2     | 2-5      | Quick            |
| 3     | 5-20     | Feature          |
| 4     | 20-50    | Epic             |
| 5     | 50+      | Product          |

### Factor 3: New Dependencies

How many new external dependencies (packages, services) are needed?

| Score | Range           | Track Indication |
| ----- | --------------- | ---------------- |
| 1     | 0               | Hotfix           |
| 2     | 0-1             | Quick            |
| 3     | 1-3             | Feature          |
| 4     | 3+              | Epic             |
| 5     | Stack decision  | Product          |

### Factor 4: Schema Changes

What level of data model changes are needed?

| Score | Level        | Track Indication |
| ----- | ------------ | ---------------- |
| 1     | None         | Hotfix           |
| 2     | Minor        | Quick            |
| 3     | Moderate     | Feature          |
| 4     | Significant  | Epic             |
| 5     | Full design  | Product          |

### Factor 5: API Surface Changes

Does this change the public API or create new endpoints?

| Score | Level          | Track Indication |
| ----- | -------------- | ---------------- |
| 1     | None           | Hotfix           |
| 2     | None           | Quick            |
| 3     | Yes            | Feature          |
| 4     | Yes, multiple  | Epic             |
| 5     | Full API       | Product          |

### Factor 6: Cross-Module Impact

Does this change affect multiple modules or services?

| Score | Level   | Track Indication |
| ----- | ------- | ---------------- |
| 1     | No      | Hotfix           |
| 2     | No      | Quick            |
| 3     | Maybe   | Feature          |
| 4     | Yes     | Epic             |
| 5     | Yes     | Product          |

### Factor 7: Needs New Patterns

Does this require introducing new architectural patterns or conventions?

| Score | Level   | Track Indication |
| ----- | ------- | ---------------- |
| 1     | No      | Hotfix           |
| 2     | No      | Quick            |
| 3     | Maybe   | Feature          |
| 4     | Likely  | Epic             |
| 5     | Yes     | Product          |

## Scoring Algorithm

1. Score each factor 1-5.
2. Calculate the weighted average:
   - Factors 1-2 (Files, Tasks): weight 2x (most concrete indicators)
   - Factors 3-7 (Dependencies, Schema, API, Cross-module, Patterns): weight 1x
3. Map the average to a track:
   - 1.0 - 1.4: Hotfix
   - 1.5 - 2.4: Quick
   - 2.5 - 3.4: Feature
   - 3.5 - 4.4: Epic
   - 4.5 - 5.0: Product

## Output Format

Present the assessment as structured JSON followed by a human-readable
summary:

```json
{
  "assessment": {
    "files_affected": { "score": 3, "reasoning": "~10 files across auth module" },
    "estimated_tasks": { "score": 3, "reasoning": "8-12 tasks estimated" },
    "new_dependencies": { "score": 2, "reasoning": "1 new auth library" },
    "schema_changes": { "score": 3, "reasoning": "New users table, modify sessions" },
    "api_surface": { "score": 3, "reasoning": "4 new auth endpoints" },
    "cross_module": { "score": 2, "reasoning": "Primarily auth module" },
    "new_patterns": { "score": 3, "reasoning": "New middleware pattern for auth" }
  },
  "weighted_average": 2.78,
  "recommended_track": "Feature",
  "confidence": "high"
}
```

```
Scope Assessment
================
Recommended track: Feature (score: 2.78/5.0)
Confidence: High

Key factors:
  - ~10 files across auth module (Feature-scale)
  - 8-12 implementation tasks (Feature-scale)
  - New database tables + auth endpoints (Feature-scale)
  - Mostly contained to auth module (simpler cross-module impact)

This task fits the Feature track. You'll need:
  /forge-specify -> /forge-plan -> /forge-tasks -> /forge-implement -> /forge-review

Would you like to proceed with the Feature track?
```

## Escalation and Downgrade Guidance

- If the user chose a track but the assessment suggests differently, explain
  why and recommend the assessed track. Let the user decide.
- If during implementation the scope grows beyond the current track, alert
  the user immediately with an updated assessment.
- Common escalation triggers:
  - Hotfix -> Quick: Fix requires more than 2 files or introduces patterns
  - Quick -> Feature: More than 5 tasks discovered during implementation
  - Feature -> Epic: More than 20 tasks or significant architectural changes
