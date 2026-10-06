---
type: C4 Component
title: Order Service metrics
status: stable
groma:
  id: order-service-metrics
  parent: order-service
  code:
    - scanner: typescript
      file: src/orders/order-service/metrics.ts
      symbol: metrics
    - scanner: typescript
      file: src/orders/order-service/metrics-1.ts
      symbol: metrics
---

Order Service metrics of Order Service.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/orders/order-service/metrics.ts](../../../../../../src/orders/order-service/metrics.ts) | [src/orders/order-service/config.ts](../../../../../../src/orders/order-service/config.ts) | Calls config | HTTP |
| [src/orders/order-service/metrics.ts](../../../../../../src/orders/order-service/metrics.ts) | [src/orders/order-service/logger.ts](../../../../../../src/orders/order-service/logger.ts) | Reads logger | HTTP |
