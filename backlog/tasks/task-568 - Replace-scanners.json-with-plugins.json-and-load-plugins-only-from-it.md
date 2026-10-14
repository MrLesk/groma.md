---
id: TASK-568
title: >-
  Replace scanners.json with config.json and restore its plugins on another
  computer
status: In Progress
assignee:
  - '@claude'
created_date: '2026-10-08 15:14'
updated_date: '2026-10-14 18:34'
labels: []
dependencies: []
references:
  - package
  - modules-readiness
  - scanner-registry
  - src-view-host
  - web-server
  - src-welcome
  - src-initialize
  - scanners-settings
  - tui-scanner-settings
  - backlog-src-index
  - work-source-src-index
  - src/scanner/modules/config.ts
  - docs/scanners/setup.md
  - .github/workflows/architecture.yml
  - src-cli
  - scripts/scanner-release.ts
  - plugins/work-sources/backlog/package.json
  - packages/work-source/package.json
  - .github/workflows/release.yml
  - docs/scanners/publishing.md
  - test-bun/scanner-release.test.ts
modified_files:
  - .github/workflows/architecture.yml
  - CONTRIBUTING.md
  - README.md
  - docs/agent-instructions/inspect.md
  - docs/agent-instructions/structure.md
  - docs/architecture-findings.md
  - docs/config.md
  - docs/index.md
  - docs/product-model.md
  - docs/scanners/angular/index.md
  - docs/scanners/cobol/index.md
  - docs/scanners/creating-a-plugin.md
  - docs/scanners/discovery.md
  - docs/scanners/dotnet-csharp/index.md
  - docs/scanners/go/index.md
  - docs/scanners/index.md
  - docs/scanners/java/index.md
  - docs/scanners/java/validation.md
  - docs/scanners/javascript/index.md
  - docs/scanners/kotlin/index.md
  - docs/scanners/nasm/index.md
  - docs/scanners/php/index.md
  - docs/scanners/publishing.md
  - docs/scanners/python/index.md
  - docs/scanners/python/validation.md
  - docs/scanners/react/index.md
  - docs/scanners/rust/index.md
  - docs/scanners/scala/index.md
  - docs/scanners/setup.md
  - docs/scanners/swift/index.md
  - docs/scanners/swift/validation.md
  - docs/scanners/vue/index.md
  - docs/viewers/creating-a-plugin.md
  - docs/viewers/index.md
  - docs/viewers/tui/index.md
  - docs/viewers/web/index.md
  - examples/scanner/README.md
  - groma/config.json
  - groma/systems/groma-md/containers/cli/components/backlog-src-index.md
  - groma/systems/groma-md/containers/cli/components/modules-settings.md
  - groma/systems/groma-md/containers/cli/components/package.md
  - groma/systems/groma-md/containers/cli/components/scanner-session.md
  - groma/systems/groma-md/containers/cli/components/src-cli.md
  - groma/systems/groma-md/containers/cli/components/tui-scanner-settings.md
  - groma/systems/groma-md/containers/cli/components/web-server.md
  - groma/systems/groma-md/containers/cli/components/work-sources.md
  - groma/systems/groma-md/containers/export/components/scanners-settings.md
  - packages/work-source/src/index.ts
  - plugins/work-sources/backlog/src/index.ts
  - scripts/reproduce-scanner-boundaries.ts
  - src/backlog-cli.ts
  - src/cli.ts
  - src/config.ts
  - src/init-command-ui.ts
  - src/init-command.ts
  - src/plugin-cli.ts
  - src/plugin-management.ts
  - src/scanner/cli.ts
  - src/scanner/modules/discovery.ts
  - src/scanner/modules/inventory.ts
  - src/scanner/modules/package.ts
  - src/scanner/modules/readiness.ts
  - src/scanner/modules/selection.ts
  - src/scanner/modules/settings-model.ts
  - src/scanner/modules/settings.ts
  - src/scanner/modules/setup.ts
  - src/scanner/registry.ts
  - src/scanner/session.ts
  - src/source-coverage.ts
  - src/view-host.ts
  - src/viewers/source/structure.ts
  - src/viewers/tui/model.ts
  - src/viewers/tui/panes/view.ts
  - src/viewers/tui/scanner-settings.ts
  - src/viewers/tui/terminal-viewer.ts
  - src/viewers/web/data.ts
  - src/viewers/web/map-session.ts
  - src/viewers/web/page.ts
  - src/viewers/web/payload.ts
  - src/viewers/web/scanners/settings.ts
  - src/viewers/web/server.ts
  - src/viewers/web/settings/control.ts
  - src/viewers/web/settings/model.ts
  - src/viewers/web/startup/page.ts
  - src/viewers/web/startup/progress.ts
  - src/viewers/web/startup/restore.ts
  - src/welcome.ts
  - src/welcome/model.ts
  - src/welcome/view.ts
  - src/work-sources.ts
  - test-bun/angular-scanner.test.ts
  - test-bun/bundle-index.test.ts
  - test-bun/code-outline.test.ts
  - test-bun/compiled-scanner.test.ts
  - test-bun/csharp-source-units.test.ts
  - test-bun/first-scan-curation.test.ts
  - test-bun/go-scanner.test.ts
  - test-bun/javascript-scanner.test.ts
  - test-bun/lint-command.test.ts
  - test-bun/php-scanner.test.ts
  - test-bun/project-review.test.ts
  - test-bun/python-scanner.test.ts
  - test-bun/react-scanner.test.ts
  - test-bun/scanner-compatibility.test.ts
  - test-bun/scanner-exclusions.test.ts
  - test-bun/scanner-installation.test.ts
  - test-bun/scanner-restore.test.ts
  - test-bun/scanner-settings-lifecycle.test.ts
  - test-bun/scanner-settings.test.ts
  - test-bun/scanner-source-listing.test.ts
  - test-bun/scanner-update.test.ts
  - test-bun/scanner-upgrades.test.ts
  - test-bun/source-coverage.test.ts
  - test-bun/swift-scanner.test.ts
  - test-bun/viewer-scanner-availability.test.ts
  - test-bun/vue-scanner.test.ts
  - test-bun/web-startup.test.ts
  - test-bun/work-source-selection.test.ts
  - test/fixtures/mixed-scanner-outline/groma/config.json
  - test/fixtures/mixed-scanner-outline/groma/scanners.json
  - groma/scanners.json
  - src/scanner/modules/config.ts
