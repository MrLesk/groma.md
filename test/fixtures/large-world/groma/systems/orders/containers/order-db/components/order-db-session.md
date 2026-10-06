---
type: C4 Component
title: Order Db session
status: stable
groma:
  id: order-db-session
  parent: order-db
  group: Core
  code:
    - scanner: typescript
      file: src/orders/order-db/session.ts
      symbol: session
    - scanner: typescript
      file: src/orders/order-db/session-1.ts
      symbol: session
    - scanner: typescript
      file: src/orders/order-db/session-2.ts
      symbol: session
---

Order Db session of Order Db.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/orders/order-db/session.ts](../../../../../../src/orders/order-db/session.ts) | [src/orders/order-db/cache.ts](../../../../../../src/orders/order-db/cache.ts) | Calls cache | HTTP |
| [src/orders/order-db/session.ts](../../../../../../src/orders/order-db/session.ts) | [src/orders/order-db/validator.ts](../../../../../../src/orders/order-db/validator.ts) | Reads validator | HTTP |
