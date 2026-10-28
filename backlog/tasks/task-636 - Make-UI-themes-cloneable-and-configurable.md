---
id: TASK-636
title: Make UI themes cloneable and configurable
status: To Do
assignee: []
created_date: '2026-10-28T20:33:00Z'
labels:
  - personalization
milestone: m-6
dependencies: []
references:
  - src/config.ts
  - src/viewers/web/atoms/theme.ts
  - src/viewers/web/chrome/theme-control.ts
  - src/viewers/web/chrome/shell.ts
documentation:
  - ROADMAP.md
  - docs/config.md
  - docs/viewers/web/index.md
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