type: feature
ordinal: 645000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
On main, `<groma-root>/scanners.json` lists the scanner plugins (id, exact source, include and exclude patterns, settings) plus a shared `exclude` list and `useGitignore`. The Backlog.md work source is compiled into groma.md and runs whenever a `backlog` command is on the PATH; nothing records that a project uses it. A colleague who clones the project cannot see what it needs and has no single way to get it.

`<groma-root>/config.json` replaces scanners.json. It is the project's one groma.md configuration: today it lists the plugins the project uses, by kind, and later settings join it.

- Sections: `scanners`, `workSources`, and the top-level `exclude` and `useGitignore`. TASK-561 adds `icons` through the same flow.
- A plugin with a `source` is downloaded. The source is exact (`package@version`, `git+https://…#tag-or-commit`, or a local `./path`), so the file pins every downloaded version.
- A plugin without a `source` is bundled: it ships inside groma.md and follows its version. The Backlog.md adapter is bundled; it is not published or downloaded.
- The Backlog.md entry records the minimum Backlog.md CLI version, for example `{ "id": "backlog", "version": "1.21.0" }`. Tasks appear only when config.json lists Backlog.md.
- One restore component owns "is this plugin present on this computer, and how is it restored", decided by kind: download the package at its listed version, or install the Backlog.md CLI when it is missing or older than the listed version. A bundled plugin with no tool is always present.
- Every entry point goes through that component: `groma init`, Add on the plugins screen, the `groma web` restore view, the terminal welcome screen and `groma plugin install`.
- Updating a plugin writes its new version into config.json. A colleague who pulls finds that version missing and restores it through the same flow.
- `groma plugin add|update|install|list|remove` manage every kind. `groma scanner add|update|install|list|remove` are removed; `groma scanner settings|setup|check|discover` stay because they only concern scanners.

AGENTS.md forbids migrations unless requested: config.json replaces scanners.json directly, with no fallback to the old file. Convert this repository's file and the test fixtures.

