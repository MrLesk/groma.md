---
type: C4 Component
title: Worker
status: stable
groma:
  id: worker
  parent: api
  code:
    - scanner: typescript
      file: src/worker.ts
---

Completes a unit of work.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/worker.ts](../../../../../../src/worker.ts) | [src/entry.ts](../../../../../../src/entry.ts) | Reports progress | Callback |
