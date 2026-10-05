---
type: C4 Component
title: Order Service worker
status: stable
groma:
  id: order-service-worker
  parent: order-service
  group: Support
  code:
    - scanner: typescript
      file: src/orders/order-service/worker.ts
      symbol: worker
    - scanner: typescript
      file: src/orders/order-service/worker-1.ts
      symbol: worker
    - scanner: typescript
      file: src/orders/order-service/worker-2.ts
      symbol: worker
    - scanner: typescript
      file: src/orders/order-service/worker-3.ts
      symbol: worker
    - scanner: typescript
      file: src/orders/order-service/worker-4.ts
      symbol: worker
---

Order Service worker of Order Service.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/orders/order-service/worker.ts](../../../../../../src/orders/order-service/worker.ts) | [src/orders/order-service/scheduler.ts](../../../../../../src/orders/order-service/scheduler.ts) | Calls scheduler | HTTP |
| [src/orders/order-service/worker.ts](../../../../../../src/orders/order-service/worker.ts) | [src/orders/order-service/metrics.ts](../../../../../../src/orders/order-service/metrics.ts) | Reads metrics | HTTP |
