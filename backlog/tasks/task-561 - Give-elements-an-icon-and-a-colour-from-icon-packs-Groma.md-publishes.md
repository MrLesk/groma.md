---
id: TASK-561
title: 'Give elements an icon and a colour, from icon packs Groma.md publishes'
status: In Progress
assignee:
  - '@codex'
created_date: '2026-10-07 23:16'
updated_date: '2026-10-09 13:18'
labels:
  - senior
dependencies: []
references:
  - src-architecture-model
  - src-authoring
  - src-cli
  - organisms-details
  - map
  - shell
  - settings-control
  - package
  - modules-settings
  - scanners-settings
  - map-sharing
  - screen
  - docs/component-markdown.md
  - docs/scanners/publishing.md
  - icon-pack-release
  - src/viewers/web/iso/painting/style.ts
  - src/viewers/web/iso/painting/text.ts
  - src/icon-packs.ts
  - src/viewers/tui/panes/details.ts
  - src/viewers/web/organisms/details.ts
  - src/edit.ts
  - src/scanner/modules/package.ts
  - src/scanner/modules/config.ts
  - src/scanner/modules/settings.ts
modified_files:
  - src/types.ts
  - src/architecture-model.ts
  - src/element-appearance.ts
  - src/markdown-emitter.ts
  - src/authoring-conflict.ts
  - src/write-commands.ts
  - src/core.ts
  - src/viewers/web/organisms/writes.ts
  - src/viewers/web/organisms/details.ts
  - docs/component-markdown.md
  - src/edit.ts
  - src/plain-world.ts
  - src/scanner/modules/config.ts
  - src/scanner/modules/package.ts
  - src/icon-packs.ts
  - src/plugin-management.ts
  - src/scanner/modules/published.ts
  - src/sheet/types.ts
  - src/sheet/place.ts
  - src/viewers/web/iso/painting/appearance.ts
  - src/viewers/web/iso/painting/text.ts
  - src/viewers/web/iso/painting/buildings.ts
  - src/viewers/web/iso/painting/ground.ts
  - src/viewers/web/chrome/colour-legend.ts
  - src/viewers/web/render.ts
  - src/viewers/tui/panes/details.ts
  - src/lint-command.ts
  - src/scanner/modules/settings-model.ts
  - src/scanner/modules/settings.ts
  - plugins/icons/architecture/icons/database.svg
  - plugins/icons/architecture/icons/queue.svg
  - plugins/icons/architecture/icons/cache.svg
  - plugins/icons/architecture/icons/browser.svg
  - plugins/icons/architecture/icons/mobile-app.svg
  - plugins/icons/architecture/icons/service.svg
  - plugins/icons/architecture/icons/scheduler.svg
  - plugins/icons/architecture/icons/file-store.svg
  - plugins/icons/architecture/icons/mail.svg
  - plugins/icons/architecture/icons/identity.svg
  - plugins/icons/architecture/icons/gateway.svg
  - plugins/icons/architecture/icons/search.svg
  - plugins/icons/architecture/package.json
  - plugins/icons/architecture/build.ts
  - package.json
  - scripts/scanner-release.ts
  - docs/icons.md
  - docs/scanners/publishing.md
  - src/viewers/web/scanners/settings.ts
  - groma/systems/groma-md/components/element-appearance.md
  - groma/systems/groma-md/components/build.md
  - groma/systems/groma-md/components/appearance.md
  - groma/systems/groma-md/components/icon-packs.md
  - groma/systems/groma-md/containers/export/components/colour-legend.md
  - groma/systems/groma-md/containers/cli/components/element-appearance.md
  - groma/systems/groma-md/containers/cli/components/src-architecture-model.md
  - groma/systems/groma-md/containers/export/components/appearance.md
  - groma/systems/groma-md/containers/export/components/map.md
  - groma/systems/groma-md/containers/export/components/shell.md
  - groma/systems/groma-md/containers/cli/components/icon-packs.md
  - groma/systems/groma-md/containers/cli/components/build.md
  - groma/systems/groma-md/containers/cli/components/icon-pack-release.md
  - bun.lock
  - src/viewers/web/metrics/control.ts
  - src/viewers/web/iso/painting/style.ts
  - test-bun/scanner-update.test.ts
  - test-bun/tui-source.test.ts
  - test-bun/iso-map.test.ts
