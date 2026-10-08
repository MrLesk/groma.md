---
id: TASK-568
title: Replace scanners.json with plugins.json and load plugins only from it
status: To Do
assignee: []
created_date: '2026-10-08 15:14'
updated_date: '2026-10-08 15:31'
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
- [ ] #1 <groma-root>/plugins.json holds a scanners and a workSources section; scanner entries keep today's fields and validation, plugin ids are lowercase kebab-case, and the format is documented.
- [ ] #2 No plugin loads without an entry: with no workSources entry, groma.md never runs the Backlog.md CLI, even when it is on the PATH, and a second work-source entry is refused with a clear message.
- [ ] #3 A listed work source resolves from npm, a local folder or git, reports found, missing or blocked with a reason, passes the groma.md version check, and is installed or restored when missing the same way a missing scanner is; the Backlog adapter's readiness also reports whether the backlog CLI is present and how to install it.
- [ ] #4 groma plugin add, list, remove, install and update manage scanners and work sources; groma scanner add and the other scanner commands keep working; the web and terminal settings list plugins by kind.
- [ ] #5 Choosing Backlog.md during groma init adds the work source to plugins.json, nothing reads scanners.json any more, and this repository's groma/plugins.json lists its scanners and the Backlog work source.
- [ ] #6 Docs, agent guides and .github/workflows/architecture.yml refer to plugins.json.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Acceptance criteria have objective verification evidence.
- [ ] #2 Relevant checks pass and changes remain task-scoped.
- [ ] #3 Public contracts or documentation are updated when behavior changes.
- [ ] #4 Implementation Plan reflects the final approach; correction history and verification are recorded in Implementation Notes.
<!-- DOD:END -->
