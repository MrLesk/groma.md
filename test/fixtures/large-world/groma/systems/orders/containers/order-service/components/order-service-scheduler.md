---
type: C4 Component
title: Order Service scheduler
status: stable
groma:
  id: order-service-scheduler
  parent: order-service
  code:
    - scanner: typescript
      file: src/orders/order-service/scheduler.ts
      symbol: scheduler
---

Order Service scheduler of Order Service.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/orders/order-service/scheduler.ts](../../../../../../src/orders/order-service/scheduler.ts) | [src/orders/order-service/metrics.ts](../../../../../../src/orders/order-service/metrics.ts) | Calls metrics | HTTP |
| [src/orders/order-service/scheduler.ts](../../../../../../src/orders/order-service/scheduler.ts) | [src/orders/order-service/config.ts](../../../../../../src/orders/order-service/config.ts) | Reads config | HTTP |
