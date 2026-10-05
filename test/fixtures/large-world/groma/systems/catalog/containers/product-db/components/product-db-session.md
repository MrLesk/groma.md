---
type: C4 Component
title: Product Db session
status: stable
groma:
  id: product-db-session
  parent: product-db
  group: Core
  code:
    - scanner: typescript
      file: src/catalog/product-db/session.ts
      symbol: session
    - scanner: typescript
      file: src/catalog/product-db/session-1.ts
      symbol: session
    - scanner: typescript
      file: src/catalog/product-db/session-2.ts
      symbol: session
---

Product Db session of Product Db.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/catalog/product-db/session.ts](../../../../../../src/catalog/product-db/session.ts) | [src/catalog/product-db/cache.ts](../../../../../../src/catalog/product-db/cache.ts) | Calls cache | HTTP |
| [src/catalog/product-db/session.ts](../../../../../../src/catalog/product-db/session.ts) | [src/catalog/product-db/validator.ts](../../../../../../src/catalog/product-db/validator.ts) | Reads validator | HTTP |
