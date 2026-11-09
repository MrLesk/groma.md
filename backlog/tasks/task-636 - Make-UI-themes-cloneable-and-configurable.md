---
id: TASK-636
title: Make UI themes cloneable and configurable
status: Done
assignee:
  - '@claude'
created_date: '2026-10-28T20:33:00Z'
updated_date: '2026-11-09T23:04:00Z'
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
  - test-bun/web-page-inset.test.ts
  - test-bun/themes.test.ts
  - docs/config.md
  - docs/viewers/web/index.md
  - groma/systems/groma-md/containers/cli/components/themes.md
  - groma/systems/groma-md/containers/export/components/map-sharing.md
  - test-bun/web-theme.test.ts
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
- [x] #1 Light, Dark, and Blueprint are bundled UI theme plugins using the same definition and loading path as a custom theme.
- [x] #2 A user can clone any bundled theme, change its UI palette, register the clone in config.json, and select it without editing Groma's source.
- [x] #3 The picker lists exactly the enabled themes in config.json. Removing a bundled theme from that configuration keeps it out of the picker after reload.
- [x] #4 Configuration associates enabled themes with system light and dark modes. Auto follows those associations when the system mode changes; an explicitly selected theme remains selected.
- [x] #5 Theme changes affect the interface and map background without changing authored element or group icon/color assignments.
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

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Decisions: a theme is data with one shape (id, title, scheme, chromeOpacity, palette with the named colors), checked by one validator that the bundled themes pass through too. config.json themes lists { id } for a bundled theme or { id, source } for a theme file; without the list a project has the three bundled themes. Auto shows the first listed theme whose scheme matches the system appearance, so list order is the association between themes and system modes. The enabled themes travel in the boot payload; the page, the picker, the link reader and the covers take that list, and nothing imports a fixed theme list. A link or path naming a theme the project does not enable is passed over, which keeps the existing fallback order (link, publication path, saved choice). Themes use the plugin commands (add, remove, list, and the new clone) but are not part of plugin presence or restore: a theme has nothing to install, and a missing theme file fails the page load with its path. A clone is written to <groma-root>/<id>.theme.json, a JSON file the OKF index does not list. Not done: themes do not appear in the Plugins settings screens, and there is no palette editor; the file is edited by hand.

Verification: bun run check passed (28 Node tests, 1019 Bun tests, 64 environment-dependent skips, 0 failures). On the editing fixture: groma plugin list showed the three bundled themes; groma plugin clone dark midnight wrote the file and enabled it; after editing four palette values and removing blueprint, groma web offered Auto, Light, Dark and Midnight, a link with theme=midnight opened in it with the og:image pointing at cover-midnight.png, that cover was served and cover-blueprint.png returned 404; with the system appearance emulated as dark, Auto showed Dark; the container authored violet stayed violet in the custom theme. groma export on groma.md own map wrote one cover per enabled theme.

Automated PR review, applied: auto is reserved and cannot be a theme id, in config.json or when cloning, because the picker and Auto resolution use that word; cloning refuses a destination file that already exists, since a theme taken out of the picker keeps its file and its palette edits. Both are covered by the clone test. Also: the setup page takes its theme ids from the bundled themes, and the configuration docs say what a clone does not copy (the few line treatments that belong to the bundled Dark and Blueprint).

Cold simplicity review (one round), applied: a publication path naming a theme the project does not enable is ignored when the link is written too, so Auto on such a path no longer writes theme=auto over the recipient saved theme (regression, now asserted); the saved choice is validated where it is read, so the theme control takes a checked value and the fallback helper is gone; the rule that no themes list means the bundled themes lives in one function (themeEntries); enabling a theme takes an explicit entry and one function turns command input into an entry; the plugin kind stays scanner or work source, and only a reported selection can be a theme; cloning an unknown theme says so. Kept, with the docs and the bundled-theme comment corrected to say it: a few stylesheet rules still name dark and blueprint (syntax line treatments, the Blueprint panel border and glow), so a clone takes the colours and not those; removing or generalising them changes how the bundled themes look and is Alex decision. Kept: the link readers default to the bundled themes when no list is passed, which is the project default and what the existing tests use; both production callers pass the enabled list.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
UI themes are data. Light, Dark and Blueprint are bundled theme definitions that pass through the same validator and loader as a project own theme file. config.json lists the enabled themes; the picker, shared links and covers follow that list, and Auto shows the first listed theme of the system appearance. groma plugin clone <theme> <id> writes an editable copy of a theme and enables it, and plugin add, remove and list handle themes. Each theme defines the named colors, so authored colors keep their names and take the theme values.
<!-- SECTION:FINAL_SUMMARY:END -->
