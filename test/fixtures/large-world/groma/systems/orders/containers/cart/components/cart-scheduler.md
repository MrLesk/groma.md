---
type: C4 Component
title: Cart scheduler
status: stable
groma:
  id: cart-scheduler
  parent: cart
  code:
    - scanner: typescript
      file: src/orders/cart/scheduler.ts
      symbol: scheduler
---

Cart scheduler of Cart.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/orders/cart/scheduler.ts](../../../../../../src/orders/cart/scheduler.ts) | [src/orders/cart/metrics.ts](../../../../../../src/orders/cart/metrics.ts) | Calls metrics | HTTP |
| [src/orders/cart/scheduler.ts](../../../../../../src/orders/cart/scheduler.ts) | [src/orders/cart/config.ts](../../../../../../src/orders/cart/config.ts) | Reads config | HTTP |
