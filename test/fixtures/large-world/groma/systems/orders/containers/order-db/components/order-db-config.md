---
type: C4 Component
title: Order Db config
status: stable
groma:
  id: order-db-config
  parent: order-db
  code:
    - scanner: typescript
      file: src/orders/order-db/config.ts
      symbol: config
    - scanner: typescript
      file: src/orders/order-db/config-1.ts
      symbol: config
    - scanner: typescript
      file: src/orders/order-db/config-2.ts
      symbol: config
---

Order Db config of Order Db.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/orders/order-db/config.ts](../../../../../../src/orders/order-db/config.ts) | [src/orders/order-db/logger.ts](../../../../../../src/orders/order-db/logger.ts) | Calls logger | HTTP |
| [src/orders/order-db/config.ts](../../../../../../src/orders/order-db/config.ts) | [src/orders/order-db/client.ts](../../../../../../src/orders/order-db/client.ts) | Reads client | HTTP |
