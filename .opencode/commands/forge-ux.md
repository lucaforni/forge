---
description: "Produce a UX/UI design spec (personas, user journeys, wireframes, components, a11y) for an existing feature spec"
agent: forge-ux
subtask: true
model: github-copilot/claude-opus-4.6
---

# UX/UI Design Phase

You are handling `/forge-ux` to produce a complete UX/UI design specification
for a feature that has already been specified.

## Arguments

Optional spec reference: $ARGUMENTS

- If a spec ID (e.g. `001-user-auth`) or path is provided, use that spec.
- If no argument, use the most recently modified spec in `.forge/specs/`.

## Context Loading

Before starting, read the following upstream documents:

1. `.forge/specs/NNN-slug/spec.md` — **required**. The feature spec. STOP
   and ask the user to run `/forge-specify` first if it does not exist.
2. `.forge/constitution.md` — governance constraints and tech stack.
3. `.forge/ux/design-system.md` — existing design tokens/components (optional).
4. `.forge/architecture/architecture.md` — platform constraints (optional).

## Discovery Process

### Step 1: Platform and Context Discovery

Ask the user up to 4 focused questions:

1. **Platform**: What is the primary target? (Web SPA/SSR, Mobile, API, Design System)
2. **Design system**: Does a design system already exist? (e.g. Tailwind, Material,
   custom tokens, Figma)
3. **Priority screens**: Which 2-3 screens or flows are the most critical to design?
4. **Constraints**: Are there brand guidelines, accessibility certifications
   (e.g. WCAG AAA), or viewport targets to keep in mind?

Use the `question` tool for choices. Keep it conversational.

### Step 2: Load UX Design Skill

Load the `ux-design` skill for the full methodology, wireframe conventions,
and component spec format.

### Step 3: Personas and User Journeys

From the spec's user stories and personas:

1. Define 2-3 **personas** — name, role, goal, pain point, tech literacy.
2. For each persona, map a **user journey**:
   - Trigger (what makes them start?)
   - Steps (numbered actions)
   - Outcome (what success looks like)
   - Emotional annotations (where do they get frustrated? delighted?)
3. Include:
   - Happy path (primary success flow)
   - At least 2 edge cases (error state, empty state, permission denied)

Save to `.forge/specs/NNN-slug/user-journey.md` using the template at
`.opencode/templates/user-journey.md`.

### Step 4: Wireframes and Component Specs

For each priority screen identified in Step 1:

1. Draw an **ASCII wireframe** (see wireframe convention in `ux-design` skill).
2. List all **interactive elements** (buttons, inputs, links, toggles).
3. Specify **interaction states**: default, hover, active, disabled, error,
   loading, empty, success.
4. Define **responsive behavior** where applicable.
5. Map each element to its source FR (e.g. "Per FR-003").

### Step 5: Accessibility (WCAG 2.1 AA)

For every screen and component, document:

- Color contrast requirements (minimum ratios)
- Keyboard navigation and tab order
- Focus indicator specifications
- ARIA roles, labels, and live regions needed
- Screen reader announcement descriptions
- Error identification and form label requirements

### Step 6: Design System Tokens

If the project has no design system, or if this feature introduces new tokens:

1. Define/update: color palette, typography scale, spacing scale,
   border radius, shadow levels.
2. Use a format compatible with CSS custom properties or the project's
   styling approach.
3. Save to `.forge/ux/design-system.md`.

### Step 7: Save Design Spec

Save the full design document to `.forge/specs/NNN-slug/design-spec.md`
using the template at `.opencode/templates/design-spec.md`.

The design spec must include:
- Spec reference and FR traceability
- Platform and viewport targets
- Wireframes (one per key screen)
- Component inventory with states
- Accessibility requirements table
- Design tokens referenced or defined

### Step 8: Summary and Next Steps

Present a summary:
- Number of personas defined
- Number of user journeys mapped
- Number of wireframes produced
- Number of components specified
- Number of design tokens defined or reused
- Accessibility coverage (number of screens with full WCAG 2.1 AA specs)
- Any `[NEEDS CLARIFICATION]` markers

Recommend next steps:
- If design decisions have architectural implications: suggest `/forge-adr`
  for technology choices (e.g., component library selection).
- If spec is ready: `/forge-plan` to create the technical implementation plan.
- If wireframes are incomplete: `/forge-wireframe` for additional screens.
