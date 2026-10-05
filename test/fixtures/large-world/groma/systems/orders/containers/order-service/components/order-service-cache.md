---
type: C4 Component
title: Order Service cache
status: stable
groma:
  id: order-service-cache
  parent: order-service
  group: Core
  code:
    - scanner: typescript
      file: src/orders/order-service/cache.ts
      symbol: cache
    - scanner: typescript
      file: src/orders/order-service/cache-1.ts
      symbol: cache
    - scanner: typescript
      file: src/orders/order-service/cache-2.ts
      symbol: cache
    - scanner: typescript
      file: src/orders/order-service/cache-3.ts
      symbol: cache
---

Order Service cache of Order Service.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/orders/order-service/cache.ts](../../../../../../src/orders/order-service/cache.ts) | [src/orders/order-service/validator.ts](../../../../../../src/orders/order-service/validator.ts) | Calls validator | HTTP |
| [src/orders/order-service/cache.ts](../../../../../../src/orders/order-service/cache.ts) | [src/orders/order-service/mapper.ts](../../../../../../src/orders/order-service/mapper.ts) | Reads mapper | HTTP |
