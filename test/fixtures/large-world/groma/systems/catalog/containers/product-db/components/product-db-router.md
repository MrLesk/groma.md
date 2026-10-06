---
type: C4 Component
title: Product Db router
status: stable
groma:
  id: product-db-router
  parent: product-db
  group: Core
  code:
    - scanner: typescript
      file: src/catalog/product-db/router.ts
      symbol: router
    - scanner: typescript
      file: src/catalog/product-db/router-1.ts
      symbol: router
---

Product Db router of Product Db.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/catalog/product-db/router.ts](../../../../../../src/catalog/product-db/router.ts) | [src/catalog/product-db/session.ts](../../../../../../src/catalog/product-db/session.ts) | Calls session | HTTP |
| [src/catalog/product-db/router.ts](../../../../../../src/catalog/product-db/router.ts) | [src/catalog/product-db/cache.ts](../../../../../../src/catalog/product-db/cache.ts) | Reads cache | HTTP |
