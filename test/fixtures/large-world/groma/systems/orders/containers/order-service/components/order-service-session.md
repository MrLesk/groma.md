---
type: C4 Component
title: Order Service session
status: stable
groma:
  id: order-service-session
  parent: order-service
  group: Core
  code:
    - scanner: typescript
      file: src/orders/order-service/session.ts
      symbol: session
    - scanner: typescript
      file: src/orders/order-service/session-1.ts
      symbol: session
    - scanner: typescript
      file: src/orders/order-service/session-2.ts
      symbol: session
---

Order Service session of Order Service.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/orders/order-service/session.ts](../../../../../../src/orders/order-service/session.ts) | [src/orders/order-service/cache.ts](../../../../../../src/orders/order-service/cache.ts) | Calls cache | HTTP |
| [src/orders/order-service/session.ts](../../../../../../src/orders/order-service/session.ts) | [src/orders/order-service/validator.ts](../../../../../../src/orders/order-service/validator.ts) | Reads validator | HTTP |
