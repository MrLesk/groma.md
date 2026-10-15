---
id: TASK-561
title: Give elements an icon and an accent colour
status: In Progress
assignee:
  - '@claude'
created_date: '2026-10-07 23:16'
updated_date: '2026-10-15 19:30'
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
  - src/viewers/web/iso/painting/style.ts
  - src/viewers/web/iso/painting/text.ts
  - src/icon-packs.ts
  - src/viewers/tui/panes/details.ts
  - src/viewers/web/organisms/details.ts
  - src/edit.ts
  - src/scanner/modules/package.ts
  - src/scanner/modules/config.ts
  - src/scanner/modules/settings.ts
  - icon-packs
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
  - groma/systems/groma-md/containers/cli/components/src-architecture-model.md
  - groma/systems/groma-md/containers/export/components/map.md
  - groma/systems/groma-md/containers/export/components/shell.md
  - groma/systems/groma-md/containers/cli/components/icon-packs.md
  - bun.lock
  - src/viewers/web/iso/painting/style.ts
  - test-bun/scanner-update.test.ts
  - test-bun/tui-source.test.ts
  - test-bun/iso-map.test.ts
  - src/viewers/web/sharing/cover.ts
  - test-bun/web-stats.test.ts
  - src/viewers/web/page.ts
  - src/curate.ts
  - test-bun/system-curation.test.ts
  - src/history/comparison.ts
  - src/viewers/web/comparison/details.ts
  - test-bun/revision-comparison.test.ts
  - docs/agent-instructions/structure.md
  - test-bun/web-sharing.test.ts
  - docs/scanners/setup.md
  - src/scanner/modules/official-catalog.ts
  - src/viewers/web/iso/painting/scale.ts
  - docs/agent-instructions/describe.md
  - docs/agent-instructions/inspect.md
  - docs/architecture-findings.md
  - groma/systems/groma-md/containers/cli/components/modules-settings.md
  - groma/systems/groma-md/containers/cli/components/package.md
  - groma/systems/groma-md/containers/cli/components/src-lint-command.md
  - scripts/reproduce-scanner-boundaries.ts
  - src/instructions.ts
  - src/plugin-cli.ts
  - src/sheet/measure.ts
  - src/viewers/web/iso/projection/project.ts
  - test-bun/compiled-scanner.test.ts
  - test-bun/icon-packs.test.ts
  - test-bun/lint-command.test.ts
  - test-bun/scanner-compatibility.test.ts
  - test-bun/scanner-exclusions.test.ts
  - test-bun/scanner-installation.test.ts
  - test-bun/scanner-release.test.ts
  - test-bun/scanner-restore.test.ts
  - test-bun/scanner-settings-lifecycle.test.ts
  - test-bun/source-coverage.test.ts
  - test-bun/viewer-scanner-availability.test.ts
  - test-bun/web-startup.test.ts
  - test-bun/work-source-selection.test.ts
  - plugins/icons/architecture/icons/LICENSE
  - plugins/icons/architecture/icons/server.svg
  - plugins/icons/architecture/icons/vm.svg
  - plugins/icons/architecture/icons/function.svg
  - plugins/icons/architecture/icons/container.svg
  - plugins/icons/architecture/icons/package.svg
  - plugins/icons/architecture/icons/block-storage.svg
  - plugins/icons/architecture/icons/document.svg
  - plugins/icons/architecture/icons/load-balancer.svg
  - plugins/icons/architecture/icons/router.svg
  - plugins/icons/architecture/icons/switch.svg
  - plugins/icons/architecture/icons/dns.svg
  - plugins/icons/architecture/icons/firewall.svg
  - plugins/icons/architecture/icons/lock.svg
  - plugins/icons/architecture/icons/cloud.svg
  - plugins/icons/architecture/icons/user.svg
  - plugins/icons/architecture/icons/desktop.svg
  - plugins/icons/architecture/icons/laptop.svg
  - plugins/icons/architecture/icons/mobile.svg
  - plugins/icons/architecture/icons/image.svg