Product decisions by Alex on 2026-10-13 and 2026-10-14: bundled Backlog adapter (only the Backlog.md CLI is installed), the name config.json, the restore flow for a colleague, the wizard-style restore view in groma web that appears only when a plugin is missing with a read-only way forward, tasks only when config.json lists Backlog.md, adding Backlog.md later from the plugins screen, versions in config.json so updates reach colleagues, and one command set for plugins.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 `<groma-root>/config.json` replaces scanners.json with `scanners` and `workSources` sections and the top-level `exclude` and `useGitignore`; plugin ids are lowercase kebab-case and unique across sections; nothing reads scanners.json; the format is documented; this repository's file and the test fixtures are converted.
- [ ] #2 A plugin with a `source` is downloaded at that exact version; an entry without `source` names a plugin bundled with groma.md. The Backlog.md adapter is bundled and not published as a package; its entry records the minimum Backlog.md CLI version. Without that entry groma.md never runs the Backlog.md CLI, and a second work source is refused.
- [ ] #3 One restore component reports for every listed plugin whether it is present on this computer and restores what is missing by kind: it downloads a package at the listed version, and installs the Backlog.md CLI when it is missing or older than the listed version. Every entry point in the following criteria uses it.
- [ ] #4 `groma init` recommends Backlog.md, preselected; choosing it writes its entry and restores it through the restore component.
- [ ] #5 The plugins screen in the web and terminal viewers lists plugins by kind. It lists the bundled plugins the project does not use yet, each with Install, besides Add plugin for a source; installing or adding one writes its entry and restores it.
- [ ] #6 Only when a plugin of any kind that config.json lists is not present, `groma web` opens on a restore view in the style of its setup wizard. It lists the missing plugins and asks for confirmation. Restore installs them with a loading indicator per item and opens the map when all are present; a plugin it cannot restore stays on the view with its failure reason. Proceed without them opens the map read-only, the way a historical view is: no scan runs and nothing can be edited.
- [ ] #7 The terminal welcome screen names missing plugins. `groma plugin add|update|install|list|remove` manage every kind; `groma plugin update` records the new exact version, or for Backlog.md the installed CLI version, so a colleague who pulls finds it missing. `groma scanner add|update|install|list|remove` are removed; `groma scanner settings|setup|check|discover` stay.
- [ ] #8 Docs, agent guides and .github/workflows/architecture.yml refer to config.json.
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
OKF and C4: config.json is operational project configuration, not architecture knowledge. It adds no OKF concept and no C4 element; an ordinary Markdown reader of groma/ sees nothing new. Groma's plugin code owns its meaning.

1. Config file. Move src/scanner/modules/config.ts to src/config.ts (the file a junior looks for when reading config.json) and rename PluginConfig, readPluginConfig and writePluginConfig to GromaConfig, readGromaConfig and writeGromaConfig. The file becomes `<groma-root>/config.json`. A work-source entry is `{ id, version }`: the id must name a bundled work source, the version is the exact minimum CLI version. Convert groma/plugins.json and the fixture.
2. Bundled Backlog adapter. src/work-sources.ts holds the bundled work sources by id (the Backlog adapter imported from its workspace package, as on main) and reads readiness from it; nothing resolves a work-source package any more. Delete the work-source package path: the manifest kind and host check in package.ts and published.ts, release staging and publishing of @groma/work-source and @groma/work-source-backlog, their docs and test. The adapter's package.json returns to a private workspace package. The adapter's readiness also reports the installed CLI version.
3. Backlog.md CLI. Move the Backlog.md CLI install and init helpers out of src/init-command.ts into src/backlog-cli.ts, so init and restore share them. Restore installs the current CLI with the installer groma.md was installed with, else the first of bun, npm or brew on the PATH.
4. One restore component in src/plugin-management.ts: pluginPresence lists every entry with whether this computer has it (scanner: the package at its exact source; work source: the CLI found and at least the listed version) and what is missing; restorePlugin restores one entry by kind; installPlugins restores all. add, update and remove keep their place there; add accepts a bundled id (backlog) and records the installed CLI version; update of backlog installs the current CLI and records its version.
5. Commands. Delete groma scanner add, update, install, list and remove and the inventory.ts wrappers; callers use plugin-management.ts. groma plugin list prints the version for a bundled entry.
6. groma init asks about Backlog.md with yes preselected; yes writes the entry and restores it through restorePlugin, then runs backlog init.
7. Plugins screen. Add offers the bundled plugins not yet listed, beside the source field, in the web settings dialog and the terminal Plugins screen; adding goes through addPlugin.
8. groma web restore view. When the project is initialized and pluginPresence reports a missing entry, the server renders a restore view in the setup page's style listing the missing plugins with Restore and Proceed without them. Restore streams one progress row per plugin over the startup events (restoring, restored, failed with the reason); when all are present the map opens as usual, otherwise the view returns with the still-missing plugins and their reasons. Proceed opens the read-only map.
9. Read-only map. createWebMapSession takes readOnly: no scanner session (no scan, no source watch), write routes answer 403, and the page's live delivery carries readOnly so the browser offers no write controls and no plugin settings, as for a historical view. One header label says the map is read-only because plugins are missing.
10. The terminal welcome screen lists missing plugins from pluginPresence.
11. Docs, agent guides, README and .github/workflows/architecture.yml name config.json; docs describe bundled plugins, versions and the restore view.
12. Tests (rule, wrong result, gap), decided per slice before writing: presence by kind (a CLI older than the listed version must count as missing; nothing covers versions), the web restore flow (a missing plugin must show the restore view and Proceed must refuse writes; web-startup tests cover only setup and loading), bundled add (adding backlog must write id and version and no source). Existing tests are renamed, not duplicated.
13. bun run check, scan and fold task-owned architecture, cold simplicity review, own specification and quality review, full-context complexity review.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Redesigned on 2026-10-14 with Alex; the description lists his decisions. The earlier implementation on this branch (plugins.json, the Backlog adapter as a published package, separate scanner and plugin commands) is the starting point; its review history is in the branch's commits.