type: feature
ordinal: 1
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
People want the map to speak their project's language: a database with a database icon, the payment components in one colour, a legend that explains the colours. Icons come from icon packs: packages that Groma.md publishes for everyone's projects, the way it publishes scanners, and that anyone else can publish too. A project installs a pack and the map draws from it. Theme palettes are a separate thing and stay untouched: an icon and an accent colour draw the same way in every theme.

Build on what exists. Elements carry groma.technology through src/architecture-model.ts, src/markdown-emitter.ts, groma edit and the web details form. Scanner packages declare themselves in their package.json under groma.scanner, are resolved from npm, a local folder or git by src/scanner/modules/package.ts, are recorded in groma/scanners.json and listed in the web settings dialog. Vendor marks are inline SVG in src/viewers/web/atoms/marks.ts. Buildings are painted in src/viewers/web/iso/painting/. Covers are rendered with resvg, which draws inline SVG but has no emoji font.

TASK-568 replaces scanners.json with one plugin file, `<groma-root>/plugins.json`, with a section per plugin kind, and adds the generic `groma plugin add|list|remove|install|update` commands. Icon packs are one of those kinds: record them in its `icons` section. If that work has not landed yet, add the `icons` section and icon support in those commands yourself, in the shape TASK-568 describes.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 An element can carry an icon name and an accent colour in its groma fields, set with groma edit <id> --icon <name> --colour <name> and in the web details form, validated like the other fields, documented in docs/component-markdown.md, and preserved by scans.
- [x] #2 An icon pack is a package whose package.json declares under groma.icons the SVG icons it ships. groma plugin add <package> installs a pack: it resolves npm, a local folder or git the way scanners are resolved and records the pack in the icons section of <groma-root>/plugins.json. groma plugin list and groma plugin remove manage it, and the web settings dialog shows the installed packs.
- [x] #3 An icon name resolves through the installed packs or is an emoji. An unknown name leaves the building without an icon and appears in groma lint as a finding, never as a failed map.
- [x] #4 The web map draws the icon and the accent colour on the building and its label the same way in light, dark and blueprint. The web details pane and the terminal details pane show them. The cover export includes the icon and the colour.
- [x] #5 A legend on the map lists the accent colours in use with a count each, and hides when no element has one.
- [ ] #6 One pack lives under plugins/icons/ with at least twelve generic architecture icons (database, queue, cache, browser, mobile app, service, scheduler, file store, mail, identity, gateway, search), built and published the same way as the scanner packages, and docs/ describes how to make and publish a pack.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Acceptance criteria have objective verification evidence.
- [x] #2 Relevant checks pass and changes remain task-scoped.
- [x] #3 Public contracts or documentation are updated when behavior changes.
- [x] #4 Implementation Plan reflects the final approach; correction history and verification are recorded in Implementation Notes.
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Keep icon and colour in the existing OKF groma fields, CLI/web authoring, scanner preservation and plugin configuration. C4 element boundaries remain unchanged; ordinary Markdown readers retain the title, prose and links.
2. Use shared SVG presentation attributes for authored rest colours. Base theme CSS defers to accented faces/text, while existing state CSS owns selection, flow, comparison and hollow drafts. Fit icon plus title inside the existing reserved surface-label band.
3. Keep an icon pack at its configured index during replacement. Reuse TASK-568 preparePluginUpdate, configuredScanners validation and configuration-based restore routing; use one appearance predicate and named package-kind choice.
4. Render full terminal appearance values as wrapped rows and adjust the action cursor by those rows. Put web element title colour inside its content span so relationship/flow headings start clean.
5. Test authority and gap: AC4 and reproduced overlap require icon/title bounds inside the reserved band; existing iso-map checks omitted icons, so extend their 2D/iso fit checks. docs/icons.md configured-order rule and the reproduced update defect require the first pack to remain first; existing scanner update coverage omitted icons, so add one local replacement/catalog test. AC4 and reproduced terminal truncation require full values at width 28; existing TUI source tests omitted appearance, so add one visible-width and action-cursor test. The new tests must fail against the original modules.
6. Rebase the local icon work onto verified TASK-568 commit 7a4455b2cda479f55713f69e481b450c24a9a224, preserve its release/update/configuration fixes, run focused and full checks, browser themes/labels/headings/covers, npm-update reproduction and tui-test. Perform one cold simplicity review, own specification/quality reviews and one full-context complexity review. Commit only this task's fixes. No publication, tags or remote push.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented icon/colour metadata, CLI and web editing, pack resolution via TASK-568 plugin machinery, embedded SVG rendering in map/covers, details, lint, colour counts, and the twelve-icon official pack plus release/documentation wiring. Cold simplicity review found missing workspace lock metadata and plugin-id collision validation; both corrected. Single-pack restore was narrowed to the selected pack. Existing live Colour by rules explicitly override authored fill only while enabled, then restore authored colours. Verification is limited to static flow/diff review and authorized groma scan; no installs, builds or tests were run as instructed.

