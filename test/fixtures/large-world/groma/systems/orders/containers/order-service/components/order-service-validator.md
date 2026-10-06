---
type: C4 Component
title: Order Service validator
status: stable
groma:
  id: order-service-validator
  parent: order-service
  group: Core
  code:
    - scanner: typescript
      file: src/orders/order-service/validator.ts
      symbol: validator
    - scanner: typescript
      file: src/orders/order-service/validator-1.ts
      symbol: validator
    - scanner: typescript
      file: src/orders/order-service/validator-2.ts
      symbol: validator
    - scanner: typescript
      file: src/orders/order-service/validator-3.ts
      symbol: validator
    - scanner: typescript
      file: src/orders/order-service/validator-4.ts
      symbol: validator
---

Order Service validator of Order Service.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/orders/order-service/validator.ts](../../../../../../src/orders/order-service/validator.ts) | [src/orders/order-service/mapper.ts](../../../../../../src/orders/order-service/mapper.ts) | Calls mapper | HTTP |
| [src/orders/order-service/validator.ts](../../../../../../src/orders/order-service/validator.ts) | [src/orders/order-service/reader.ts](../../../../../../src/orders/order-service/reader.ts) | Reads reader | HTTP |
