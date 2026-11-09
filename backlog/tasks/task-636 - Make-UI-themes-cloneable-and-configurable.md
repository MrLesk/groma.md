---
id: TASK-636
title: Make UI themes cloneable and configurable
status: In Progress
assignee:
  - '@claude'
created_date: '2026-10-28T20:33:00Z'
updated_date: '2026-11-09T22:46:00Z'
labels:
  - personalization
milestone: m-6
dependencies:
  - TASK-637
references:
  - src/config.ts
  - src/viewers/web/atoms/theme.ts
  - src/viewers/web/chrome/theme-control.ts
  - src/viewers/web/chrome/shell.ts
documentation:
  - ROADMAP.md
  - docs/config.md
  - docs/viewers/web/index.md
modified_files:
  - src/themes/definition.ts
  - src/themes/bundled.ts
  - src/viewers/web/atoms/theme.ts
  - src/config.ts
  - src/themes/configured.ts
  - src/viewers/web/startup/page.ts
  - src/viewers/web/payload.ts
  - src/viewers/web/page.ts
  - src/viewers/web/chrome/theme-control.ts
  - src/viewers/web/url.ts
  - src/viewers/web/data.ts
  - src/viewers/web/iso/painting/style.ts
  - src/viewers/web/sharing/cover.ts
  - src/viewers/web/sharing/images.ts
  - src/viewers/web/sharing/metadata.ts
  - src/viewers/web/render.ts
  - src/viewers/web/export.ts
  - src/viewers/web/map-session.ts
  - test-bun/web-sharing.test.ts
  - src/themes/management.ts
  - src/plugins/management.ts
  - src/plugins/cli.ts
type: feature
ordinal: 700000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
A project owner can clone Light, Dark, or Blueprint, edit the UI palette, and choose exactly which themes appear in Groma. The same theme definition must serve bundled and custom themes.

The existing configuration owns enabled theme plugins and their system light/dark associations. The theme control owns the selected theme or Auto mode. UI themes cover interface surfaces, map background, text, grid, and controls; authored architecture icons and colors have separate owners.

This is application configuration, not architecture knowledge: it introduces no OKF concept or C4 element. It should work independently of project language or framework. Build from current main, using the old PoC only to understand the intended result.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Light, Dark, and Blueprint are bundled UI theme plugins using the same definition and loading path as a custom theme.
- [ ] #2 A user can clone any bundled theme, change its UI palette, register the clone in config.json, and select it without editing Groma's source.
- [ ] #3 The picker lists exactly the enabled themes in config.json. Removing a bundled theme from that configuration keeps it out of the picker after reload.
- [ ] #4 Configuration associates enabled themes with system light and dark modes. Auto follows those associations when the system mode changes; an explicitly selected theme remains selected.
- [ ] #5 Theme changes affect the interface and map background without changing authored element or group icon/color assignments.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Acceptance criteria have objective verification evidence.
- [ ] #2 Relevant checks pass and changes remain task-scoped.
- [ ] #3 Public contracts or documentation are updated when behavior changes.
- [ ] #4 Implementation Plan reflects the final approach; correction history and verification are recorded in Implementation Notes.
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Theme domain (src/themes/): definition.ts holds the Palette and ThemeDefinition shapes and the one validator; bundled.ts holds Light, Dark and Blueprint as that data; configured.ts reads the enabled themes for a project. A custom theme is a JSON file with the same shape, so bundled and custom themes take one path.
2. config.json gains a themes list of { id } for a bundled theme or { id, source } for a theme file. Without the list a project enables the three bundled themes. Each definition names the system appearance it suits (scheme), and Auto shows the first enabled theme of the current appearance.
3. Web: the enabled themes travel in the boot payload. The page writes one style block and one picker option per theme, the theme control validates and resolves against that list, and covers are drawn per enabled theme. Nothing imports a fixed theme list any more.
4. Plugin family: groma plugin add and remove accept themes, plugin list shows them, and groma plugin clone <theme> <new-id> writes a copy of a theme into the Groma directory and enables it, which is the supported way to start a custom theme.
5. Docs: project configuration, web viewer, a short theme file reference.

Tests (authority: acceptance criteria 1 to 4).
- Themes: a cloned theme with one changed palette value loads beside the bundled ones in config order; a theme file missing a palette value fails naming the field. Wrong result caught: a custom theme silently falling back to a bundled palette. Gap: no theme loading exists.
- Picker and Auto: the page lists exactly the enabled themes, and Auto resolves to the first enabled theme of each appearance. Wrong result caught: a removed theme still offered, or Auto choosing a disabled theme. Extends the existing web theme coverage.
No tests of palette values.
<!-- SECTION:PLAN:END -->
