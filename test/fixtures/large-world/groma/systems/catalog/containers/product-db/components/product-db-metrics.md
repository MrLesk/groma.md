---
type: C4 Component
title: Product Db metrics
status: stable
groma:
  id: product-db-metrics
  parent: product-db
  code:
    - scanner: typescript
      file: src/catalog/product-db/metrics.ts
      symbol: metrics
    - scanner: typescript
      file: src/catalog/product-db/metrics-1.ts
      symbol: metrics
---

Product Db metrics of Product Db.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/catalog/product-db/metrics.ts](../../../../../../src/catalog/product-db/metrics.ts) | [src/catalog/product-db/config.ts](../../../../../../src/catalog/product-db/config.ts) | Calls config | HTTP |
| [src/catalog/product-db/metrics.ts](../../../../../../src/catalog/product-db/metrics.ts) | [src/catalog/product-db/logger.ts](../../../../../../src/catalog/product-db/logger.ts) | Reads logger | HTTP |
