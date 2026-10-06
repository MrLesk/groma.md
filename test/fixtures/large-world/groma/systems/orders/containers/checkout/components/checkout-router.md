---
type: C4 Component
title: Checkout router
status: stable
groma:
  id: checkout-router
  parent: checkout
  group: Core
  code:
    - scanner: typescript
      file: src/orders/checkout/router.ts
      symbol: router
    - scanner: typescript
      file: src/orders/checkout/router-1.ts
      symbol: router
---

Checkout router of Checkout.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/orders/checkout/router.ts](../../../../../../src/orders/checkout/router.ts) | [src/orders/checkout/session.ts](../../../../../../src/orders/checkout/session.ts) | Calls session | HTTP |
| [src/orders/checkout/router.ts](../../../../../../src/orders/checkout/router.ts) | [src/orders/checkout/cache.ts](../../../../../../src/orders/checkout/cache.ts) | Reads cache | HTTP |