type: feature
ordinal: 1
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
People want the map to speak their project's language: a database with a database icon, the payment components in one colour, a legend that explains the colours. Theme palettes are a separate thing and stay untouched: an icon and an accent colour draw the same way in every theme.

Icons come from icon packs, listed in the `icons` section of `<groma-root>/config.json` and handled by the same flow as scanners and Backlog.md (TASK-568): the same restore component, the plugins screen, `groma plugin add|update|install|list|remove`, and the `groma web` restore view when a listed pack is missing.

- The default pack, `architecture`, ships inside groma.md. config.json lists it by id alone, so people see which pack they use; it is never published or downloaded.
- `groma init` recommends the default pack, preselected, the same way it recommends Backlog.md.
- A project can remove the default pack and add another by its exact source (`package@version`, `git+https://…#tag-or-commit` or a local `./path`). Such a pack is a package whose package.json declares its SVG icons under `groma.icons`, and a colleague who pulls restores it like a scanner.

Build on what exists. Elements carry groma.technology through src/architecture-model.ts, src/markdown-emitter.ts, groma edit and the web details form. Buildings are painted in src/viewers/web/iso/painting/. Covers are rendered with resvg, which draws inline SVG but has no emoji font.

Product decisions by Alex on 2026-10-13 and 2026-10-14: the default pack is bundled with groma.md and listed in config.json so it can be seen and swapped, recommended in the init wizard like Backlog.md, one flow and one restore component for scanners, Backlog.md and icons. Still open for Alex: accent colours on a map that otherwise uses one green, the heading contrast in the details pane, and whether an unknown icon name makes groma lint fail.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 An element can carry an icon name and an accent colour in its groma fields, set with groma edit <id> --icon <name> --colour <name> and in the web details form, validated like the other fields, documented in docs/component-markdown.md, and preserved by scans.
- [ ] #2 The `architecture` pack with 24 generic isometric icons (server, vm, function, container, package, block storage, database, cache, queue, document, scheduler, mail, load balancer, router, switch, dns, firewall, lock, cloud, user, desktop, laptop, mobile, image), MIT artwork recoloured so CSS can set its faces and lines, ships inside groma.md and is not published. The `icons` section of config.json lists the packs a project uses: the bundled pack by id alone, another pack by its exact source. `groma init` recommends the bundled pack, preselected; another pack is added, updated, listed, removed and restored through the TASK-568 plugin flow. docs/ list the bundled icons and describe how to make a pack.
- [ ] #3 An icon name resolves through the listed packs or is an emoji. An unknown name leaves the building without an icon and appears in groma lint as a finding, never as a failed map.
- [ ] #4 The web map draws the icon and the accent colour on the building and its label the same way in light, dark and blueprint. The web details pane and the terminal details pane show them. The cover export includes the icon and the colour.
- [ ] #5 A legend on the map lists the accent colours in use with a count each, and hides when no element has one.
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
To be rewritten when this branch is rebuilt on the reworked TASK-568.
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

Review remediation, findings A to F of the PR 118 review.
A. Removed the Twemoji download (emojiSvg) from src/icon-packs.ts; loading the architecture no longer touches the network. The loader now sets resolvedIcon on each element: a pack's SVG as a data URI, or the emoji itself; an unknown name stays unresolved. The map draws an emoji as SVG text centred in the icon's square (iconNode in iso/painting/appearance.ts); the web details meta line and the terminal already show it as text. Measured the cover renderer: resvg with only the bundled DejaVu fonts draws an empty box for an emoji, so covers hide emoji icons (one rule in sharing/cover.ts) and docs/icons.md says covers show pack icons only.
B. The colour legend is a static element of the page, painted from paintWorld, styled by colourLegendCss through page.ts. It counts by the resolved colour (colourCounts); accentColour returns lower-case hex and the gray alias is gone.
C. requireCombinableSources refuses a source with an authored icon or colour; the agent guide lists both.
D. ownContent includes icon and colour; the reasons list names them and the What tab shows the changed values, so the reason link leads to something.
E. iconPackInventory reports error.message; the details title uses a stylesheet (elementTitleCss) and a custom property instead of inline styles, and paintElementTitle is named for what it paints; imports follow each file's grouping; the release script builds the icon pack apart from scannerBuilders under a named iconPackDirectory. The icon pack manifest gained the repository field every other published package gets at staging: the release publishes with npm provenance, which checks it. Publication itself was not run.
F. docs/icons.md and the Element appearance section follow the code; architecture records icon-packs and map updated through groma edit.
Checks: bun run typecheck passed. bunx biome lint: 1 warning and 2 infos, the same three as before the change, none in a changed file. bun scripts/lint-web-scrollbars.ts passed. Focused bun tests passed: 113 tests in 19 files (web-stats, revision-comparison, system-curation, scanner-update, iso-map, inspect-details, web-page-inset, tui-source, detach, rename, editing, web-export, web-sharing, web-shell, chrome, plain-view, sheet-scene, lint-command, scanner-release). The legend, combine and comparison tests failed before their fixes. groma lint on a scratch project reported only the unknown icon name. Headless Chromium on an exported scratch project showed the legend rows, the details title with its pack icon and colour, and emoji drawn as text beside container, system and building titles in the light theme. The full bun run check was not run in this lane.

