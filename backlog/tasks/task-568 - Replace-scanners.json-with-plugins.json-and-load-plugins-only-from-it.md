---
id: TASK-568
title: Replace scanners.json with plugins.json and load plugins only from it
status: Done
assignee:
  - '@codex'
created_date: '2026-10-08 15:14'
updated_date: '2026-10-09 08:04'
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
- [x] #3 A listed work source resolves from npm, a local folder or git, reports found, missing or blocked with a reason, passes the groma.md version check, and is installed or restored when missing the same way a missing scanner is; the Backlog adapter's readiness also reports whether the backlog CLI is present and how to install it.
- [x] #4 groma plugin add, list, remove, install and update manage scanners and work sources; groma scanner add and the other scanner commands keep working; the web and terminal settings list plugins by kind.
- [x] #5 Choosing Backlog.md during groma init adds the work source to plugins.json, nothing reads scanners.json any more, and this repository's groma/plugins.json lists its scanners and the Backlog work source.
- [x] #6 Docs, agent guides and .github/workflows/architecture.yml refer to plugins.json.
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
1. Replace the configuration filename with plugins.json and validate explicit scanner and work-source selections, preserving scanner fields. 2. Share scanner source resolution, package installation and release compatibility with work sources; load only configured work sources. 3. Add plugin management commands, connect init and both viewers, and group settings by plugin kind. 4. Convert repository configuration, fixtures, documentation and CI references. 5. Inspect supported flows and diffs without installs, builds or tests as requested; scan and curate task-owned architecture changes. Existing tests cover scanner configuration and package lifecycle; adapt filename expectations. Add focused coverage only for explicit work-source loading, selection cardinality and compatibility, whose absence currently permits implicit Backlog execution.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Inspected existing scanner compatibility and Backlog lifecycle coverage. Added one concurrent fixture-based test file for the new selection boundary: an absent entry must produce no adapter read/watch calls, removing a selection closes its watch, host-version mismatch must prevent import, and a second entry must be refused. Existing tests did not cover host-side work-source selection. Tests remain unexecuted under the stage instruction.

Cold simplicity review identified one supported lifecycle gap: restoring a work-source package or retrying after CLI installation must activate the open viewer even when no architecture file changes. Added a shared settings-session callback to reconfigure both viewer work sources after successful settings actions. Corrected old UI labels in the setup documentation. Read-only CLI verification: plugin list reports TypeScript and Backlog found; scanner list remains operational; scanner settings JSON includes Backlog readiness; plugin help exposes add/list/remove/install/update. No installs, builds or tests run.

Configuration and format documentation are converted, repository plugins.json explicitly lists Backlog and TypeScript, and CLI inspection confirms both selected kinds and scanner-command continuity. Source CLI scan succeeded: created 0, refreshed 112, matched 0. git diff --check passed. UI grouping and init opt-in paths reviewed statically; interactive checks, package downloads and test execution remain excluded by the user. External MrLesk/groma.md-action contents could not be retrieved, so its old-filename use remains unverified.

Implementer specification/quality review: all six requested changes are represented and scoped to explicit plugin loading; scanner configuration preserves include/exclude/settings; no compatibility file reader was added. Junior-developer flow is CLI/settings -> package selection -> configured work-source readiness -> viewer-owned read/watch. Three source modules cover command registration, shared package lifecycle, and work-source loading; command and lifecycle modules are folded into existing architecture owners. Cold simplicity re-review closed both reported findings. Runtime verification is limited to read-only CLI commands and scan; automated and interactive tests remain unrun per instruction.

Final full-context complexity review found no material issues or further simplification. Final source CLI scan completed successfully: created 0, refreshed 108, matched 0, with 38 repository findings reported for separate lint review. Curated ownership survived the rescan. All task-owned scanner-written paths were recorded. Definition-of-Done automated/interactive verification remains intentionally unchecked because installs, builds and tests were prohibited.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Replaced scanners.json with explicit plugins.json selection, added work-source package resolution/readiness and plugin management commands, made Backlog opt-in across init/welcome/viewers, grouped settings by kind, and updated docs, fixtures and CI. Read-only plugin/scanner commands and architecture scans succeeded; git diff --check passed. New selection/lifecycle regression tests were written but not run, per stage instructions. No installs, builds, commits or status changes. External MrLesk/groma.md-action could not be inspected; its filename usage remains unverified.
<!-- SECTION:FINAL_SUMMARY:END -->
