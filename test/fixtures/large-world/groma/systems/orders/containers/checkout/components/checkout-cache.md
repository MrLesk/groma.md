---
type: C4 Component
title: Checkout cache
status: stable
groma:
  id: checkout-cache
  parent: checkout
  group: Core
  code:
    - scanner: typescript
      file: src/orders/checkout/cache.ts
      symbol: cache
    - scanner: typescript
      file: src/orders/checkout/cache-1.ts
      symbol: cache
    - scanner: typescript
      file: src/orders/checkout/cache-2.ts
      symbol: cache
    - scanner: typescript
      file: src/orders/checkout/cache-3.ts
      symbol: cache
---

Checkout cache of Checkout.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/orders/checkout/cache.ts](../../../../../../src/orders/checkout/cache.ts) | [src/orders/checkout/validator.ts](../../../../../../src/orders/checkout/validator.ts) | Calls validator | HTTP |
| [src/orders/checkout/cache.ts](../../../../../../src/orders/checkout/cache.ts) | [src/orders/checkout/mapper.ts](../../../../../../src/orders/checkout/mapper.ts) | Reads mapper | HTTP |
