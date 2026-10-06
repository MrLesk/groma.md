---
type: C4 Component
title: Product Db cache
status: stable
groma:
  id: product-db-cache
  parent: product-db
  group: Core
  code:
    - scanner: typescript
      file: src/catalog/product-db/cache.ts
      symbol: cache
    - scanner: typescript
      file: src/catalog/product-db/cache-1.ts
      symbol: cache
    - scanner: typescript
      file: src/catalog/product-db/cache-2.ts
      symbol: cache
    - scanner: typescript
      file: src/catalog/product-db/cache-3.ts
      symbol: cache
---

Product Db cache of Product Db.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/catalog/product-db/cache.ts](../../../../../../src/catalog/product-db/cache.ts) | [src/catalog/product-db/validator.ts](../../../../../../src/catalog/product-db/validator.ts) | Calls validator | HTTP |
| [src/catalog/product-db/cache.ts](../../../../../../src/catalog/product-db/cache.ts) | [src/catalog/product-db/mapper.ts](../../../../../../src/catalog/product-db/mapper.ts) | Reads mapper | HTTP |
