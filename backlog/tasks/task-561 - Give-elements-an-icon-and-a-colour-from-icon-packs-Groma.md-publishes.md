---
id: TASK-561
title: 'Give elements an icon and a colour, from icon packs Groma.md publishes'
status: Done
assignee:
  - '@codex'
created_date: '2026-10-07 23:16'
updated_date: '2026-10-09 08:04'
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
- [x] #6 One pack lives under plugins/icons/ with at least twelve generic architecture icons (database, queue, cache, browser, mobile app, service, scheduler, file store, mail, identity, gateway, search), built and published the same way as the scanner packages, and docs/ describes how to make and publish a pack.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Acceptance criteria have objective verification evidence.
- [ ] #2 Relevant checks pass and changes remain task-scoped.
- [x] #3 Public contracts or documentation are updated when behavior changes.
- [x] #4 Implementation Plan reflects the final approach; correction history and verification are recorded in Implementation Notes.
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Extend element presentation metadata and existing edit/annotation paths with icon and colour; preserve them through scans and structural edits. 2. Integrate icon packs into the shared plugin configuration, source resolver, commands and settings. 3. Resolve icons to portable SVG, render fixed accents and icons in the shared map/cover drawing and details, and list colour counts on the map. 4. Add the official twelve-icon pack and release/documentation support. 5. Inspect the full diff and supported entry-to-result paths, record verification limits (no installs/builds/tests authorized), then scan and curate new source files. Icon/colour are Groma presentation fields under the existing OKF concept and do not introduce C4 elements or relationships. Ordinary readers retain titles, prose and source links; Groma owns visual interpretation.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented icon/colour metadata, CLI and web editing, pack resolution via TASK-568 plugin machinery, embedded SVG rendering in map/covers, details, lint, colour counts, and the twelve-icon official pack plus release/documentation wiring. Cold simplicity review found missing workspace lock metadata and plugin-id collision validation; both corrected. Single-pack restore was narrowed to the selected pack. Existing live Colour by rules explicitly override authored fill only while enabled, then restore authored colours. Verification is limited to static flow/diff review and authorized groma scan; no installs, builds or tests were run as instructed.

Acceptance criteria implemented and checked by tracing the declared flow and reviewing source changes; runtime validation was explicitly excluded by the stage instruction. The authorized groma scan returned ok; groma view confirms icon-packs and icon-pack-release under the Groma application, with appearance drawing folded into map and colour counts into shell. git diff --check reports no whitespace errors. No tests were added or run. DoD check execution remains unverified.

Implementer specification and quality reviews traced every changed entry point to storage and rendering, preserving the simultaneous criticality, history and plugin changes. Final full-context complexity review found no material remaining issue. New source files stay under 500 lines. The colour counts reuse the existing legend host. No status change or commit performed. Runtime checks and publication remain unexecuted per user instruction.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Implemented icon and fixed accent metadata, CLI/web edits, icon packs through plugins.json and shared source resolution, plugin settings and lifecycle commands, unknown-icon lint, shared map/cover SVG rendering, web/terminal details, and an authored-colour count legend. Added the twelve-icon official pack, workspace lock entries, release staging/publication and docs/icons.md. Ran groma scan and curated source ownership; static reviews passed. No installs, builds or tests were run, so runtime and frozen-lockfile validation remain unverified. No commit or status change.
<!-- SECTION:FINAL_SUMMARY:END -->
