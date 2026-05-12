# /forge-archive-decisions

Archive completed decision log entries to reduce context size while preserving
pending, in-progress, and critical decisions.

## Usage

```bash
/forge-archive-decisions [options]
```

| Option            | Effect                                                  |
| ----------------- | ------------------------------------------------------- |
| `--dry-run`       | Preview without changes                                 |
| `--force`         | Archive even if below thresholds                        |
| `--keep <N>`      | Override config — keep last N entries (default 30)      |
| `--validate-only` | Only validate entry format, don't archive               |

Examples:
```bash
/forge-archive-decisions                        # standard (auto-triggered when needed)
/forge-archive-decisions --dry-run              # preview
/forge-archive-decisions --force                # force below threshold
/forge-archive-decisions --keep 50              # keep last 50
/forge-archive-decisions --validate-only        # format check
```

---

## What It Does

Implements intelligent archiviation via the `decision-archiver` skill:

1. Parse `.forge/knowledge/decision-log.md`.
2. Check thresholds (500 lines / 20k tokens by default).
3. Identify archivable entries (completed, not recent, not critical).
4. Preserve pending/in-progress/blocked + last N entries.
5. Move archivable entries to `.forge/knowledge/archives/YYYY-MM/`.
6. Update archive index.
7. Report statistics and space saved.

---

## When to Use

**Automatic**: orchestrator checks log size at command start. If thresholds exceeded:
```
⚠️ Decision log is large (1247 lines, ~50k tokens)
   Run: /forge-archive-decisions
```

**Manual**: before new Epic / major Feature, under context pressure, after sprint/milestone, monthly maintenance.

---

## Retention Rules

| Will be archived ✅                                  | Never archived ❌                                          |
| ---------------------------------------------------- | --------------------------------------------------------- |
| Status `completed`/`resolved`/`cancelled`/`superseded` | Status `pending`/`in-progress`/`blocked`                  |
| Older than last N entries (default 30)              | Last N entries (default 30), any status                   |
| Not tagged critical/constitutional/breaking-change   | Tagged critical/constitutional/breaking-change            |
| Not referenced by active specs                       | Referenced by specs in active development                 |

---

## Archive Structure

```
.forge/knowledge/
├── decision-log.md              # Active log (kept small)
├── archives/
│   ├── index.md                 # Master index
│   ├── 2026-02/
│   │   ├── decisions-2026-02.md
│   │   └── index.md             # Month summary
│   └── 2026-01/
│       ├── decisions-2026-01.md
│       └── index.md
```

---

## Example Output

```
🗂️ Archiving Decision Log...

📋 Analyzing decision-log.md
   - Total entries: 124
   - Total lines: 3521
   - Estimated tokens: ~141k

🔍 Applying retention rules...
   ✅ Keep last 30 entries: 30
   ✅ Keep pending/in-progress/blocked: 12
   ✅ Keep critical tags: 5
   ✅ Keep referenced by active specs: 3

   Total kept: 50 entries (accounting for overlaps)
   Archivable: 74 entries

📦 Creating archives...
   ✅ archives/2026-02/decisions-2026-02.md (+45 entries)
   ✅ archives/2026-01/decisions-2026-01.md (+29 entries)
   ✅ Updated archives/index.md

✅ Archiviation Complete!

📊 Results:
   - Active log: 50 entries (was 124)
   - Archived: 74 entries
   - Lines: 487 (was 3521) — 86% saved 🎉
   - Tokens: ~19.5k (was ~141k)

💡 Next steps:
   - Review archives at: .forge/knowledge/archives/
   - Consider promoting key decisions to ADRs: /forge-adr
```

---

## Dry-Run Mode

```bash
/forge-archive-decisions --dry-run
```

```
🔍 DRY RUN MODE - No changes will be made

📋 Would archive 74 entries:

Archives to create:
   📁 archives/2026-02/decisions-2026-02.md (+45 entries)
      - DEC-2026-042: Auth system architecture
      - DEC-2026-055: Database migration strategy
      ... (43 more)

   📁 archives/2026-01/decisions-2026-01.md (+29 entries)
      - DEC-2026-001: Initial tech stack
      - DEC-2026-015: API versioning approach
      ... (27 more)

Entries to keep (50):
   ✅ Last 30 entries (by date)
   ✅ 12 pending/in-progress/blocked
   ✅ 5 with critical tags
   ✅ 3 referenced by active specs

Run without --dry-run to apply changes.
```

---

## Validation Mode

```bash
/forge-archive-decisions --validate-only
```

```
🔍 Validating decision log entries...

✅ 120/124 entries valid

⚠️ Issues found:

Entry at line 234 (2026-02-10):
   ❌ Missing required field: Status
   💡 Add: **Status:** `completed`

Entry at line 456 (2026-02-05):
   ⚠️ Unknown status value: "done"
   💡 Valid values: pending, in-progress, blocked, completed, resolved, cancelled, superseded

Entry at line 789 (2026-01-28):
   ⚠️ Optional field missing: Tags
   💡 Consider adding tags for better organization

Fix these issues before archiving.
Use the template: .opencode/templates/decision-log-entry-template.md
```

---

## Configuration

`.forge/config.yml`:
```yaml
knowledge:
  decision_log:
    max_lines: 500
    max_tokens: 20000
    keep_recent: 30
    auto_archive: true

    critical_tags:           # Never archive these
      - critical
      - constitutional
      - breaking-change
      - security-critical
```

---

## Troubleshooting

| Error                                  | Cause                                          | Fix                                          |
| -------------------------------------- | ---------------------------------------------- | -------------------------------------------- |
| Parse error: malformed entry           | Entry doesn't follow required format           | Run `--validate-only`, fix, use template     |
| No entries eligible for archiviation   | All entries pending/in-progress or within last N | Normal — archive later                       |
| Archive file already exists            | Appending to existing archive (normal)         | No action — appended chronologically         |

---

## Related

- `/forge-adr` — promote decisions to formal ADRs
- `/forge-status` — project status + knowledge base stats
- `/forge-help knowledge` — knowledge management in FORGE

---

## Implementation

Loads and executes the `decision-archiver` skill:
1. Parse decision-log.md (Read).
2. Filter by status and retention rules.
3. Create archive structure (Bash + Write).
4. Update decision-log.md (Edit).
5. Generate summary report.

See `.opencode/skills/decision-archiver/SKILL.md` for detailed logic.
