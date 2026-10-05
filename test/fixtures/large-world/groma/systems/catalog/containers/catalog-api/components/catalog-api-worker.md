---
type: C4 Component
title: Catalog Api worker
status: stable
groma:
  id: catalog-api-worker
  parent: catalog-api
  group: Support
  code:
    - scanner: typescript
      file: src/catalog/catalog-api/worker.ts
      symbol: worker
    - scanner: typescript
      file: src/catalog/catalog-api/worker-1.ts
      symbol: worker
    - scanner: typescript
      file: src/catalog/catalog-api/worker-2.ts
      symbol: worker
    - scanner: typescript
      file: src/catalog/catalog-api/worker-3.ts
      symbol: worker
    - scanner: typescript
      file: src/catalog/catalog-api/worker-4.ts
      symbol: worker
---

Catalog Api worker of Catalog Api.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/catalog/catalog-api/worker.ts](../../../../../../src/catalog/catalog-api/worker.ts) | [src/catalog/catalog-api/scheduler.ts](../../../../../../src/catalog/catalog-api/scheduler.ts) | Calls scheduler | HTTP |
| [src/catalog/catalog-api/worker.ts](../../../../../../src/catalog/catalog-api/worker.ts) | [src/catalog/catalog-api/metrics.ts](../../../../../../src/catalog/catalog-api/metrics.ts) | Reads metrics | HTTP |
