---
description: "Generate ASCII wireframes and interaction specs for specific screens or components"
agent: forge-ux
subtask: true
model: github-copilot/claude-opus-4.6
---

# Wireframe Generation

You are handling `/forge-wireframe` to produce focused ASCII wireframes and
interaction specifications for specific screens or UI components.

## Arguments

Screen or component description: $ARGUMENTS

- If a screen name or description is provided, generate wireframe(s) for that.
- If a spec ID is provided (e.g. `001-user-auth`), read the spec and generate
  wireframes for all screens listed in it.
- If `--all` is provided, generate wireframes for every screen/flow in the
  most recent spec.

## Context Loading

Before starting, read:

1. `.forge/specs/NNN-slug/spec.md` — source of truth for screen requirements.
2. `.forge/specs/NNN-slug/design-spec.md` — existing design spec to append to
   (if it exists).
3. `.forge/ux/design-system.md` — available components and tokens (optional).

## Wireframe Protocol

For each screen or component requested:

### 1. Screen Header

```
## Screen: [Screen Name]
Source: [FR-NNN, FR-NNN] | Spec: [spec path]
Platform: [Web / Mobile / Both]
```

### 2. ASCII Wireframe

Use this convention:

```
+--------------------------------------------------+  W: 1440px (desktop)
| NAVIGATION BAR                        [User ▾]  |
+--------------------------------------------------+
|                                                  |
|  [Page Title]                                    |
|  [Subtitle / breadcrumb]                         |
|                                                  |
|  +--------------------------------------------+  |
|  | [Card / Panel label]                       |  |
|  |                                            |  |
|  |  [Label]  [___Input field___________]      |  |
|  |  [Label]  [___Input field___________] [!]  |  |
|  |                                            |  |
|  |  [ Cancel ]          [ Primary CTA    ]   |  |
|  +--------------------------------------------+  |
|                                                  |
+--------------------------------------------------+
Footer: [links]
```

Legend:
- `[Text]` = text element / label
- `[___Field___]` = text input
- `[▾]` = dropdown
- `[○]` = radio / `[☐]` = checkbox / `[●]` = selected
- `[CTA]` = button (Primary) / `[ btn ]` = button (Secondary)
- `[!]` = validation error indicator
- `[≡]` = hamburger / menu
- `[×]` = close / dismiss

For mobile (375px), show a separate narrowed layout:

```
+------------------+  W: 375px (mobile)
| ≡  [App Name]   |
+------------------+
| [Page Title]     |
|                  |
| [Label]          |
| [___Field_____]  |
| [!] Error msg    |
|                  |
| [ Primary CTA  ] |
+------------------+
```

### 3. State Inventory

For each screen, list all states:

| State | Trigger | Visual Change | User Feedback |
|-------|---------|---------------|---------------|
| Default | Page load | Normal layout | — |
| Loading | Action in progress | Skeleton / spinner | "Loading..." |
| Error | Validation fail / API error | Red border, error message | Inline text |
| Empty | No data | Illustration + CTA | "No items yet. [Add one]" |
| Success | Action completed | Green banner / toast | "Saved successfully" |
| Disabled | Permission / condition | Grayed out, no pointer | Tooltip on hover |

### 4. Interactive Elements

List every element a user can interact with:

| Element | Type | Action | Outcome |
|---------|------|--------|---------|
| [Name] | button / input / link / toggle | click / type / select | [what happens] |

### 5. Accessibility Annotations

```
Accessibility: Screen "[Screen Name]"
  - Role: [main landmark, form, dialog, etc.]
  - Heading hierarchy: h1 → h2 → h3 (list them)
  - Tab order: [1] Element → [2] Element → [3] Element
  - Focus trap: [yes/no — if modal/dialog, yes]
  - ARIA labels:
      [element]: aria-label="[text]"
      [element]: aria-describedby="[id]"
  - Live regions: [aria-live="polite"] on [toast/error container]
  - Color contrast:
      Body text (#333 on #fff): 12.6:1 ✓
      Button text (#fff on #0066cc): 5.3:1 ✓
      Error text (#cc0000 on #fff): 5.9:1 ✓
  - Keyboard shortcuts: [list if any]
  - Screen reader flow: [describe the announce sequence]
```

### 6. Responsive Notes

If the screen has responsive variations, note the key layout changes:

```
Responsive Behavior:
  - 1440px (desktop): Two-column layout, sidebar visible
  - 1024px (tablet): Single column, sidebar collapses to drawer
  - 768px (tablet-portrait): Same as 1024px but tighter spacing
  - 375px (mobile): Full-width cards, stacked inputs, sticky CTA
```

## Saving the Output

1. If `.forge/specs/NNN-slug/design-spec.md` exists: **append** the new
   wireframes to the `## Wireframes` section.
2. If it does not exist: save to `.forge/specs/NNN-slug/design-spec.md`
   with only the wireframes section filled, and note that a full design
   spec should be produced with `/forge-ux`.

## Anti-Patterns

- Do NOT produce wireframes without linking them to at least one FR.
- Do NOT skip the states inventory. Empty and error states are as important
  as the happy path.
- Do NOT skip accessibility annotations. They are required for every screen.
- Do NOT use external image references. All design is in text/markdown.
