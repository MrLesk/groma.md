---
id: TASK-568
title: Replace scanners.json with plugins.json and load plugins only from it
status: In Progress
assignee:
  - '@codex'
created_date: '2026-10-08 15:14'
updated_date: '2026-10-11 19:42'
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
  - src/scanner/modules/config.ts
  - src/scanner/modules/package.ts
  - src/scanner/modules/inventory.ts
  - src/scanner/modules/published.ts
  - src/work-sources.ts
  - src/plugin-management.ts
  - src/plugin-cli.ts
  - src/cli.ts
  - src/view-host.ts
  - src/viewers/web/map-session.ts
  - plugins/work-sources/backlog/src/index.ts
  - plugins/work-sources/backlog/package.json
  - src/welcome/model.ts
  - src/scanner/modules/settings-model.ts
  - src/scanner/modules/settings.ts
  - src/viewers/web/scanners/settings.ts
  - src/viewers/tui/scanner-settings.ts
  - src/init-command.ts
  - src/init-command-ui.ts
  - package.json
  - bun.lock
  - groma/systems/groma-md/containers/cli/components/plugin-cli.md
  - groma/systems/groma-md/containers/cli/components/plugin-management.md
  - groma/systems/groma-md/containers/cli/components/work-sources.md
  - test-bun/scanner-installation.test.ts
  - .github/workflows/architecture.yml
  - test-bun/first-scan-curation.test.ts
  - test-bun/vue-scanner.test.ts
  - test-bun/swift-scanner.test.ts
  - docs/scanners/creating-a-plugin.md
  - test-bun/scanner-exclusions.test.ts
  - docs/scanners/cobol/index.md
  - docs/scanners/javascript/index.md
  - docs/agent-instructions/inspect.md
  - test-bun/scanner-restore.test.ts
  - docs/scanners/swift/validation.md
  - docs/agent-instructions/structure.md
  - test-bun/code-outline.test.ts
  - docs/scanners/index.md
  - src/source-coverage.ts
  - docs/scanners/discovery.md
  - docs/scanners/setup.md
  - docs/scanners/nasm/index.md
  - test-bun/javascript-scanner.test.ts
  - test-bun/angular-scanner.test.ts
  - test-bun/react-scanner.test.ts
  - test-bun/bundle-index.test.ts
  - groma/scanners.json
  - groma/plugins.json
  - test/fixtures/mixed-scanner-outline/groma/scanners.json
  - test/fixtures/mixed-scanner-outline/groma/plugins.json
  - examples/scanner/README.md
  - test-bun/work-source-selection.test.ts
  - groma/systems/groma-md/containers/cli/components/src-core.md
  - groma/systems/groma-md/containers/cli/components/web-server.md
  - src/scanner/session.ts
  - groma/systems/groma-md/containers/cli/components/src-cli.md
  - groma/systems/groma-md/containers/cli/components/package.md
  - groma/systems/groma-md/containers/cli/components/modules-settings.md
  - groma/systems/groma-md/containers/export/components/scanners-settings.md
  - groma/systems/groma-md/containers/cli/components/tui-scanner-settings.md
  - groma/systems/groma-md/containers/cli/components/scanner-session.md
  - scripts/scanner-release.ts
  - .github/workflows/release.yml
  - docs/scanners/publishing.md
  - test-bun/scanner-release.test.ts
  - docs/product-model.md
  - docs/viewers/index.md
  - docs/viewers/creating-a-plugin.md
  - docs/index.md
  - README.md
  - CONTRIBUTING.md
  - src/scanner/modules/official-catalog.ts
  - src/viewers/web/settings/model.ts
  - test-bun/csharp-source-units.test.ts
  - test-bun/php-scanner.test.ts
  - test-bun/project-review.test.ts
  - test-bun/scanner-compatibility.test.ts
  - test-bun/scanner-settings-lifecycle.test.ts
  - test-bun/scanner-settings.test.ts
  - test-bun/scanner-upgrades.test.ts
  - test-bun/viewer-scanner-availability.test.ts
  - docs/viewers/tui/index.md
  - test-bun/scanner-recommendations.test.ts
  - scripts/reproduce-scanner-boundaries.ts
  - src/scanner/cli.ts
  - src/scanner/modules/discovery.ts
  - src/scanner/modules/readiness.ts
  - src/scanner/modules/selection.ts
  - src/scanner/modules/setup.ts
  - src/scanner/registry.ts
  - src/viewers/source/structure.ts
  - src/viewers/tui/model.ts
  - src/viewers/tui/panes/view.ts
  - src/viewers/tui/terminal-viewer.ts
  - src/viewers/web/data.ts
  - src/viewers/web/page.ts
  - src/viewers/web/settings/control.ts
  - src/welcome/view.ts
  - test-bun/compiled-scanner.test.ts
  - test-bun/go-scanner.test.ts
  - test-bun/lint-command.test.ts
  - test-bun/python-scanner.test.ts
  - test-bun/scanner-update.test.ts
  - test-bun/source-coverage.test.ts
  - test-bun/web-startup.test.ts
  - src/welcome.ts
  - groma/systems/groma-md/containers/cli/components/backlog-src-index.md
