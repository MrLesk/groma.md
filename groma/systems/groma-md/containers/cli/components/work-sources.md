---
type: C4 Component
title: Work source loading
status: stable
groma:
  id: work-sources
  parent: cli
  code:
    - scanner: typescript
      file: src/work-sources.ts
  group: Project work
description: Loads the configured task adapter and owns its live subscription
---

Reads the single work-source selection from plugins.json and resolves its package without downloading anything. In this order it checks that the package accepts this groma.md version, imports the adapter, asks the adapter for its readiness, and only then lets a ready adapter create its source. The welcome screen, the plugin settings and the plugin list read that readiness; both viewers follow the selection through one session for task reads and the watch. A project without a selection, or with one that is not ready, gets empty task state and no external CLI runs. When plugins.json or the settings change, the session closes the previous subscription before activating the current selection.
