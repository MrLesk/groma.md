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

Reads the single work-source selection from plugins.json. Resolves its package and checks the Groma version and adapter readiness before importing and creating it. Both viewers use this boundary for task reads and watches; a missing selection produces empty task state without invoking an external CLI. Settings changes and configuration updates close the previous subscription before activating the current selection.
