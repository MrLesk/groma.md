---
type: C4 Component
title: Checkout validator
status: stable
groma:
  id: checkout-validator
  parent: checkout
  group: Core
  code:
    - scanner: typescript
      file: src/orders/checkout/validator.ts
      symbol: validator
    - scanner: typescript
      file: src/orders/checkout/validator-1.ts
      symbol: validator
    - scanner: typescript
      file: src/orders/checkout/validator-2.ts
      symbol: validator
    - scanner: typescript
      file: src/orders/checkout/validator-3.ts
      symbol: validator
    - scanner: typescript
      file: src/orders/checkout/validator-4.ts
      symbol: validator
---

Checkout validator of Checkout.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/orders/checkout/validator.ts](../../../../../../src/orders/checkout/validator.ts) | [src/orders/checkout/mapper.ts](../../../../../../src/orders/checkout/mapper.ts) | Calls mapper | HTTP |
| [src/orders/checkout/validator.ts](../../../../../../src/orders/checkout/validator.ts) | [src/orders/checkout/reader.ts](../../../../../../src/orders/checkout/reader.ts) | Reads reader | HTTP |
