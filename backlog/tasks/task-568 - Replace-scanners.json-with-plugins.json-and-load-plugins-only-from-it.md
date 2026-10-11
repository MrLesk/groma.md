---
id: TASK-568
title: Replace scanners.json with plugins.json and load plugins only from it
status: In Progress
assignee:
  - '@codex'
created_date: '2026-10-08 15:14'
updated_date: '2026-10-11 16:26'
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
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Fixed PR #117 review findings: the existing release path stages and publishes both work-source packages with the adapter exact contract dependency, contracts before adapter, while init keeps npm-only selection. Shared package update preparation, direct configuration restore routing and small config/web label helpers remove duplication and complexity; loadWorkSource is retained for TASK-564. Real staged-package npm add/restore regression passed, focused checks passed, and full bun run check passed (16 Node, 780 Bun, 51 skipped, 0 failed). Both required reviews passed. Code is ready for a local review-fix commit. TASK-568 remains In Progress with AC3/AC5 and DoD1 pending the next actual package publication and public npm fresh-init verification. No packages, tags or remote changes were published.
<!-- SECTION:FINAL_SUMMARY:END -->
