---
id: TASK-568
title: >-
  Replace scanners.json with config.json and restore its plugins on another
  computer
status: In Progress
assignee:
  - '@claude'
created_date: '2026-10-08 15:14'
updated_date: '2026-10-14 17:57'
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
- [ ] #5 The plugins screen in the web and terminal viewers lists plugins by kind. Its Add offers the bundled plugins the project does not list yet, besides a source field; adding one writes its entry and restores it.
- [ ] #6 Only when a plugin of any kind that config.json lists is not present, `groma web` opens on a restore view in the style of its setup wizard. It lists the missing plugins and asks for confirmation. Restore installs them with a loading indicator per item, shows each result or failure reason, then opens the map. Proceed without them opens the map read-only, the way a historical view is: no scan runs and nothing can be edited. If a plugin is still missing after Restore, the map also opens read-only.
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
To be written after researching the branch merged with main.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Redesigned on 2026-10-14 with Alex; the description lists his decisions. The earlier implementation on this branch (plugins.json, the Backlog adapter as a published package, separate scanner and plugin commands) is the starting point; its review history is in the branch's commits.
<!-- SECTION:NOTES:END -->
