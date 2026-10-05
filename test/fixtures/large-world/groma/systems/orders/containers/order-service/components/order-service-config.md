---
type: C4 Component
title: Order Service config
status: stable
groma:
  id: order-service-config
  parent: order-service
  code:
    - scanner: typescript
      file: src/orders/order-service/config.ts
      symbol: config
    - scanner: typescript
      file: src/orders/order-service/config-1.ts
      symbol: config
    - scanner: typescript
      file: src/orders/order-service/config-2.ts
      symbol: config
---

Order Service config of Order Service.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/orders/order-service/config.ts](../../../../../../src/orders/order-service/config.ts) | [src/orders/order-service/logger.ts](../../../../../../src/orders/order-service/logger.ts) | Calls logger | HTTP |
| [src/orders/order-service/config.ts](../../../../../../src/orders/order-service/config.ts) | [src/orders/order-service/client.ts](../../../../../../src/orders/order-service/client.ts) | Reads client | HTTP |