type: feature
ordinal: 645000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Scanner plugins are explicit. `<groma-root>/scanners.json` lists them: id, source, include and exclude patterns and settings, plus a global `exclude` list and `useGitignore` (src/scanner/modules/config.ts). groma.md resolves each source from npm, a local folder or git (src/scanner/modules/package.ts), reports whether it is found or missing on this computer (src/scanner/modules/readiness.ts and inventory.ts), checks it against the running groma.md version, and installs or restores a missing one (`groma scanner install`). The web settings dialog and the terminal settings screen list them.

The Backlog.md work source is not explicit. Its adapter, `@groma/work-source-backlog` (plugins/work-sources/backlog, plugin id `backlog.md`), is imported directly in src/view-host.ts, src/welcome/model.ts and src/viewers/web/map-session.ts, and used whenever a `backlog` command is on the PATH. The welcome screen reports whether the CLI is found and how to install it, and `groma init` can initialize Backlog.md (src/init-command.ts), but nothing records that the project uses Backlog.md. Most groma.md projects will not use it.

Make plugins explicit in one file, `<groma-root>/plugins.json`, which replaces scanners.json:
- One section per plugin kind. This task implements two kinds: `scanners`, whose entries keep the fields and validation of today's scanners.json, and `workSources`, whose entries have an id and a source. Icon packs become a third kind in TASK-561. The global `exclude` and `useGitignore` stay at the top level.
- Every plugin id follows the scanner id rule, lowercase kebab-case. The Backlog work source's id becomes `backlog`.
- This revision supports at most one work source, the Backlog adapter. A second `workSources` entry is refused with a clear message.
- No plugin loads unless the file lists it. Without a `workSources` entry, groma.md never runs the Backlog.md CLI, even when it is on the PATH.
- Work sources use the scanner machinery: the same source resolution, found, missing or blocked readiness with a reason, the version check, and install or restore of a missing package. The Backlog adapter becomes an installable package like the scanner packages; its readiness also reports whether the `backlog` CLI is present and how to install it.
- `groma plugin add|list|remove|install|update` manage every kind. The scanner-specific commands (`groma scanner discover`, `check`, `settings`, `setup`) stay, and `groma scanner add` keeps working.
- The web settings dialog and the terminal settings screen list plugins by kind.
- When the user chooses Backlog.md during `groma init`, init adds the work source to plugins.json.
- Viewers stay built in and are out of scope.

As AGENTS.md requires (no migrations unless requested), plugins.json replaces scanners.json directly: no migration code and no fallback to the old file. Convert this repository's own `groma/scanners.json` into `groma/plugins.json` with a `workSources` entry for Backlog.md, and convert the test fixtures that contain a scanners.json.

A workable order: the file and its loading, then the commands, then the Backlog adapter as a package, then the settings screens.