Acceptance criteria implemented and checked by tracing the declared flow and reviewing source changes; runtime validation was explicitly excluded by the stage instruction. The authorized groma scan returned ok; groma view confirms icon-packs and icon-pack-release under the Groma application, with appearance drawing folded into map and colour counts into shell. git diff --check reports no whitespace errors. No tests were added or run. DoD check execution remains unverified.

Implementer specification and quality reviews traced every changed entry point to storage and rendering, preserving the simultaneous criticality, history and plugin changes. Final full-context complexity review found no material remaining issue. New source files stay under 500 lines. The colour counts reuse the existing legend host. No status change or commit performed. Runtime checks and publication remain unexecuted per user instruction.

Review fixes: focused 31 tests passed; changed-file TypeScript and Biome passed. Chromium verified fixed rest accents, selection/flow/comparison and hollow draft states in all three themes, separate sibling icon/title bands, and neutral relationship/flow headings. All three cover PNGs contain authored accent pixels. Full npm update reproduction kept primary before secondary. Native tui-test showed complete icon and colour at 120x36 and 200x60. Cold simplicity review passed with one accepted cleanup: remove duplicate title writes because paintElementAppearance owns its span content. Awaiting integration validation on TASK-568 local fixes.

Integrated on TASK-568 fix 7a4455b2; the replayed icon commit is c5f41b2a. Preserved work-source release staging/publication, shared preparePluginUpdate, configuredScanners duplicate validation and configuration-based restore. These last two simplify the original reviewed code without duplicate helpers. No TASK-568-only source files were added to this fix delta.
Implementer specification review: all five reported defects and four local simplification requests are addressed within existing presentation/plugin owners. Full check passed: Node 16/16; Bun 782 passed, 51 skipped, zero failures. Changed and integration-overlap files pass Biome without complexity warnings; the full repository retains one unrelated baseline lint warning. Own quality review traced CLI/configuration -> pack catalog -> shared SVG -> browser/cover, and element selection -> web/TUI details -> action cursor. Existing names and boundaries make ownership clear. All changed files remain below 500 lines. No new architecture concepts or generic plugin layer.
Regression proof: temporary copies of the original modules fail the new icon-band tests in both projections, configured-order test and terminal visible-width test; fixed focused tests pass. The width test asserts separate complete appearance rows and a real outline cursor, so it observes the reported clipped-output defect. A second full check runs after the final assertion change.
Two local scans created zero records and left groma/ clean; missing optional C#/Go/Java/Rust worker binaries retained saved evidence. Actual npm publication is excluded by this fix request and remains unverified.

Final exact-content check passed: Node 16/16; Bun 782 passed, 51 skipped, 0 failed (833 tests). Full-context complexity review passed with no material findings or additional abstraction/deletion needed. Final diff check passed. The icon package built all twelve declared SVG assets. All reported PR #118 fixes are verified; no authority-backed code blocker remains. TASK-561 remains In Progress with AC6 and DoD1 unchecked only because actual public icon-pack publication is excluded and has not been verified. No npm publication, tag or remote push was performed.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Fixed authored-colour interference with interaction/lifecycle states, fitted surface icons and titles inside their own label bands, kept icon-pack resolution priority during update, showed complete terminal icon/colour values, and scoped web title colour to element content. Simplified appearance checks and package-kind selection; retained the verified TASK-568 configuration/update/restore helpers during local stack integration. New regressions detect the original defects. Chromium themes, labels, headings and cover PNGs; full npm update reproduction; native tui-test; TypeScript, Biome and full repository checks passed. Both review gates passed. Local stack base: 7a4455b2; rebased icon feature: c5f41b2a. No caused groma changes. Actual public publication remains excluded and unchecked.
<!-- SECTION:FINAL_SUMMARY:END -->
