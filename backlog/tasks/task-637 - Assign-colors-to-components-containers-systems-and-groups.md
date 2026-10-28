---
id: TASK-637
title: 'Assign colors to components, containers, systems, and groups'
status: Done
assignee:
  - '@codex'
created_date: '2026-10-28T20:33:00Z'
updated_date: '2026-10-29T19:37:00Z'
labels:
  - personalization
milestone: m-6
dependencies:
  - TASK-561
references:
  - src/architecture-model.ts
  - src/edit.ts
  - src/group.ts
  - src/markdown-emitter.ts
  - src/viewers/web/iso/painting/style.ts
  - src/viewers/web/iso/painting/buildings.ts
  - src/viewers/web/organisms/details.ts
documentation:
  - ROADMAP.md
  - docs/component-markdown.md
  - docs/product-model.md
modified_files:
  - backlog/milestones/m-6 - the-personalization-update.md
  - src/types.ts
  - src/markdown-emitter.ts
  - src/authoring-conflict.ts
  - src/edit.ts
  - src/write-commands.ts
  - src/core.ts
  - src/history/comparison.ts
  - src/architecture-color.ts
  - src/architecture-model.ts
  - src/group.ts
  - src/viewers/web/organisms/color-picker.ts
  - src/viewers/web/organisms/editable.ts
  - src/curate.ts
  - src/sheet/types.ts
  - src/sheet/place.ts
  - src/viewers/web/organisms/details.ts
  - src/viewers/web/organisms/writes.ts
  - docs/component-markdown.md
  - test-bun/editing.test.ts
  - test-bun/inspect-details.test.ts
  - docs/colors.md
  - src/viewers/web/iso/painting/appearance.ts
  - src/viewers/web/iso/painting/buildings.ts
  - src/viewers/web/iso/painting/ground.ts
  - src/viewers/web/iso/painting/style.ts
  - src/viewers/web/iso/painting/map.ts
  - src/viewers/web/sharing/cover.ts
  - test-bun/architecture-icons-map.test.ts
  - test-bun/architecture-color-paint.test.ts
  - groma/systems/groma-md/components/architecture-color.md
  - groma/systems/groma-md/components/color-picker.md
  - groma/systems/groma-md/components/appearance.md
  - groma/systems/groma-md/containers/cli/components/architecture-color.md
  - groma/systems/groma-md/containers/cli/components/src-architecture-model.md
  - groma/systems/groma-md/containers/export/components/color-picker.md
  - groma/systems/groma-md/containers/export/components/organisms-details.md
  - groma/systems/groma-md/containers/export/components/appearance.md
  - groma/systems/groma-md/containers/export/components/map.md
type: feature
ordinal: 701000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Let architecture authors assign an independent accent color to actors, internal/external systems, containers, components, and narrative groups. This is authored map appearance, separate from UI themes and computed status signals. It builds on TASK-561 original embedded icons: the accent can color an icon, and either assignment can be changed or cleared without changing the other.

Store one optional hex color under groma.color or the existing parent-owned groupAppearance entry. Ordinary Markdown titles, body and links keep their meaning. C4 levels and group membership do not change. The supported example gives a group its own tint and icon accent while members retain their own appearance; no color inheritance is introduced.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Authors can assign, change, and clear colors for actors, internal/external systems, containers, components, and groups through web Edit and the CLI.
- [x] #2 The map shows a restrained tint and readable icon accent on the owning item or group in iso and 2D across Light, Dark and Blueprint; members do not inherit parent/group colors.
- [x] #3 Assignments survive reloads and scans and remain unchanged when switching UI themes.
- [x] #4 Icons and colors are independent assignments; changing or clearing either preserves the other.
- [x] #5 Selection, flow, comparison, task, facade and hollow draft signals retain their meaning; static maps and covers retain authored appearance.
- [x] #6 The storage and authoring contracts are documented and focused behavior checks plus actual rendered examples verify the supported flow.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Acceptance criteria have objective verification evidence.
- [x] #2 Relevant checks pass and changes remain task-scoped.
- [x] #3 Public contracts or documentation are updated when behavior changes.
- [x] #4 Implementation Plan reflects the final approach; correction history and verification are recorded in Implementation Notes.
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Extend existing appearance storage and authoring with an optional #RRGGBB color, independent from icon. Web and CLI set/change/clear use existing validation, conflict handling, group lifecycle and scan persistence.
2. Add a compact Color control to the existing edit form: Automatic clears, eight named muted swatches, and Custom hex/color input. Keep Save/Cancel as the write boundary.
3. Keep titles in theme ink. Tint the owning surface lightly and color its outline and original SVG icon, adapting accent contrast for Light/Dark/Blueprint. Preserve roof/side shading, group hatching, neutral facade/pattern signals, hollow drafts, and priority of selection/flow/diff/task states. No parent/member inheritance. Live map and explicit-color SVG exports use the same color calculation.
4. Tests extend existing authoring and group cases for independent icon/color updates, stale writes and persistence; a focused color rendering test detects leakage into nested owners, lost group hatch or hollow drafts, wrong state priority and mismatched cover output. Check readable icon contrast for supported themes/custom light or dark colors; do not test exact palette/artwork strings. Existing tests have no authored color path.
5. Inspect the hand-authored architecture with actors, external systems, every C4 level and a group in iso and 2D across all themes, including edit/save/clear. Run focused checks and bun run check; cold simplicity, implementer specification/quality and full-context complexity reviews. Curate source ownership and publish a second PR based on codex/personalization-icons.

