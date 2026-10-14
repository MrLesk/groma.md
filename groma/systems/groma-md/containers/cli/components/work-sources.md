---
type: C4 Component
title: Work source loading
status: stable
groma:
  id: work-sources
  parent: cli
  group: Project work
  code:
    - scanner: typescript
      file: src/work/sources.ts
    - scanner: typescript
      file: src/work/backlog-cli.ts
description: Runs the bundled work source config.json lists and owns its live subscription
---

Holds the work sources that ship inside groma.md, today Backlog.md, by the id config.json lists them with. A listed work source is ready when its tool is installed at the listed version or newer; only then does it create its source, so a project without an entry runs no external CLI and gets empty task state. backlog-cli.ts installs or updates the Backlog.md CLI and initializes Backlog.md for groma init. Both viewers follow the selection through one session for task reads and the watch; when config.json or the settings change, the session closes the previous subscription before activating the current selection.
