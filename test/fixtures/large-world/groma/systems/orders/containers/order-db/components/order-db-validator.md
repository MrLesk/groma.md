---
type: C4 Component
title: Order Db validator
status: stable
groma:
  id: order-db-validator
  parent: order-db
  group: Core
  code:
    - scanner: typescript
      file: src/orders/order-db/validator.ts
      symbol: validator
    - scanner: typescript
      file: src/orders/order-db/validator-1.ts
      symbol: validator
    - scanner: typescript
      file: src/orders/order-db/validator-2.ts
      symbol: validator
    - scanner: typescript
      file: src/orders/order-db/validator-3.ts
      symbol: validator
    - scanner: typescript
      file: src/orders/order-db/validator-4.ts
      symbol: validator
---

Order Db validator of Order Db.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/orders/order-db/validator.ts](../../../../../../src/orders/order-db/validator.ts) | [src/orders/order-db/mapper.ts](../../../../../../src/orders/order-db/mapper.ts) | Calls mapper | HTTP |
| [src/orders/order-db/validator.ts](../../../../../../src/orders/order-db/validator.ts) | [src/orders/order-db/reader.ts](../../../../../../src/orders/order-db/reader.ts) | Reads reader | HTTP |
