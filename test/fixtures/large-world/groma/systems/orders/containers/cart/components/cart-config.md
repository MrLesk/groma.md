---
type: C4 Component
title: Cart config
status: stable
groma:
  id: cart-config
  parent: cart
  code:
    - scanner: typescript
      file: src/orders/cart/config.ts
      symbol: config
    - scanner: typescript
      file: src/orders/cart/config-1.ts
      symbol: config
    - scanner: typescript
      file: src/orders/cart/config-2.ts
      symbol: config
---

Cart config of Cart.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/orders/cart/config.ts](../../../../../../src/orders/cart/config.ts) | [src/orders/cart/logger.ts](../../../../../../src/orders/cart/logger.ts) | Calls logger | HTTP |
| [src/orders/cart/config.ts](../../../../../../src/orders/cart/config.ts) | [src/orders/cart/client.ts](../../../../../../src/orders/cart/client.ts) | Reads client | HTTP |
