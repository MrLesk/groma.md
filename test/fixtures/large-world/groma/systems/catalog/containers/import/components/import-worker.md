---
type: C4 Component
title: Import worker
status: stable
groma:
  id: import-worker
  parent: import
  group: Support
  code:
    - scanner: typescript
      file: src/catalog/import/worker.ts
      symbol: worker
    - scanner: typescript
      file: src/catalog/import/worker-1.ts
      symbol: worker
    - scanner: typescript
      file: src/catalog/import/worker-2.ts
      symbol: worker
    - scanner: typescript
      file: src/catalog/import/worker-3.ts
      symbol: worker
    - scanner: typescript
      file: src/catalog/import/worker-4.ts
      symbol: worker
---

Import worker of Import.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/catalog/import/worker.ts](../../../../../../src/catalog/import/worker.ts) | [src/catalog/import/scheduler.ts](../../../../../../src/catalog/import/scheduler.ts) | Calls scheduler | HTTP |
| [src/catalog/import/worker.ts](../../../../../../src/catalog/import/worker.ts) | [src/catalog/import/metrics.ts](../../../../../../src/catalog/import/metrics.ts) | Reads metrics | HTTP |
