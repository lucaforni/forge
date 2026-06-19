---
description: "Produce a UX/UI design spec (personas, user journeys, wireframes, components, a11y) for an existing feature spec"
agent: forge-ux
subtask: true
---

# UX/UI Design Phase

Handle `/forge-ux` to produce a complete UX/UI design spec for an already-specified feature.

## Arguments

Optional spec reference: $ARGUMENTS

- Spec ID/path → use that spec.
- None → most recently modified spec in `.forge/specs/`.

## Context Loading

1. `.forge/specs/NNN-slug/spec.md` — **required**. STOP if missing; ask user to run `/forge-specify` first.
2. `.forge/constitution.md` — governance + tech stack.
3. `.forge/ux/design-system.md` — existing tokens/components (optional).
4. `.forge/architecture/architecture.md` — platform constraints (optional).

## Discovery Process

### Step 1: Platform & Context Discovery

Ask up to 4 focused questions (use `question` tool, conversational):

1. **Platform**: Web SPA/SSR, Mobile, API, Design System?
2. **Design system**: Exists? (Tailwind, Material, custom tokens, Figma)
3. **Priority screens**: Which 2-3 are most critical?
4. **Constraints**: Brand guidelines, a11y certifications (WCAG AAA), viewport targets?

### Step 2: Load UX Design Skill

Load `ux-design` skill for full methodology, wireframe conventions, component spec format.

### Step 3: Personas & User Journeys

From spec's user stories and personas:

1. Define 2-3 **personas**: name, role, goal, pain point, tech literacy.
2. Per persona, map a **user journey**: trigger, numbered steps, outcome, emotional annotations.
3. Include: happy path + ≥2 edge cases (error, empty, permission denied).

Save to `.forge/specs/NNN-slug/user-journey.md` using `.opencode/templates/user-journey.md`.

### Step 4: Wireframes & Component Specs

Per priority screen:
1. ASCII wireframe (per `ux-design` skill).
2. Interactive elements (buttons, inputs, links, toggles).
3. Interaction states: default, hover, active, disabled, error, loading, empty, success.
4. Responsive behavior where applicable.
5. Map each element to source FR (e.g., "Per FR-003").

### Step 5: Accessibility (WCAG 2.1 AA)

Per screen/component document:
- Color contrast ratios (minimum)
- Keyboard nav + tab order
- Focus indicator specs
- ARIA roles, labels, live regions
- Screen reader announcements
- Error identification + form label requirements

### Step 6: Design System Tokens

If no design system, or new tokens introduced:
1. Define/update: color palette, typography scale, spacing scale, border radius, shadow levels.
2. Format: CSS custom properties or project styling approach.
3. Save to `.forge/ux/design-system.md`.

### Step 7: Save Design Spec

Write `.forge/specs/NNN-slug/design-spec.md` using `.opencode/templates/design-spec.md`.

Must include: spec reference + FR traceability, platform/viewport targets, wireframes per key screen, component inventory with states, a11y requirements table, design tokens.

### Step 8: Summary & Next Steps

Report: # personas, # journeys, # wireframes, # components, # tokens (defined/reused), a11y coverage (screens with full WCAG 2.1 AA), # `[NEEDS CLARIFICATION]`.

Next:
- Architectural implications → `/forge-adr` (e.g., component library choice).
- Spec ready → `/forge-plan`.
- Incomplete wireframes → `/forge-wireframe` for additional screens.