Update everything that names scanners.json: docs/scanners/ (setup, discovery, index, creating-a-plugin and the language pages), docs/agent-instructions/structure.md and inspect.md, and .github/workflows/architecture.yml, which reads groma/scanners.json. The groma.md GitHub Action lives in another repository (MrLesk/groma.md-action); if it reads scanners.json, say so in the final summary.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 <groma-root>/plugins.json holds a scanners and a workSources section; scanner entries keep today's fields and validation, plugin ids are lowercase kebab-case, and the format is documented.
- [x] #2 No plugin loads without an entry: with no workSources entry, groma.md never runs the Backlog.md CLI, even when it is on the PATH, and a second work-source entry is refused with a clear message.
- [ ] #3 A listed work source resolves from npm, a local folder or git, reports found, missing or blocked with a reason, passes the groma.md version check, and is installed or restored when missing the same way a missing scanner is; the Backlog adapter's readiness also reports whether the backlog CLI is present and how to install it.
- [x] #4 groma plugin add, list, remove, install and update manage scanners and work sources; groma scanner add and the other scanner commands keep working; the web and terminal settings list plugins by kind.
- [ ] #5 Choosing Backlog.md during groma init adds the work source to plugins.json, nothing reads scanners.json any more, and this repository's groma/plugins.json lists its scanners and the Backlog work source.
- [x] #6 Docs, agent guides and .github/workflows/architecture.yml refer to plugins.json.
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
1. Replace the configuration filename with plugins.json and validate explicit scanner and work-source selections, preserving scanner fields. 2. Share scanner source resolution, package installation and release compatibility with work sources; load only configured work sources. 3. Add plugin management commands, connect init and both viewers, and group settings by plugin kind. 4. Convert repository configuration, fixtures, documentation and CI references. 5. Inspect supported flows and diffs without installs, builds or tests as requested; scan and curate task-owned architecture changes. Existing tests cover scanner configuration and package lifecycle; adapt filename expectations. Add focused coverage only for explicit work-source loading, selection cardinality and compatibility, whose absence currently permits implicit Backlog execution.

Review fixes (9 October 2026): 1. Extend scripts/scanner-release.ts staging and publication to include the Backlog work-source adapter and @groma/work-source contract, with an exact declared contract dependency. Keep init npm-only; public install remains a next-release gate. 2. Put shared update source preparation in src/scanner/modules/package.ts, while callers keep kind validation and scanner settings. Route settings restore by plugins.json; extract scanner-list duplicate validation and web detail labels to keep changed functions at complexity 15 or lower. Retain loadWorkSource for TASK-564 integration. 3. Test authority: TASK-568 AC3/AC5 and the reproduced unpublished adapter failure require the next staged release to yield installable work-source packages. Wrong outcome: adapter or contract missing from staging, invalid dependency metadata, or a packed adapter cannot be added/restored from a registry. Existing scanner-release tests cover scanner assembly only; extend that file with the smallest stage/pack/local-registry add-and-restore test for these packages. Existing scanner-update, scanner-settings, configuration and work-source tests cover the behavior-preserving refactors; do not add duplicate tests. 4. Run focused checks and bun run check, one cold simplicity review, implementer specification/quality review and one full-context complexity review; record release-only gaps and curate any caused architecture changes before the local commit.

Maintainability pass (11 October 2026), review findings A to H: 1. A: correct docs that still describe an embedded Backlog work source, the old cache folder and implicit Backlog setup, so they state the opt-in behaviour. 2. B: in offerBacklog report a failed Backlog initialization before the already-selected return; rename the UI method to match its question. 3. C: reject a plugin id repeated across the scanners and workSources sections in one place while parsing plugins.json. 4. D: remove every place where generic plugin code names the Backlog adapter (config, plugin management, readiness wording, official flag, setup doc); official work sources are decided like official scanners, by the embedded manifest id. 5. F: one sentence in docs/scanners/setup.md that reporting work-source readiness imports the adapter. 6. G: restore each file's import grouping, indentation and JSON import attributes. 7. H: the architecture workflow restores only released scanner packages and leaves the work source on its repository path. 8. E last: first give the work-source settings row and resolved package their own shape so neither carries scanner placeholder values, then one mechanical rename commit (plugin config, package, source, settings) with no behaviour change. Tests for this pass. (a) Rule: a failed Backlog initialization during groma init is reported (finding B, reproduced: a rerun with Backlog selected returns before the error). Wrong result caught: init finishes without the error line. Gap: no test drives runInitCommand; add one test in test-bun/work-source-selection.test.ts with injected dependencies. (b) Rule: plugin ids are unique across sections because remove and update address a plugin by id alone (finding C). Wrong result caught: a hand-written plugins.json with one id in both sections loads and remove or update acts on the work source instead of the scanner. Gap: only duplicate scanner ids were rejected and nothing tested it; add one parse test in the same file. (c) Rule: core accepts any work-source id (finding D; acceptance criterion 2 only refuses a second entry). Wrong result caught: an adapter whose id is not backlog is refused. Gap: the fixture adapter used the id backlog; change the fixture id instead of adding a test.

