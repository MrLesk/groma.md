---
type: C4 Component
title: Product Db gateway
status: stable
groma:
  id: product-db-gateway
  parent: product-db
  group: Core
  code:
    - scanner: typescript
      file: src/catalog/product-db/gateway.ts
      symbol: gateway
---

Product Db gateway of Product Db.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/catalog/product-db/gateway.ts](../../../../../../src/catalog/product-db/gateway.ts) | [src/catalog/product-db/router.ts](../../../../../../src/catalog/product-db/router.ts) | Calls router | HTTP |
| [src/catalog/product-db/gateway.ts](../../../../../../src/catalog/product-db/gateway.ts) | [src/catalog/product-db/session.ts](../../../../../../src/catalog/product-db/session.ts) | Reads session | HTTP |
| [src/catalog/product-db/gateway.ts](../../../../../../src/catalog/product-db/gateway.ts) | [src/catalog/import/gateway.ts](../../../../../../src/catalog/import/gateway.ts) | Forwards requests | HTTP |
