---
id: TASK-561
title: 'Give elements an icon and a colour, from icon packs Groma.md publishes'
status: To Do
assignee: []
created_date: '2026-10-07 23:16'
updated_date: '2026-10-08 15:22'
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
- [ ] #1 An element can carry an icon name and an accent colour in its groma fields, set with groma edit <id> --icon <name> --colour <name> and in the web details form, validated like the other fields, documented in docs/component-markdown.md, and preserved by scans.
- [ ] #2 An icon pack is a package whose package.json declares under groma.icons the SVG icons it ships. groma plugin add <package> installs a pack: it resolves npm, a local folder or git the way scanners are resolved and records the pack in the icons section of <groma-root>/plugins.json. groma plugin list and groma plugin remove manage it, and the web settings dialog shows the installed packs.
- [ ] #3 An icon name resolves through the installed packs or is an emoji. An unknown name leaves the building without an icon and appears in groma lint as a finding, never as a failed map.
- [ ] #4 The web map draws the icon and the accent colour on the building and its label the same way in light, dark and blueprint. The web details pane and the terminal details pane show them. The cover export includes the icon and the colour.
- [ ] #5 A legend on the map lists the accent colours in use with a count each, and hides when no element has one.
- [ ] #6 One pack lives under plugins/icons/ with at least twelve generic architecture icons (database, queue, cache, browser, mobile app, service, scheduler, file store, mail, identity, gateway, search), built and published the same way as the scanner packages, and docs/ describes how to make and publish a pack.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Acceptance criteria have objective verification evidence.
- [ ] #2 Relevant checks pass and changes remain task-scoped.
- [ ] #3 Public contracts or documentation are updated when behavior changes.
- [ ] #4 Implementation Plan reflects the final approach; correction history and verification are recorded in Implementation Notes.
<!-- DOD:END -->