(d) Rule: groma init runs backlog init only for a project that selects the Backlog.md adapter (acceptance criterion 2: no plugin's tool runs without its entry). Once core accepts any work-source id, a selection no longer implies Backlog. Wrong result caught: init creates a Backlog project in a repository that selected another work source. Gap: no test covers it; add one test beside the init regression test, sharing its wizard helper.

(e) Rule: the scanner warning opens the affected scanner (docs/scanners/setup.md: a warning appears only when scanning needs attention and opens the affected plugin). Its tone comes from scanner rows alone. Wrong result caught: with a blocked work source in the list, a warning about missing scanners opens the work-source row. Gap: test-bun/project-review.test.ts builds scanner rows only; add one case with a work-source row there.

Review list (11 October 2026, second pass), twenty items from the cold simplicity review and the orchestrator: 1. Package foundations: PluginResolutionOptions, PluginInstallOptions and the one cache-root fallback live in package.ts; published releases take an optional kind where undefined means any, with the requirement read from the same manifest section; the package reader names both sections and the allowed fields in its messages and states why the kind-specific return types hold. 2. plugins.json in memory always has both sections; the writer uses one key order and runs the parser's checks, so the unique-id and one-work-source rules exist once. 3. Plugin management owns one add sequence, one remove, one update and one restore for every kind, addressed by id; the scanner commands are the same operations limited to the scanners section; a bare package name becomes a source in one helper; plugin commands say plugin is not configured. 4. work-sources.ts: delete the unused loadWorkSource, name the readiness check for what it does, type the selection so the adapter exists exactly when it is ready, declare the session type and its one-watcher contract. 5. Welcome: drop the unused adapter parameter, probe the work source once through the settings state and print its line only when one is selected. 6. groma init: selecting the adapter is an injected dependency reported like its siblings, ordered select, install CLI, initialize; the Backlog status names each case. 7. groma plugin prints the same one-line forms as groma scanner through one shared error wrapper. 8. The Backlog adapter imports the empty work source from the contract. 9. Route, event, viewer option and welcome action that carry plugin settings are named for plugins. 10. Architecture records for the work-source loader and both settings screens corrected through groma edit. Tests for this pass. (f) Rule: choosing Backlog.md during groma init records the work source in plugins.json (acceptance criterion 5), and a failed selection leaves the CLI uninstalled and setup continuing (review item 2, reproduced: an unpublished package made groma init exit before scanner setup). Wrong result caught: the wizard finishes without the selection, or installs the CLI and aborts when the adapter cannot be added. Gap: the yes path was untestable while adding the adapter was not injected; add one test beside the other init tests using the fixture adapter. The test that claims a second entry is rejected before either adapter loads observes only the parser, so its title changes to say that.

(g) Rule: a command never saves a plugins.json that the parser refuses (review item 7: the writer runs the parser's checks). Wrong result caught: a second work source or a repeated id is written and only the next read fails. Gap: nothing observed the writer; extend the two parser tests in test-bun/work-source-selection.test.ts to assert the write is refused as well as the hand-written file.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Inspected existing scanner compatibility and Backlog lifecycle coverage. Added one concurrent fixture-based test file for the new selection boundary: an absent entry must produce no adapter read/watch calls, removing a selection closes its watch, host-version mismatch must prevent import, and a second entry must be refused. Existing tests did not cover host-side work-source selection. Tests remain unexecuted under the stage instruction.

Cold simplicity review identified one supported lifecycle gap: restoring a work-source package or retrying after CLI installation must activate the open viewer even when no architecture file changes. Added a shared settings-session callback to reconfigure both viewer work sources after successful settings actions. Corrected old UI labels in the setup documentation. Read-only CLI verification: plugin list reports TypeScript and Backlog found; scanner list remains operational; scanner settings JSON includes Backlog readiness; plugin help exposes add/list/remove/install/update. No installs, builds or tests run.

Configuration and format documentation are converted, repository plugins.json explicitly lists Backlog and TypeScript, and CLI inspection confirms both selected kinds and scanner-command continuity. Source CLI scan succeeded: created 0, refreshed 112, matched 0. git diff --check passed. UI grouping and init opt-in paths reviewed statically; interactive checks, package downloads and test execution remain excluded by the user. External MrLesk/groma.md-action contents could not be retrieved, so its old-filename use remains unverified.

Implementer specification/quality review: all six requested changes are represented and scoped to explicit plugin loading; scanner configuration preserves include/exclude/settings; no compatibility file reader was added. Junior-developer flow is CLI/settings -> package selection -> configured work-source readiness -> viewer-owned read/watch. Three source modules cover command registration, shared package lifecycle, and work-source loading; command and lifecycle modules are folded into existing architecture owners. Cold simplicity re-review closed both reported findings. Runtime verification is limited to read-only CLI commands and scan; automated and interactive tests remain unrun per instruction.

Final full-context complexity review found no material issues or further simplification. Final source CLI scan completed successfully: created 0, refreshed 108, matched 0, with 38 repository findings reported for separate lint review. Curated ownership survived the rescan. All task-owned scanner-written paths were recorded. Definition-of-Done automated/interactive verification remains intentionally unchecked because installs, builds and tests were prohibited.

Context brief: release.yml stages and publishes only scripts/scanner-release.ts outputs. The Backlog manifest has no declared contract dependency and is absent from that pipeline. Plugin selection is operational configuration, not an OKF concept or a C4 element; ordinary Markdown readers still read architecture unchanged, while Groma package resolution owns the configured adapter meaning. The existing package owner is the correct home for shared update preparation. This remains the smallest supported Backlog example and does not add a plugin framework.

Review-fix focused validation: 15 tests passed across scanner-release, work-source-selection, scanner-update, scanner-settings and scanner-restore. The new regression stages real source manifests, packs both work-source packages with npm pack, checks their entry/license and exact contract dependency, then adds and restores Backlog through a local registry with an isolated Bun cache. Changed-file Biome lint and full typecheck passed. Cold simplicity review passed with no blocking findings or material simplifications; applied its one wording correction that both contracts publish first. No package was published.

Implementer specification review: the confirmed AC3/AC5 release defect is corrected in the existing release owner: stage includes both real work-source packages, assembly copies them with the first host artifact, and publish uploads both contracts before Backlog before the main CLI build. The staged package regression proves npm selection and missing-cache restore using the real source manifests. Public-registry Backlog installation and a fresh interactive init remain release-time checks because this task must not publish. Existing AC1/AC2/AC4/AC6 implementation is preserved; original browser/terminal interactive verification and the external groma.md-action inspection are not newly claimed. Implementer quality review: traced workflow-to-package-to-config flow and update/restore entry points as a new junior developer. Each operation remains with its existing owner, caller validation and scanner settings survive, loadWorkSource is retained, and config/web helper branches preserve the supported result. New test fails if either staged package, runnable entry or exact dependency is missing, and observes configured identity/restore rather than prose. All changed source/test files remain under 500 lines; changed-file lint reports no complexity warnings. No new source file or architecture concept was added; git status --short groma/ is empty. Full repository check is still running.

Final full-context complexity review passed with no blocking defects or material simplifications. Full bun run check passed: Biome checked 604 files (one existing warning in unchanged test-bun/execution-evidence.test.ts and two existing informational notices), TypeScript passed, 16 Node tests passed, and 780 Bun tests passed with 51 toolchain-dependent skips and zero failures. git diff --check passed. Existing architecture owners already cover the changed source; no new source file was added and git status --short groma/ is empty. AC3 and AC5 are now unchecked to preserve the outstanding real public-registry delivery gate accurately: the real staged packages pass local-registry install/restore, but @groma/work-source and @groma/work-source-backlog still need first publication, their trusted publisher configuration, and fresh public npm init validation in the next actual release. This work intentionally performs no npm publication, release tag or remote push. Original browser/terminal interactive coverage and external groma.md-action inspection are not newly claimed.

Maintainability pass (11 October 2026), review findings A to H, committed locally and not pushed.

A. Docs: docs/product-model.md, docs/viewers/index.md, docs/viewers/creating-a-plugin.md, docs/scanners/index.md, docs/index.md, README.md and CONTRIBUTING.md no longer describe an embedded Backlog work source or implicit Backlog setup; they say the work source is the one plugins.json selects. docs/scanners/creating-a-plugin.md names the ~/.groma/cache/plugins folder, docs/agent-instructions/structure.md calls plugins.json plugin configuration, docs/viewers/tui/index.md names the Plugins screen.

B. src/init-command.ts offerBacklog reports a failed Backlog initialization before the already-selected return. The prompt method is confirmUseBacklog, matching its question.

C. src/scanner/modules/config.ts requireUniqueIds rejects a plugin id used by more than one entry across scanners and workSources, called once from the parser.

D. Generic plugin code no longer names the Backlog adapter. plugins.json accepts any work-source id. Host compatibility has one owner, hostIncompatibility in src/work-sources.ts, which plugin management reuses through requireCompatibleHost. Readiness wording is built from the adapter's own readiness answer. Official work sources come from the embedded manifest in src/scanner/modules/official-catalog.ts, like official scanners. Because a selection no longer implies Backlog, initializeRepository runs backlog init only when the selected id is the Backlog adapter's manifest id, and init adds the adapter by the manifest's package name.

E. Three commits. Part 1: a settings row is a ScannerSetting or a WorkSourceSetting (PluginSetting); the work-source row carries no scanner placeholder values; the settings list is the plugins field; scannerWarning reads scanner rows only; the terminal label counts missing plugins. Part 2: a resolved package is a ResolvedScannerPackage or a ResolvedWorkSourcePackage, so a work source has no placeholder include list; a caller that asks a resolver for one kind gets that kind's type; messages of the shared package, release and settings code say plugin. Part 3: mechanical rename with no behaviour change (PluginConfig, readPluginConfig, writePluginConfig, PluginSource, parsePluginSource, defaultPluginCacheRoot, resolvePluginPackage, installPluginPackage, PublishedPlugin and its functions, PluginInstallOptions, PluginResolutionOptions, PluginSettings, PluginSettingsAction, pluginGroups, pluginSettingAction, pluginUpgradeAction, pluginSettingLabel, readPluginSettings, changePluginSettings, parsePluginSettingsAction, withPluginUpgrades, the settings screen entry points and the model field pluginSettings). Scanner-only names stay: ScannerSetting, ResolvedScannerPackage, scannerNotice, scannerMatchReason, scannerSettingsState, scannerWarning, the inventory functions.

F. docs/scanners/setup.md states that reporting work-source readiness imports the selected adapter, while groma scanner list executes no plugin.

G. Import grouping restored in src/init-command.ts, src/scanner/modules/settings.ts, src/view-host.ts, src/viewers/web/map-session.ts and src/welcome/model.ts; the onPluginsChanged line is indented with its siblings; src/work-sources.ts imports package.json with the JSON attribute.

H. .github/workflows/architecture.yml rewrites only scanner sources and runs groma scanner install; the work source keeps its repository path.

Observable changes outside the mechanical rename, for the reviewer: the settings snapshot (groma scanner settings without a terminal, and the web settings payload) lists rows under plugins, each with kind; the terminal label reads Install missing plugins; the web error titles read Could not load plugins and Plugin action failed; package and release messages say plugin; a scanner warning no longer opens a work-source row.

Verification run in this worktree: bun run typecheck passes. bunx biome lint reports 1 warning and 2 infos, the same as before the pass, all in unchanged files. Focused Bun tests pass: 59 across the plugin, settings, selection, release and scanner module files; 62 across web startup, shell, export, chrome, terminal lifecycle, plain view and scan files; 51 passed with 12 toolchain skips across the go, python, php, angular, vue and csharp scanner files; compiled-scanner passes. Each new or changed regression test was seen failing without its fix. bun src/cli.ts scan ran and left groma/ unchanged. The terminal Plugins screen was read through tui-test, and the web Plugins rows through a private headless Chromium, both showing the Work sources group with the Backlog row. The full bun run check was not run in this lane.

Review list applied (second pass, twenty items), committed locally and not pushed.

Foundations (items 10, 11, 17): PluginResolutionOptions, PluginInstallOptions and the one cache-root fallback live in src/scanner/modules/package.ts; resolvePluginPackage and installPluginPackage take the options object. selectPublishedPlugin and publishedPluginSource take an optional kind where undefined means any, read the required groma.md range from the same manifest section, and no caller passes a placeholder. The package reader names both sections when a manifest has neither, lists the allowed fields, and states why the kind-specific return types hold.

plugins.json (items 6, 7): PluginConfig.workSources is a required array; the writer uses one key order (scanners, workSources, exclude, useGitignore) and runs the parser before saving, so the unique-id, one-work-source and duplicate-source rules have one owner. The hand checks in the add paths are gone. This repository's groma/plugins.json was rewritten through the writer (key order only).

Plugin operations (items 8, 9, 18): src/plugin-management.ts owns addPlugin, removePlugin, updatePlugin, restorePlugin and installPlugins for every kind, addressed by id; the scanner entry points in inventory.ts are the same operations limited to the scanners section. requestedPluginSource turns an input into an exact source in one place and restorePluginPackage is the one body that restores a selection. Plugin commands answer plugin is not configured, scanner commands scanner is not configured.

Work source (items 1, 3, 12): loadWorkSource is deleted; configuredWorkSource is now checkWorkSourceReadiness and its comment says it imports the adapter and calls readiness(); WorkSourceSelection carries the adapter exactly when the status is found; WorkSourceSession is declared and documents that a session serves one watcher.

Welcome (items 4, 13): the unused adapter parameter is gone; the welcome reads the work source from the plugin settings it already loads, labels the row work source and prints it only when one is selected. Outside a Git repository the settings cannot be read, so that row is absent there.

groma init (items 2, 14): selecting the adapter is the injected selectBacklog dependency, reported like its sibling steps; the order is select, install the CLI, initialize; RepositoryInitResult.backlog distinguishes unselected, unavailable, unchanged, initialized and failed, and a selected adapter without its CLI is reported.

CLI (item 5): groma plugin prints ok and one tab-separated line with the kind first, like groma scanner; every command has a description; both command sets share runPluginCommand.

Adapter and names (items 15, 16): the Backlog adapter imports EMPTY_WORK_SOURCE from @groma/work-source and exports its factory and the default plugin only; the settings route is /plugin-settings, the server event plugin-settings, the welcome action id plugins.

Architecture records (item 19): work-sources, tui-scanner-settings, scanners-settings and package overviews corrected through groma edit; the scan pinned the adapter record to createBacklogPlugin.

Tests (item 20): the two parser tests say what they assert and also observe the writer refusing; two wizard tests cover choosing Backlog (select, install CLI, initialize, selection recorded) and a failed selection (reported, nothing installed, setup continues), both seen failing under the previous order.

Verification in this worktree: bun run typecheck passes; bunx biome lint reports 1 warning and 2 infos, as before the lane started, in unchanged files. Focused Bun tests pass: 62 across plugin, settings, selection, release and scanner module files; 90 across web startup, shell, export, chrome, terminal lifecycle, plain view and scan files; 64 with 12 toolchain skips across language scanner files. The plugin commands were exercised in a scratch project (add, list, second add, update, remove of unknown ids, install, both manifest errors, remove). The welcome screen and its Plugins action were read through tui-test and the web Plugins rows through a private headless Chromium over the renamed route. bun src/cli.ts scan ran; its only change is the adapter record's symbol. The full bun run check was not run in this lane.

Orchestrator verification, 11 October 2026, on main with Bun 1.4.3 merged: bun run check exit 0 (16 Node tests; 790 Bun tests passed, 52 skipped for missing optional toolchains, 0 failed). The task stays In Progress on purpose: acceptance criteria 3 and 5 and Definition of Done 1 need @groma/work-source and @groma/work-source-backlog on the public registry, which happens in the next release (first publication of a new package needs a manual npm publish and a trusted-publisher binding by the owner). Until then, choosing Backlog.md in groma init reports that the selection failed and setup continues. Known and left for the owner: plugin-generic modules still live under src/scanner/modules; an existing scanners.json is ignored without a message (repository rule: no migration).

CI correction, 11 October 2026: the staged-release test asserted the adapter instance after restore, which exists only when the Backlog CLI is installed on the machine, so it passed locally and failed on the CI runners. It now asserts the restored package version read from the cache; the adapter's own readiness is not part of that check. Verified on a PATH without the Backlog CLI.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Fixed PR #117 review findings: the existing release path stages and publishes both work-source packages with the adapter exact contract dependency, contracts before adapter, while init keeps npm-only selection. Shared package update preparation, direct configuration restore routing and small config/web label helpers remove duplication and complexity; loadWorkSource is retained for TASK-564. Real staged-package npm add/restore regression passed, focused checks passed, and full bun run check passed (16 Node, 780 Bun, 51 skipped, 0 failed). Both required reviews passed. Code is ready for a local review-fix commit. TASK-568 remains In Progress with AC3/AC5 and DoD1 pending the next actual package publication and public npm fresh-init verification. No packages, tags or remote changes were published.
<!-- SECTION:FINAL_SUMMARY:END -->
