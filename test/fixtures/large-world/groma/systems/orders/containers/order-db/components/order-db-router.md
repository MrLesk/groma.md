---
type: C4 Component
title: Order Db router
status: stable
groma:
  id: order-db-router
  parent: order-db
  group: Core
  code:
    - scanner: typescript
      file: src/orders/order-db/router.ts
      symbol: router
    - scanner: typescript
      file: src/orders/order-db/router-1.ts
      symbol: router
---

Order Db router of Order Db.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/orders/order-db/router.ts](../../../../../../src/orders/order-db/router.ts) | [src/orders/order-db/session.ts](../../../../../../src/orders/order-db/session.ts) | Calls session | HTTP |
| [src/orders/order-db/router.ts](../../../../../../src/orders/order-db/router.ts) | [src/orders/order-db/cache.ts](../../../../../../src/orders/order-db/cache.ts) | Reads cache | HTTP |
