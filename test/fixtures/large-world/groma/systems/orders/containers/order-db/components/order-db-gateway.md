---
type: C4 Component
title: Order Db gateway
status: stable
groma:
  id: order-db-gateway
  parent: order-db
  group: Core
  code:
    - scanner: typescript
      file: src/orders/order-db/gateway.ts
      symbol: gateway
---

Order Db gateway of Order Db.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/orders/order-db/gateway.ts](../../../../../../src/orders/order-db/gateway.ts) | [src/orders/order-db/router.ts](../../../../../../src/orders/order-db/router.ts) | Calls router | HTTP |
| [src/orders/order-db/gateway.ts](../../../../../../src/orders/order-db/gateway.ts) | [src/orders/order-db/session.ts](../../../../../../src/orders/order-db/session.ts) | Reads session | HTTP |
| [src/orders/order-db/gateway.ts](../../../../../../src/orders/order-db/gateway.ts) | [src/orders/events/gateway.ts](../../../../../../src/orders/events/gateway.ts) | Forwards requests | HTTP |