Rework on 2026-10-14 (after merging main, including TASK-580's registry reads through the package manager):

- Scanner package code (package.ts, published.ts, inventory.ts and the files that only renamed its types) is back to main's scanner-only version: with the Backlog adapter bundled, no second package kind remains. The release staging and publishing of @groma/work-source and @groma/work-source-backlog, its docs and its test are back to main.
- config.ts moved to src/config.ts as GromaConfig, readGromaConfig and writeGromaConfig; a work-source entry is { id, version }.
- The work-source contract's readiness() is async and reports the installed tool version; the Backlog adapter reads `backlog --version`.
- src/plugin-management.ts is the restore component: pluginPresence, restorePlugin, restoreMissingPlugins, addPlugin, updatePlugin, removePlugin. src/backlog-cli.ts holds the Backlog.md CLI install and init helpers, moved from init-command.ts; init no longer asks which package manager installed groma.md.
- Settings rows carry `listed`; an unlisted bundled work source is offered with Install. The web restore view lives in src/viewers/web/startup/restore.ts; the read-only map is createWebMapSession({ readOnly }) plus a live delivery with readOnly, whose data source has no writers.
- Deleted: groma scanner add|update|install|list|remove, installScanners, the work-source package path, the host-compatibility check, officialWorkSourceIds, the installer prompt.

Tests (rule, wrong result caught, gap):
- work-source-selection: the Backlog.md CLI runs only while config.json lists Backlog.md, and adding it by id records its installed version with no source (AC2, AC7). Catches a CLI call without an entry or an entry with a source. The old test loaded a package adapter that no longer exists; rewritten with a fake `backlog` on PATH in a child process (skipped on Windows like backlog-cli.test.ts).
- work-source-selection: a CLI older than the listed version counts as missing (AC3). Catches an outdated CLI counted as present, which would stop a colleague's update from reaching others. Nothing covered versions.
- web-startup: a missing plugin opens the restore view, a failed restore shows its reason, and Proceed opens a map whose writes are refused (AC6). Catches the map opening directly, a missing failure reason, or a writable map. Web startup tests covered only setup and loading.
- Existing tests renamed or adapted: parser tests use { id, version }, init tests inject addBacklog, restore test calls restoreMissingPlugins, settings tests set listed.

Verification: bun run check exit 0 (Biome: only existing warnings after the server refactor; TypeScript; 16 Node tests; 798 Bun tests, 54 toolchain skips, 0 failures). Under heavy machine load the Python, flows and Vue overlap tests timed out on this branch and on a clean origin/main worktree alike; they pass on a quiet machine. Browser check of a demo project: restore view with a missing scanner and an outdated Backlog.md CLI; Proceed opened the read-only map (badge, no add or edit controls, no plugin settings, POST /add 403); a failing Restore showed the reason; a real Restore downloaded @groma/scanner-go@0.2.1 with a spinner and opened the normal map; Install on the Backlog.md row wrote { id: backlog, version: 1.53.0 }. Terminal welcome read through tui-test shows the missing plugins line. Not run: the Backlog.md CLI install and upgrade commands (bun add -g, npm install -g, brew), because they change the computer's global install.
<!-- SECTION:NOTES:END -->
