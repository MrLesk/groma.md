---
id: TASK-561
title: Draw embedded architecture icons for every map level
status: Done
assignee:
  - '@codex'
created_date: '2026-10-07 23:16'
updated_date: '2026-10-28T22:00:00Z'
labels:
  - personalization
dependencies: []
references:
  - src/architecture-model.ts
  - src/group.ts
  - src/viewers/web/iso/painting/buildings.ts
  - src/viewers/web/organisms/details.ts
modified_files:
  - src/types.ts
  - src/architecture-model.ts
  - src/markdown-emitter.ts
  - src/authoring-conflict.ts
  - src/edit.ts
  - src/architecture-icons.ts
  - src/group.ts
  - src/sheet/measure.ts
  - src/viewers/web/organisms/icon-picker.ts
  - src/write-commands.ts
  - src/viewers/web/iso/projection/project.ts
  - src/core.ts
  - src/history/comparison.ts
  - src/viewers/web/organisms/editable.ts
  - src/viewers/web/organisms/writes.ts
  - src/sheet/types.ts
  - src/viewers/web/iso/painting/icons.ts
  - src/sheet/place.ts
  - src/sheet/compose.ts
  - src/viewers/web/iso/painting/text.ts
  - src/viewers/web/iso/painting/style.ts
  - src/viewers/web/iso/painting/ground.ts
  - src/curate.ts
  - docs/icons.md
  - src/viewers/web/organisms/details.ts
  - docs/component-markdown.md
  - src/viewers/web/render.ts
  - test-bun/iso-map.test.ts
  - test-bun/editing.test.ts
  - test-bun/architecture-icons-map.test.ts
  - test-bun/inspect-details.test.ts
  - src/viewers/web/authoring.ts
  - src/remove.ts
  - groma/systems/groma-md/components/architecture-icons.md
  - groma/systems/groma-md/components/icon-picker.md
  - groma/systems/groma-md/components/icons.md
  - groma/systems/groma-md/containers/cli/components/architecture-icons.md
  - groma/systems/groma-md/containers/cli/components/src-architecture-model.md
  - groma/systems/groma-md/containers/export/components/icon-picker.md
  - groma/systems/groma-md/containers/export/components/organisms-details.md
  - groma/systems/groma-md/containers/export/components/icons.md
  - groma/systems/groma-md/containers/export/components/map.md
type: feature
ordinal: 1
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Give Groma an original embedded SVG icon family that makes architecture easier to recognize in isometric and 2D maps. Authors choose icons for actors, external/internal systems, containers, components, and groups using the existing authoring flow. Icons follow existing UI themes and later authored accents. No downloaded icon pack or plugin setup is required. This replaces the partially failed PoC. Icons are Groma presentation metadata; C4 boundaries and ordinary OKF Markdown remain unchanged. Groups retain their narrative role.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 An original embedded SVG set covers architecture roles and responsibilities and is usable without installation. Generic icons use CSS color roles; vendor identification respects original marks and does not imply endorsement.
- [x] #2 Authors can choose and clear icons for actors, systems including external systems, containers, components, and groups from the web map and CLI; assignments survive reloads and scans.
- [x] #3 Icons read clearly in isometric and 2D views across Light, Dark, and Blueprint, without obscuring titles, selection, relationships, or hollow draft styling.
- [x] #4 Static map exports and cover images retain the same icon meaning as live maps.
- [x] #5 Storage and authoring are documented; focused behavior checks and rendered visual examples verify assignment, persistence, and each supported map view.
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
1. Extend existing model/authoring with optional icon IDs; parent-owned group appearance metadata holds a group's icon without duplicating it onto members or adding a C4 element. Record the storage contract and preserve assignments through edits/scans.
2. Draw a small original embedded SVG family and add a visual icon chooser to existing element/group editing. Render symbols with theme ink and restrained wash while preserving map geometry and draft/selection signals. Distinguish vendor marks from recolorable generic symbols.
3. Coverage gap: existing editing/group and projection tests lack authored appearance. Extend them to detect lost/incorrect assignments, wrong group ownership, and missing icons in live/static output; do not test exact artwork strings. Visually inspect a representative hand-authored fixture across three themes and iso/2D.
4. Run focused checks then bun run check; perform cold simplicity review, implementer specification/quality reviews, and full-context review. Curate task-owned architecture, commit TASK-561 only, publish the first PR against main.

Icon authoring coverage: extend the existing editing fixture to verify supported element/group assignment and clearing survives reload and a scan (user request and AC 2), rejects unknown IDs before writes, and rejects stale icon edits through the existing conflict path. Incorrect results are lost icons, wrongly scoped group appearance, stale group metadata after rename/removal, or a conflict overwriting another edit. Existing editing tests cover text/conflicts/group membership but no appearance. One focused editing flow will also inspect the resulting shared sheet for actor/system/container/component/external/group icon propagation; exact SVG art and color strings will not be asserted.

Web inspection test: the user requires group icon editing through the same map. Existing details tests cover only C4 elements and placement groups. Add one minimal narrative-group selection case that detects writing to a representation key or member instead of the canonical parent/group address, and verifies the selected group icon remains separate from its parent icon.

The group lifecycle check also deletes a drafted last member through the existing remove element flow. This is another supported way to remove the final group member; without cleanup its parent would retain an icon for a group that no longer exists. Extend the same lifecycle test rather than add a separate fixture.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Web icon editing uses the existing Edit / Save / Cancel form. The compact Icon disclosure opens categorized, labeled native radio choices from the embedded artwork, with None to clear. Narrative groups use the same pane and canonical parent/group write address. Focused inspect-details + editing tests passed (12 tests), changed UI files passed Biome, and repository typecheck passed. Browser visuals and keyboard verification are handled by the coordinating agent on the scratch preview.

Verification: 20 original SVG symbols were inspected flat and projected in Light, Dark and Blueprint. The scratch viewer-view architecture was checked in iso and 2D in all three themes; group Icon radios support arrow keys, Save persisted a Queue choice, and reloading retained it. CLI set/clear and scan persistence across all C4 kinds and groups pass in focused tests. Shared SVG output and cover checks pass; an exported Blueprint PNG was visually inspected.

Geometry coverage extends the existing roof/label tests to detect clipping or title overlap after reserving icon width and height, in iso and 2D. No exact artwork paths are asserted.

The cold simplicity review passed. Its accepted consolidation loads group elements once per public operation. Implementer specification and quality reviews passed, followed by the full-context complexity review with no blockers. Final bun run check passed with Bun 1.4.4 and Node 26.12.1: 26 Node tests and 945 Bun tests, 64 environment-dependent skips, no failures. Existing lint warnings are outside this task.

Architecture curation: embedded catalog joins Architecture model, icon picker joins Architecture details, and SVG glyph drawing joins Map painting. A second scan created zero components. Four optional native scanners were unavailable and kept saved evidence; TypeScript scanning covered every changed source file. Unrelated scanner-generated records are excluded from this PR. Vendor use is documented as an original Repository glyph plus the authored vendor name, not an adapted vendor logo.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added 20 original CSS-colored embedded SVG icons, web/CLI assignment and clearing for every supported map level and group, parent-owned group metadata, measured title spacing, and shared live/export rendering. Documented the storage and drawing contract. Focused checks, six theme/view visual passes, both external review gates and the full repository check pass.
<!-- SECTION:FINAL_SUMMARY:END -->