Web inspection coverage: extend the existing narrative-group inspection case to verify that its own color is offered for editing, clearing it leaves its icon, and the parent color is not inherited. This detects sending or showing the parent color for a group, which AC2 and AC4 forbid; existing inspection coverage currently covers only group icons. Native input validation and Save/Cancel use the existing form and will be checked in the rendered browser flow.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
The web Color control is part of the existing Edit form: Automatic clears, eight named muted swatches set a color, and a native color picker plus validated hex input choose a custom color. The hex field is the sole submitted value; all changes wait for Save, and Cancel remains local. Element/group inspection exposes color independently of icon and parent appearance. docs/colors.md documents authoring, storage, no inheritance, and UI theme separation. Typecheck, scoped Biome, and the 12 inspect-details/editing tests passed. The coordinating agent owns rendered browser validation.

Verification: web preset and custom-hex Save, Cancel, invalid-hex validation, Automatic clearing, and group color Save were exercised on a hand-authored architecture. Clearing the system color retained its icon. The group used its own Rose tint inside a Blue container while the uncolored Pricing member kept neutral theme ink. The group wash remained visible when its hatch hid at overview scale, and the hatch returned on zoom. Selection changed a colored component icon, title and outline to the existing highlight. Draft component and container surfaces stayed hollow. White-on-Light and black-on-Blueprint choices adapted to visible icon accents.

The same example was inspected in iso and 2D across Light, Dark and Blueprint. Light and Blueprint exported PNG covers were inspected; the shared explicit-paint path retained colors and hollow drafts. Documentation clarifies that covers are isometric while live/static maps support both views.

Focused authoring, group, renderer and contrast checks pass. Full bun run check passed on Bun 1.4.4 and Node 26.12.1: 26 Node tests and 946 Bun tests, 64 optional environment-dependent skips, zero failures. Existing lint warnings are outside this task. Cold simplicity, implementer specification/quality and full-context complexity reviews passed with no material findings.

Source ownership: color validation joins Architecture model, color picker joins Architecture details, and the shared appearance calculation joins Map painting. A second scan created zero components. Optional C#/Go/Java/Rust workers were unavailable and kept saved evidence; TypeScript covered this task. Unrelated generated scanner records are excluded. TASK-637 and the existing Personalization milestone were brought from the local planning branch with their existing IDs; this PR is stacked on TASK-561 / PR #194.

Restacked on the approved front-facing SVG artwork in TASK-561. The icon outline, fill and subtle shade all use the owning item accent; the map applies its projection once. Verified the combined result in iso and 2D across Light, Dark and Blueprint, with no browser console errors. Full bun run check passes again on Bun 1.4.4 and Node 26.12.1: 26 Node tests, 946 Bun tests, 64 optional environment-dependent skips, zero failures. The focused revision preserves the existing color rules; implementer specification and quality review found no blocking issue.

Restacked on the Icon library addition in TASK-561. Resolved the generated Architecture details ownership conflict through groma scan/edit, preserving both icon-catalog and color-picker; a follow-up scan created zero components. The color implementation is unchanged. Browser verification on the combined branch: searched Server in the Edit picker, selected it with Tab/ArrowRight, saved and reloaded; the container kept its Blue accent and new Server icon. The Info library opens with the same drawings and theme. Review of the restacked diff found only the expected ownership context change.

The combined stack passes bun run check after the library addition: 26 Node tests, 947 Bun tests, 64 optional environment-dependent skips, zero failures on Bun 1.4.4 / Node 26.12.1.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added independent item and group accent colors through web Edit and --color, with Automatic, eight muted swatches and custom hex input. Theme-aware tints and readable icon accents preserve map state, neutral text, group membership and hollow drafts. Live/static maps and covers share color calculation. Full check, actual visual flows and both review gates pass.
<!-- SECTION:FINAL_SUMMARY:END -->