Finding G (found while rendering covers for A, not in the review list). Reproduced: with the branch as it was before this pass, the cover of test/fixtures/viewer-view, which has no icon and no colour, had every island, slab and building filled black (28020 pure black pixels in each theme of a three-box cover). Cause: the earlier fix pass wrote the rest colours as :not(.accented) rules, and resvg drops a selector that uses :not() or :is() together with every selector listed after it. Fix: withAccent in iso/painting/appearance.ts puts the accent on the element's group as two inherited values (color for the accent, fill for its tint) and the class accented; two plain rules in mapDrawingCss, placed after the rest colours and before the draft rule, hand them to the element's own faces, ground and title. The rest rules are plain again, as they were before the icon work, and the recursive rewrite of child nodes is gone. Selection, flow, comparison and draft rules keep winning by order and specificity. Checked: the new cover test fails on the earlier branch state and passes now; covers of a scratch project in light, dark and blueprint show rest tints, accents, pack icons and no emoji boxes; headless Chromium in light, dark and blueprint shows rest colours, accented surfaces and titles, a selected and a context accented surface with the highlight stroke and title, and accented drafts hollow and dashed in their accent. Not exercised in a browser: flow, hover and comparison states over an accent; their rules are later in the stylesheet or more specific than the two accent rules. Checks after G: bun run typecheck passed; bunx biome lint unchanged (1 warning, 2 infos, none in a changed file); 105 focused bun tests in 17 files passed (web-sharing, iso-map, unidentified-container, web-map-pointer, web-export, web-stats, revision-comparison, system-curation, scanner-update, inspect-details, web-page-inset, tui-source, web-map-presentation, web-map-highlights, web-layer-mode, sheet-scene, web-camera-layer).

