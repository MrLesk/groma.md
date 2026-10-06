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
  group: Architecture records
description: Loads Git snapshots of architecture without changing working files
---

Reads architecture revisions from Git. Loads the selected revision for a viewer without changing the working files.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/history/revisions.ts](../../../../../../src/history/revisions.ts) | [git](../../../../../externals/git.md) | Reads past revisions | Git CLI |
