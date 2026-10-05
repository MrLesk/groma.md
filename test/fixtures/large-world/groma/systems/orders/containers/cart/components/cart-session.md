---
type: C4 Component
title: Cart session
status: stable
groma:
  id: cart-session
  parent: cart
  group: Core
  code:
    - scanner: typescript
      file: src/orders/cart/session.ts
      symbol: session
    - scanner: typescript
      file: src/orders/cart/session-1.ts
      symbol: session
    - scanner: typescript
      file: src/orders/cart/session-2.ts
      symbol: session
---

Cart session of Cart.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/orders/cart/session.ts](../../../../../../src/orders/cart/session.ts) | [src/orders/cart/cache.ts](../../../../../../src/orders/cart/cache.ts) | Calls cache | HTTP |
| [src/orders/cart/session.ts](../../../../../../src/orders/cart/session.ts) | [src/orders/cart/validator.ts](../../../../../../src/orders/cart/validator.ts) | Reads validator | HTTP |
