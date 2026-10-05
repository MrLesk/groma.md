---
type: C4 Component
title: Product Db queue
status: stable
groma:
  id: product-db-queue
  parent: product-db
  group: Support
  code:
    - scanner: typescript
      file: src/catalog/product-db/queue.ts
      symbol: queue
    - scanner: typescript
      file: src/catalog/product-db/queue-1.ts
      symbol: queue
    - scanner: typescript
      file: src/catalog/product-db/queue-2.ts
      symbol: queue
    - scanner: typescript
      file: src/catalog/product-db/queue-3.ts
      symbol: queue
---

Product Db queue of Product Db.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/catalog/product-db/queue.ts](../../../../../../src/catalog/product-db/queue.ts) | [src/catalog/product-db/worker.ts](../../../../../../src/catalog/product-db/worker.ts) | Calls worker | HTTP |
| [src/catalog/product-db/queue.ts](../../../../../../src/catalog/product-db/queue.ts) | [src/catalog/product-db/scheduler.ts](../../../../../../src/catalog/product-db/scheduler.ts) | Reads scheduler | HTTP |
