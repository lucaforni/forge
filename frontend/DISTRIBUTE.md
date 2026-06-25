# Frontend Pattern Library — Distribution Guide

> **Target**: React + shadcn/ui + Tailwind projects using FORGE
> **License**: MIT · **Status**: ✅ Ready for distribution

---

## What to Distribute

The Pattern Library consists of `.md` files (specifications) and `.tsx` files (templates)
that must be copied into `.forge/frontend/` of the target project.

```
Distribute:
.forge/frontend/
├── stack-decisions.md              ← Adapt: framework, versions
├── design-system.md                ← Adapt: brand colors, tokens
├── qa-checklist-template.md        ← Copy as-is
└── patterns/
    ├── index.md                    ← Copy as-is
    ├── pattern-*.md (17 files)     ← Copy as-is
    └── templates/
        ├── *.tsx (17 files)        ← Copy as-is
        └── __tests__/
            └── *.test.tsx (17 files) ← Copy (reference for QA)
```

**Do not distribute**:
- `.forge/epics/` — internal planning
- `.forge/sprints/` — sprint tracking
- `.forge/knowledge/` — ADRs, lessons learned
- `.forge/specs/` demo feature — FORGE project artifacts only (do not copy)
- `.opencode/skills/frontend-pattern-library/` — FORGE only

---

## Installation in Target Project

### Method 1: Manual copy (recommended)

```bash
# 1. Copy foundation
cp -r .forge/frontend/stack-decisions.md /path/to/project/.forge/frontend/
cp -r .forge/frontend/design-system.md /path/to/project/.forge/frontend/
cp -r .forge/frontend/qa-checklist-template.md /path/to/project/.forge/frontend/

# 2. Copy patterns
cp -r .forge/frontend/patterns/ /path/to/project/.forge/frontend/patterns/

# 3. Customize stack-decisions.md with the project's stack
# 4. Customize design-system.md with brand colors
```

### Method 2: Init script (Roadmap)

> **Status**: To be implemented. See Roadmap below.

```bash
# Quick setup — future
npx forge-frontend-init
```

---

## Customization for Project

### 1. Adapt `stack-decisions.md`

| Section | What to change |
|---------|--------------|
| Framework | React version, Next.js/Vite, routing |
| Component Library | shadcn/ui version, or alternative library |
| State Management | React Query version, Zustand or alternative |
| Forms | React Hook Form + Zod, or alternative |
| Testing | Vitest/Jest, React Testing Library |
| Project Structure | Project folder paths |

### 2. Adapt `design-system.md`

| Section | What to change |
|---------|--------------|
| Colors | Brand palette (primary, secondary, accent) |
| Typography | Project font family |
| Spacing | Any custom scales |
| Shadows | If the project has different shadow values |
| Component Inventory | If using a different version of shadcn/ui |

### 3. Patterns: unchanged

Patterns and templates must NOT be modified. They are references that Build uses
to generate code. If a pattern does not fit, create a new one in the
project (following the 9-section structure).

---

## Post-Install Verification

Checklist to confirm the Pattern Library is operational:

```
□ .forge/frontend/stack-decisions.md       — customized for the project
□ .forge/frontend/design-system.md         — tokens aligned to the brand
□ .forge/frontend/qa-checklist-template.md — present
□ .forge/frontend/patterns/index.md        — present
□ .forge/frontend/patterns/pattern-*.md (17) — all present
□ .forge/frontend/patterns/templates/*.tsx (17) — all present
□ .forge/frontend/patterns/templates/__tests__/*.test.tsx (17) — all present

FORGE flow verified:
□ forge-ux loads frontend-pattern-library skill → produces design-spec with Pattern Reference
□ Build uses templates as reference → implements ALL states
□ forge-reviewer verifies pattern QA checklist → finds specific issues
```

---

## FORGE Skill (optional)

If the project uses FORGE with agents, also copy the skill:

```bash
cp -r .opencode/skills/frontend-pattern-library/ /path/to/project/.opencode/skills/
```

Then update the `forge-ux` agent to load the skill (see `.opencode/agents/forge-ux.md`
"Skills" section).

---

## Maintenance

| Activity | Frequency | What to do |
|----------|-----------|-----------|
| Update components | Per shadcn/ui version | Verify component inventory |
| New pattern | When needed | Follow 9-section template |
| Update templates | When Radix/Tailwind changes | Keep templates working |
| Review pattern library | Every 6 months | Retrospective, clean up obsolete patterns |

---

## Completed Files

```
.forge/frontend/
├── stack-decisions.md              ✅ 294 lines
├── design-system.md                ✅ 464 lines
├── qa-checklist-template.md        ✅ 168 lines
└── patterns/
    ├── index.md                    ✅ 161 lines — decision tree + matrix
    ├── pattern-data-table.md       ✅ 396 lines
    ├── pattern-form.md             ✅ 516 lines
    ├── pattern-search.md           ✅ 669 lines
    ├── pattern-master-detail.md    ✅ 383 lines
    ├── pattern-empty-state.md      ✅ 224 lines
    ├── pattern-dashboard.md        ✅ 363 lines
    ├── pattern-kpi-card.md         ✅ 268 lines
    ├── pattern-loading-skeleton.md ✅ 313 lines
    ├── pattern-modal-flow.md       ✅ 391 lines
    ├── pattern-drawer-panel.md     ✅ 398 lines
    ├── pattern-notification.md     ✅ 318 lines
    ├── pattern-error-recovery.md   ✅ 346 lines
    ├── pattern-wizard.md           ✅ 412 lines
    ├── pattern-infinite-scroll.md  ✅ 489 lines
    ├── pattern-command-palette.md  ✅ 419 lines
    ├── pattern-settings-panel.md   ✅ 446 lines
    └── pattern-confirmation.md     ✅ 470 lines
    └── templates/
        ├── 17 .tsx files           ✅ 17/17 working templates
        └── __tests__/
            └── 17 .test.tsx files  ✅ 149 total test cases
```

### Reference & Validation (DO NOT distribute)

```
.forge/specs/001-elenco-ordini/
├── spec.md                         ✅ Feature spec
├── design-spec.md                  ✅ With Pattern Reference (1,110 lines)
├── user-journey.md                 ✅ 3 personas, 7 journeys
├── demo/
    ├── OrdersPage.tsx              ✅ 25 issues fixed (1,073 lines)
    └── api-mock.ts                 ✅ With error injection + restore
```

These files are validation artifacts of the FORGE repository and are NOT part
of the distribution.

---

## Quick Export

```bash
# Run from the FORGE project root to copy into a target project
set -e
TARGET="/path/to/target-project"

mkdir -p "$TARGET/.forge/frontend/patterns/templates/__tests__"

cp .forge/frontend/stack-decisions.md "$TARGET/.forge/frontend/"
cp .forge/frontend/design-system.md "$TARGET/.forge/frontend/"
cp .forge/frontend/qa-checklist-template.md "$TARGET/.forge/frontend/"
cp .forge/frontend/patterns/index.md "$TARGET/.forge/frontend/patterns/"

for f in .forge/frontend/patterns/pattern-*.md; do
  cp "$f" "$TARGET/.forge/frontend/patterns/"
done

for f in .forge/frontend/patterns/templates/*.tsx; do
  cp "$f" "$TARGET/.forge/frontend/patterns/templates/"
done

for f in .forge/frontend/patterns/templates/__tests__/*.test.tsx; do
  cp "$f" "$TARGET/.forge/frontend/patterns/templates/__tests__/"
done

echo "✅ Pattern Library copied to $TARGET"
echo "⚠️  Customize stack-decisions.md and design-system.md for the target project"
```
