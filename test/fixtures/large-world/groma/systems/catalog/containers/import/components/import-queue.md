---
type: C4 Component
title: Import queue
status: stable
groma:
  id: import-queue
  parent: import
  group: Support
  code:
    - scanner: typescript
      file: src/catalog/import/queue.ts
      symbol: queue
    - scanner: typescript
      file: src/catalog/import/queue-1.ts
      symbol: queue
    - scanner: typescript
      file: src/catalog/import/queue-2.ts
      symbol: queue
    - scanner: typescript
      file: src/catalog/import/queue-3.ts
      symbol: queue
---

Import queue of Import.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/catalog/import/queue.ts](../../../../../../src/catalog/import/queue.ts) | [src/catalog/import/worker.ts](../../../../../../src/catalog/import/worker.ts) | Calls worker | HTTP |
| [src/catalog/import/queue.ts](../../../../../../src/catalog/import/queue.ts) | [src/catalog/import/scheduler.ts](../../../../../../src/catalog/import/scheduler.ts) | Reads scheduler | HTTP |
