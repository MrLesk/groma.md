---
type: C4 Component
title: Checkout session
status: stable
groma:
  id: checkout-session
  parent: checkout
  group: Core
  code:
    - scanner: typescript
      file: src/orders/checkout/session.ts
      symbol: session
    - scanner: typescript
      file: src/orders/checkout/session-1.ts
      symbol: session
    - scanner: typescript
      file: src/orders/checkout/session-2.ts
      symbol: session
---

Checkout session of Checkout.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/orders/checkout/session.ts](../../../../../../src/orders/checkout/session.ts) | [src/orders/checkout/cache.ts](../../../../../../src/orders/checkout/cache.ts) | Calls cache | HTTP |
| [src/orders/checkout/session.ts](../../../../../../src/orders/checkout/session.ts) | [src/orders/checkout/validator.ts](../../../../../../src/orders/checkout/validator.ts) | Reads validator | HTTP |
