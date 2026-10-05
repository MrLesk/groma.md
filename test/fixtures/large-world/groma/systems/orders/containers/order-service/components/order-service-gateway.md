---
type: C4 Component
title: Order Service gateway
status: stable
groma:
  id: order-service-gateway
  parent: order-service
  group: Core
  code:
    - scanner: typescript
      file: src/orders/order-service/gateway.ts
      symbol: gateway
---

Order Service gateway of Order Service.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/orders/order-service/gateway.ts](../../../../../../src/orders/order-service/gateway.ts) | [src/orders/order-service/router.ts](../../../../../../src/orders/order-service/router.ts) | Calls router | HTTP |
| [src/orders/order-service/gateway.ts](../../../../../../src/orders/order-service/gateway.ts) | [src/orders/order-service/session.ts](../../../../../../src/orders/order-service/session.ts) | Reads session | HTTP |
| [src/orders/order-service/gateway.ts](../../../../../../src/orders/order-service/gateway.ts) | [src/orders/order-db/gateway.ts](../../../../../../src/orders/order-db/gateway.ts) | Forwards requests | HTTP |
