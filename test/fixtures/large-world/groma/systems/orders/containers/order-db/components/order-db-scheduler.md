---
type: C4 Component
title: Order Db scheduler
status: stable
groma:
  id: order-db-scheduler
  parent: order-db
  code:
    - scanner: typescript
      file: src/orders/order-db/scheduler.ts
      symbol: scheduler
---

Order Db scheduler of Order Db.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/orders/order-db/scheduler.ts](../../../../../../src/orders/order-db/scheduler.ts) | [src/orders/order-db/metrics.ts](../../../../../../src/orders/order-db/metrics.ts) | Calls metrics | HTTP |
| [src/orders/order-db/scheduler.ts](../../../../../../src/orders/order-db/scheduler.ts) | [src/orders/order-db/config.ts](../../../../../../src/orders/order-db/config.ts) | Reads config | HTTP |
