---
type: C4 Component
title: Cart logger
status: stable
groma:
  id: cart-logger
  parent: cart
  code:
    - scanner: typescript
      file: src/orders/cart/logger.ts
      symbol: logger
    - scanner: typescript
      file: src/orders/cart/logger-1.ts
      symbol: logger
    - scanner: typescript
      file: src/orders/cart/logger-2.ts
      symbol: logger
    - scanner: typescript
      file: src/orders/cart/logger-3.ts
      symbol: logger
---

Cart logger of Cart.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/orders/cart/logger.ts](../../../../../../src/orders/cart/logger.ts) | [src/orders/cart/client.ts](../../../../../../src/orders/cart/client.ts) | Calls client | HTTP |
