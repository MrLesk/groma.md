---
type: C4 Component
title: Order Service router
status: stable
groma:
  id: order-service-router
  parent: order-service
  group: Core
  code:
    - scanner: typescript
      file: src/orders/order-service/router.ts
      symbol: router
    - scanner: typescript
      file: src/orders/order-service/router-1.ts
      symbol: router
---

Order Service router of Order Service.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/orders/order-service/router.ts](../../../../../../src/orders/order-service/router.ts) | [src/orders/order-service/session.ts](../../../../../../src/orders/order-service/session.ts) | Calls session | HTTP |
| [src/orders/order-service/router.ts](../../../../../../src/orders/order-service/router.ts) | [src/orders/order-service/cache.ts](../../../../../../src/orders/order-service/cache.ts) | Reads cache | HTTP |
