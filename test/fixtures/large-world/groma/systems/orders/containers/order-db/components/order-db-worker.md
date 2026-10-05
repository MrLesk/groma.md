---
type: C4 Component
title: Order Db worker
status: stable
groma:
  id: order-db-worker
  parent: order-db
  group: Support
  code:
    - scanner: typescript
      file: src/orders/order-db/worker.ts
      symbol: worker
    - scanner: typescript
      file: src/orders/order-db/worker-1.ts
      symbol: worker
    - scanner: typescript
      file: src/orders/order-db/worker-2.ts
      symbol: worker
    - scanner: typescript
      file: src/orders/order-db/worker-3.ts
      symbol: worker
    - scanner: typescript
      file: src/orders/order-db/worker-4.ts
      symbol: worker
---

Order Db worker of Order Db.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/orders/order-db/worker.ts](../../../../../../src/orders/order-db/worker.ts) | [src/orders/order-db/scheduler.ts](../../../../../../src/orders/order-db/scheduler.ts) | Calls scheduler | HTTP |
| [src/orders/order-db/worker.ts](../../../../../../src/orders/order-db/worker.ts) | [src/orders/order-db/metrics.ts](../../../../../../src/orders/order-db/metrics.ts) | Reads metrics | HTTP |
