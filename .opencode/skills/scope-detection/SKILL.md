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

Evaluate task complexity to recommend the appropriate FORGE track. Apply the 7-factor assessment; output a structured recommendation. User has final say.

## The 7 Factors

### Factor 1: Files Affected

| Score | Range | Track |
|-------|-------|-------|
| 1 | 1-2 | Hotfix |
| 2 | 2-5 | Quick |
| 3 | 5-15 | Feature |
| 4 | 15-50 | Epic |
| 5 | 50+ | Product |

### Factor 2: Estimated Tasks

| Score | Range | Track |
|-------|-------|-------|
| 1 | 1 | Hotfix |
| 2 | 2-5 | Quick |
| 3 | 5-20 | Feature |
| 4 | 20-50 | Epic |
| 5 | 50+ | Product |

### Factor 3: New Dependencies

| Score | Range | Track |
|-------|-------|-------|
| 1 | 0 | Hotfix |
| 2 | 0-1 | Quick |
| 3 | 1-3 | Feature |
| 4 | 3+ | Epic |
| 5 | Stack decision | Product |

### Factor 4: Schema Changes

| Score | Level | Track |
|-------|-------|-------|
| 1 | None | Hotfix |
| 2 | Minor | Quick |
| 3 | Moderate | Feature |
| 4 | Significant | Epic |
| 5 | Full design | Product |

### Factor 5: API Surface Changes

| Score | Level | Track |
|-------|-------|-------|
| 1 | None | Hotfix |
| 2 | None | Quick |
| 3 | Yes | Feature |
| 4 | Yes, multiple | Epic |
| 5 | Full API | Product |

### Factor 6: Cross-Module Impact

| Score | Level | Track |
|-------|-------|-------|
| 1 | No | Hotfix |
| 2 | No | Quick |
| 3 | Maybe | Feature |
| 4 | Yes | Epic |
| 5 | Yes | Product |

### Factor 7: Needs New Patterns

| Score | Level | Track |
|-------|-------|-------|
| 1 | No | Hotfix |
| 2 | No | Quick |
| 3 | Maybe | Feature |
| 4 | Likely | Epic |
| 5 | Yes | Product |

## Scoring Algorithm

1. Score each factor 1-5.
2. Weighted average:
   - Factors 1-2 (Files, Tasks): weight 2× (most concrete).
   - Factors 3-7: weight 1×.
3. Map average to track:
   - 1.0 - 1.4: Hotfix
   - 1.5 - 2.4: Quick
   - 2.5 - 3.4: Feature
   - 3.5 - 4.4: Epic
   - 4.5 - 5.0: Product

## Output Format

Structured JSON + human-readable summary:

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

## Escalation / Downgrade

- If user chose a track but assessment differs, explain why and recommend the assessed track. User decides.
- If scope grows beyond current track during implementation, alert immediately with updated assessment.
- Common escalation triggers:
  - **Hotfix → Quick**: fix requires > 2 files or introduces patterns.
  - **Quick → Feature**: > 5 tasks discovered during implementation.
  - **Feature → Epic**: > 20 tasks or significant architectural changes.
