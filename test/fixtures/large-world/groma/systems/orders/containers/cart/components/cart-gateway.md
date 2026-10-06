---
type: C4 Component
title: Cart gateway
status: stable
groma:
  id: cart-gateway
  parent: cart
  group: Core
  code:
    - scanner: typescript
      file: src/orders/cart/gateway.ts
      symbol: gateway
---

Cart gateway of Cart.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/orders/cart/gateway.ts](../../../../../../src/orders/cart/gateway.ts) | [src/orders/cart/router.ts](../../../../../../src/orders/cart/router.ts) | Calls router | HTTP |
| [src/orders/cart/gateway.ts](../../../../../../src/orders/cart/gateway.ts) | [src/orders/cart/session.ts](../../../../../../src/orders/cart/session.ts) | Reads session | HTTP |
| [src/orders/cart/gateway.ts](../../../../../../src/orders/cart/gateway.ts) | [src/orders/order-service/gateway.ts](../../../../../../src/orders/order-service/gateway.ts) | Forwards requests | HTTP |
