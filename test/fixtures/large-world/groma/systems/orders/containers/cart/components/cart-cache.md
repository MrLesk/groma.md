---
type: C4 Component
title: Cart cache
status: stable
groma:
  id: cart-cache
  parent: cart
  group: Core
  code:
    - scanner: typescript
      file: src/orders/cart/cache.ts
      symbol: cache
    - scanner: typescript
      file: src/orders/cart/cache-1.ts
      symbol: cache
    - scanner: typescript
      file: src/orders/cart/cache-2.ts
      symbol: cache
    - scanner: typescript
      file: src/orders/cart/cache-3.ts
      symbol: cache
---

Cart cache of Cart.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/orders/cart/cache.ts](../../../../../../src/orders/cart/cache.ts) | [src/orders/cart/validator.ts](../../../../../../src/orders/cart/validator.ts) | Calls validator | HTTP |
| [src/orders/cart/cache.ts](../../../../../../src/orders/cart/cache.ts) | [src/orders/cart/mapper.ts](../../../../../../src/orders/cart/mapper.ts) | Reads mapper | HTTP |
