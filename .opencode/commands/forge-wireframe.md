---
description: "Generate ASCII wireframes and interaction specs for specific screens or components"
agent: forge-ux
subtask: true
---

# Wireframe Generation

Handle `/forge-wireframe` to produce focused ASCII wireframes and interaction specs.

## Arguments

Screen/component description: $ARGUMENTS

- Screen name/description → wireframe(s) for that.
- Spec ID (e.g. `001-user-auth`) → wireframes for all screens in spec.
- `--all` → every screen/flow in most recent spec.

## Context Loading

1. `.forge/specs/NNN-slug/spec.md` — screen requirements (source of truth).
2. `.forge/specs/NNN-slug/design-spec.md` — append target (if exists).
3. `.forge/ux/design-system.md` — components/tokens (optional).

## Wireframe Protocol

For each screen:

### 1. Screen Header

```
## Screen: [Screen Name]
Source: [FR-NNN, FR-NNN] | Spec: [spec path]
Platform: [Web / Mobile / Both]
```

### 2. ASCII Wireframe

Convention:

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

Legend: `[Text]` text/label · `[___Field___]` input · `[▾]` dropdown · `[○]`/`[☐]`/`[●]` radio/checkbox/selected · `[CTA]`/`[ btn ]` primary/secondary button · `[!]` validation error · `[≡]` menu · `[×]` close.

Mobile (375px) — separate narrowed layout:

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

| State | Trigger | Visual Change | User Feedback |
|-------|---------|---------------|---------------|
| Default | Page load | Normal layout | — |
| Loading | Action in progress | Skeleton / spinner | "Loading..." |
| Error | Validation fail / API error | Red border, error message | Inline text |
| Empty | No data | Illustration + CTA | "No items yet. [Add one]" |
| Success | Action completed | Green banner / toast | "Saved successfully" |
| Disabled | Permission / condition | Grayed out, no pointer | Tooltip on hover |

### 4. Interactive Elements

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

```
Responsive Behavior:
  - 1440px (desktop): Two-column layout, sidebar visible
  - 1024px (tablet): Single column, sidebar collapses to drawer
  - 768px (tablet-portrait): Same as 1024px, tighter spacing
  - 375px (mobile): Full-width cards, stacked inputs, sticky CTA
```

## Saving

- If `design-spec.md` exists: **append** to `## Wireframes` section.
- Else: create `.forge/specs/NNN-slug/design-spec.md` with only wireframes section; note that `/forge-ux` should produce the full design spec.

## Anti-Patterns

- No wireframes without linking to ≥1 FR.
- No skipping the states inventory (empty/error states required).
- No skipping a11y annotations (required per screen).
- No external image references — all design in text/markdown.
