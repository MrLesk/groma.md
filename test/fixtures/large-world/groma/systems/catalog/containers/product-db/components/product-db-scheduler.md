---
type: C4 Component
title: Product Db scheduler
status: stable
groma:
  id: product-db-scheduler
  parent: product-db
  code:
    - scanner: typescript
      file: src/catalog/product-db/scheduler.ts
      symbol: scheduler
---

Product Db scheduler of Product Db.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/catalog/product-db/scheduler.ts](../../../../../../src/catalog/product-db/scheduler.ts) | [src/catalog/product-db/metrics.ts](../../../../../../src/catalog/product-db/metrics.ts) | Calls metrics | HTTP |
| [src/catalog/product-db/scheduler.ts](../../../../../../src/catalog/product-db/scheduler.ts) | [src/catalog/product-db/config.ts](../../../../../../src/catalog/product-db/config.ts) | Reads config | HTTP |
