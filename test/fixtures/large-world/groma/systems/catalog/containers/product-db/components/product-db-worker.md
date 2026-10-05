---
type: C4 Component
title: Product Db worker
status: stable
groma:
  id: product-db-worker
  parent: product-db
  group: Support
  code:
    - scanner: typescript
      file: src/catalog/product-db/worker.ts
      symbol: worker
    - scanner: typescript
      file: src/catalog/product-db/worker-1.ts
      symbol: worker
    - scanner: typescript
      file: src/catalog/product-db/worker-2.ts
      symbol: worker
    - scanner: typescript
      file: src/catalog/product-db/worker-3.ts
      symbol: worker
    - scanner: typescript
      file: src/catalog/product-db/worker-4.ts
      symbol: worker
---

Product Db worker of Product Db.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/catalog/product-db/worker.ts](../../../../../../src/catalog/product-db/worker.ts) | [src/catalog/product-db/scheduler.ts](../../../../../../src/catalog/product-db/scheduler.ts) | Calls scheduler | HTTP |
| [src/catalog/product-db/worker.ts](../../../../../../src/catalog/product-db/worker.ts) | [src/catalog/product-db/metrics.ts](../../../../../../src/catalog/product-db/metrics.ts) | Reads metrics | HTTP |
