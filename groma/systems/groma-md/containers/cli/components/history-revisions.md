---
type: C4 Component
title: Revision history
status: stable
groma:
  id: history-revisions
  parent: cli
  code:
    - scanner: typescript
      file: src/history/revisions.ts
    - scanner: typescript
      file: src/history/comparison.ts
    - scanner: typescript
      file: src/history/snapshots.ts
    - scanner: typescript
      file: src/history/code-metrics.ts
      symbol: readCodeHistory
  group: Architecture records
description: Reads Git revisions and component change counts without changing working files
---

Reads architecture revisions from Git and loads the selected revision for a viewer without changing the working files. For the live map, counts commits, distinct committers and shared commits touching currently owned component files within the requested history window.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/history/revisions.ts](../../../../../../src/history/revisions.ts) | [git](../../../../../externals/git.md) | Reads past revisions | Git CLI |
