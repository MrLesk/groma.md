---
type: C4 Component
title: Cart router
status: stable
groma:
  id: cart-router
  parent: cart
  group: Core
  code:
    - scanner: typescript
      file: src/orders/cart/router.ts
      symbol: router
    - scanner: typescript
      file: src/orders/cart/router-1.ts
      symbol: router
---

Cart router of Cart.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/orders/cart/router.ts](../../../../../../src/orders/cart/router.ts) | [src/orders/cart/session.ts](../../../../../../src/orders/cart/session.ts) | Calls session | HTTP |
| [src/orders/cart/router.ts](../../../../../../src/orders/cart/router.ts) | [src/orders/cart/cache.ts](../../../../../../src/orders/cart/cache.ts) | Reads cache | HTTP |
