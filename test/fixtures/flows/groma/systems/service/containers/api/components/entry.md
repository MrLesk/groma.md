---
type: C4 Component
title: Entry
status: stable
groma:
  id: entry
  parent: api
  code:
    - scanner: typescript
      file: src/entry.ts
---

Coordinates a request.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/entry.ts](../../../../../../src/entry.ts) | [src/worker.ts](../../../../../../src/worker.ts) | Dispatches work | Function call |
| [Entry](entry.md "entry") | [Journal](../../../../../externals/journal.md "journal") | Records activity | HTTP |