After G: reworded the icon paragraph of docs/icons.md so it says only what the code does (a resolved pack icon travels with the map; the web pane also draws it beside the title). node --import=tsx --test test/*.test.ts passed, 16 of 16.

Restack and finding X. Merged the plugins.json branch (remediate/117 at 7d1c74d8) into this branch (merge commit 51976c1c): its version was kept wherever this branch only had older TASK-568 code, and the icon-pack code was moved to its names (readPluginConfig, resolvePluginPackage, PluginInstallOptions and so on). package.json and bun.lock did not change in the merge, so no install was needed. Because the branch's unions give each kind its own fields, the merge already gave the icon pack its own member of the resolved-package union and of PluginSetting (IconPackSetting, no technologies, matches or match).
X: plugins.json icons entries are ConfiguredIconPack; one entry parser (selections) serves the workSources and icons sections with the same messages as before; requireUniqueIds covers scanners, work sources and icon packs, and the parser's own duplicate check for icon ids is gone. ResolvedIconPackage has no entry and no include: entry moved from the shared fields to the scanner and work-source packages. The id, name and version checks run once for every kind (packageIdentity) and the unsupported-field check covers groma.icons too. The file resolver takes a label, so a wrong icon path is reported as an icon and not as an entry; with the same label for entries, one message of TASK-568 changed by one word (plugin package entry must be a file became plugin package.json entry must be a file). saveIconPack with its replacing flag became addIconPack and replaceIconPackSource; the replace path lost the id checks that requireUniqueIds makes unreachable. Official is decided by officialIconPackIds from the embedded pack manifest. docs/scanners/setup.md names the icons section and docs/icons.md says a pack declares no entry and cannot reuse an id.
Checks: bun run typecheck passed; bunx biome lint unchanged (1 warning, 2 infos, none in a changed file); 63 bun tests in 16 plugin and scanner-settings files passed; the new unique-id test failed before the config change. On a scratch project: plugin list shows the pack, adding it again is refused, a pack with a path that is not ./relative or with an unsupported field is refused with an icon-worded message.

Accent tint decision. An accented surface is now its accent mixed into the theme's own paper, 22 percent in every theme (ACCENT_TINT in iso/painting/scale.ts), instead of a fixed mix with white; accentTint is gone from src/element-appearance.ts. The element's group carries only the accent, as the color attribute (withAccent). accentRules in iso/painting/style.ts owns the colours for both renderers: stroke and title take currentColor; the browser fill is color-mix(in srgb, currentColor 22%, var(--paper)), so it follows the live theme; a cover gets one explicit fill rule per accent of its scene (sceneAccents), computed with mixColour from the palette. Measured first: resvg paints a rule that uses color-mix or var black, and it reads the [color=...] attribute selector, child and descendant combinators and currentColor. The accent travels as the color attribute rather than as a custom property, because resvg reads the first and not the second, so one carrier serves the browser and covers. The stored field, the colour names, the accent stroke and the title colour are unchanged; in the light theme, where paper is white, surfaces look as before.
Checks: bun run typecheck passed; bunx biome lint unchanged (1 warning, 2 infos, none in a changed file); bun scripts/lint-web-scrollbars.ts passed; bun test --parallel=2 --max-concurrency 1 --timeout 20000 on 37 focused files passed, 183 tests; node tests 16 of 16. The cover test, extended to the dark cover, failed before the change. Headless Chromium on an exported scratch project in light, dark and blueprint: titles of unaccented children on an accented system surface are readable in all three; a selected accented container and its context system take the highlight outline and title; accented drafts stay hollow and dashed in their accent; with a flow active, the accented components on the path take the highlight and the others dim; in a comparison of two commits, modified accented components take the change colour for fill, outline and title. Covers in the three themes match the browser, show pack icons and hide emoji. Hover over an accent was not exercised (no pointer in the headless run); its rule is more specific than the accent rules.

Final round. Merged the finished plugins.json branch (remediate/117 at 550b2fdd, merge commit 6b4f35d7). Icon packs are now a third kind inside its generic functions: selections, withAdded, removePlugin and updatePlugin in src/plugin-management.ts each gained the icons section, restore and install reach packs through restorePluginPackage, and groma plugin list prints them. addIconPack, replaceIconPackSource, restoreIconPacks, the inline removal and every hand-written id check for icons are gone; writePluginConfig validates through the parser, where requireUniqueIds covers the three sections. PluginConfig.icons is a required array written in the fixed key order, so every config literal in tests and in scripts/reproduce-scanner-boundaries.ts names it. src/icon-packs.ts keeps the pack inventory, the catalog, resolveIcon (the one place that decides pack name or emoji, used by the loader and by lint) and unknownIcons; isEmoji and loadIconCatalog are private and a pack's files are validated only in package.ts.
Accent titles: an accented title is the accent mixed 45 percent toward the theme's ink (ACCENT_TITLE), through color-mix with var(--ink) in the browser and mixColour in covers. Measured contrast of the title on its own surface, light / dark / blueprint: red 5.85 6.00 6.12, orange 5.02 6.72 6.88, amber 5.01 6.73 6.86, yellow 4.68 6.93 7.15, green 5.41 6.40 6.47, teal 5.57 6.35 6.36, cyan 5.51 6.30 6.40, blue 5.73 6.26 6.34, indigo 6.14 6.04 6.13, violet 5.87 6.24 6.28, purple 6.10 6.02 6.14, pink 5.74 6.18 6.27, brown 5.89 6.30 6.42, grey 5.56 6.44 6.57. The smallest share that reaches 4.5 everywhere is 0.43; 0.45 leaves a margin. Strokes keep the plain accent.
Cold review: Building.lines is the title again and the icon row is reserved in roofBlock and footprintOf; the icon reserve is one constant, ICON_ADVANCE, from which the name cells are derived; the label fit test runs with and without an icon; renderArchitectureDocument lost its unused icon and colour parameters; isAccentColour is inlined; the edit error names --icon and --colour; lint and edit descriptions name the new rule and flags; the comparison test checks each field alone; the three icon-pack tests moved to test-bun/icon-packs.test.ts and the id test of TASK-568 was extended instead of repeated; every settings row that is not a scanner is summarised as Plugin details; packageIdentity runs once. In a cover a hidden emoji still keeps its room (the line above a building's name, the icon's width before a surface name); cover.ts and docs/icons.md say so. No component owns releasing packages, because release scripts are excluded from scans, so the stand-alone icon-pack-release component was folded into icon-packs with groma edit --combine after its overview was cleared; the package, icon-packs and src-lint-command records were updated with groma edit.
Checks: bun run typecheck passed; bunx biome lint 1 warning and 2 infos, the same as before the task's remediation, none in a changed file; bun scripts/lint-web-scrollbars.ts passed; bun test --parallel=2 --max-concurrency 1 --timeout 20000 on 47 focused files, 236 passed; node tests 16 of 16. The contrast test fails with a share of 0. tui-test on a scratch project at 120x36 and 200x60: cards with a pack icon or an emoji have no empty row, the details pane shows Icon and Colour rows, and the Plugins screen lists the pack under Icon packs with remove and update. Headless Chromium in light, dark and blueprint on an exported scratch project: surfaces, lighter or darker titles, selection, hollow dashed drafts, flow and comparison; the three covers match. Not run: the full bun run check, groma scan (no source file was added, moved, renamed or deleted), the web settings dialog in a browser, hover, and any publication.

Orchestrator verification, 11 October 2026, stacked on the finished plugins.json branch with main merged: bun run check exit 0 (16 Node tests; 798 Bun tests passed, 52 skipped for missing optional toolchains, 0 failed). I inspected the implementer's dark-theme screenshots of accented systems, containers, components and drafts. Decisions taken in this pass, for the owner to confirm or reverse: an emoji icon is drawn as text and nothing is downloaded when the architecture loads, so cover images show pack icons only; an accented surface is the accent mixed into the theme's paper and its title the accent mixed toward the theme's ink, so every named accent reaches a contrast of 4.5 in light, dark and blueprint. The task stays In Progress on purpose: acceptance criterion 6 and Definition of Done 1 need @groma/icons-architecture on the public registry, which happens in the next release.

Redesigned on 2026-10-14 with Alex: the default pack is bundled and listed in config.json, recommended in groma init, and goes through the TASK-568 plugin flow; publishing the pack is dropped. The implementation above is the starting point for the rebuild.

Alex, 2026-10-14: a downloaded plugin's kind comes from the plugin itself: groma plugin add reads the package manifest and figures out the type, with no kind flag on the command. The bundled default pack, like Backlog.md, cannot be turned off during setup and sits in the setup step's top section; removing or swapping it later from the plugins screen stays possible.

Default pack artwork, 2026-10-15: the twelve hand-drawn line icons are replaced by 24 MIT isometric architecture icons (copyright notice in plugins/icons/architecture/icons/LICENSE), recoloured so every shape carries a role class (gi-t top face, gi-s side face, gi-d shaded face, gi-l line fill, gi-k line stroke). Each file has its own style with grey defaults, so the current map, which draws a pack icon as an image, and resvg covers show it without black fills. 2D versions and the map placement on every C4 level are still to be designed and built.
<!-- SECTION:NOTES:END -->
