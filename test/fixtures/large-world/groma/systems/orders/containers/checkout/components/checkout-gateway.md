---
type: C4 Component
title: Checkout gateway
status: stable
groma:
  id: checkout-gateway
  parent: checkout
  group: Core
  code:
    - scanner: typescript
      file: src/orders/checkout/gateway.ts
      symbol: gateway
---

Checkout gateway of Checkout.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/orders/checkout/gateway.ts](../../../../../../src/orders/checkout/gateway.ts) | [src/orders/checkout/router.ts](../../../../../../src/orders/checkout/router.ts) | Calls router | HTTP |
| [src/orders/checkout/gateway.ts](../../../../../../src/orders/checkout/gateway.ts) | [src/orders/checkout/session.ts](../../../../../../src/orders/checkout/session.ts) | Reads session | HTTP |
| [src/orders/checkout/gateway.ts](../../../../../../src/orders/checkout/gateway.ts) | [src/orders/cart/gateway.ts](../../../../../../src/orders/cart/gateway.ts) | Forwards requests | HTTP |
