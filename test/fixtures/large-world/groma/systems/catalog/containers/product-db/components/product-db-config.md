---
type: C4 Component
title: Product Db config
status: stable
groma:
  id: product-db-config
  parent: product-db
  code:
    - scanner: typescript
      file: src/catalog/product-db/config.ts
      symbol: config
    - scanner: typescript
      file: src/catalog/product-db/config-1.ts
      symbol: config
    - scanner: typescript
      file: src/catalog/product-db/config-2.ts
      symbol: config
---

Product Db config of Product Db.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/catalog/product-db/config.ts](../../../../../../src/catalog/product-db/config.ts) | [src/catalog/product-db/logger.ts](../../../../../../src/catalog/product-db/logger.ts) | Calls logger | HTTP |
| [src/catalog/product-db/config.ts](../../../../../../src/catalog/product-db/config.ts) | [src/catalog/product-db/client.ts](../../../../../../src/catalog/product-db/client.ts) | Reads client | HTTP |
