---
type: C4 Component
title: Order Service queue
status: stable
groma:
  id: order-service-queue
  parent: order-service
  group: Support
  code:
    - scanner: typescript
      file: src/orders/order-service/queue.ts
      symbol: queue
    - scanner: typescript
      file: src/orders/order-service/queue-1.ts
      symbol: queue
    - scanner: typescript
      file: src/orders/order-service/queue-2.ts
      symbol: queue
    - scanner: typescript
      file: src/orders/order-service/queue-3.ts
      symbol: queue
---

Order Service queue of Order Service.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/orders/order-service/queue.ts](../../../../../../src/orders/order-service/queue.ts) | [src/orders/order-service/worker.ts](../../../../../../src/orders/order-service/worker.ts) | Calls worker | HTTP |
| [src/orders/order-service/queue.ts](../../../../../../src/orders/order-service/queue.ts) | [src/orders/order-service/scheduler.ts](../../../../../../src/orders/order-service/scheduler.ts) | Reads scheduler | HTTP |
