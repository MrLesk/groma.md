---
type: C4 Component
title: Cart metrics
status: stable
groma:
  id: cart-metrics
  parent: cart
  code:
    - scanner: typescript
      file: src/orders/cart/metrics.ts
      symbol: metrics
    - scanner: typescript
      file: src/orders/cart/metrics-1.ts
      symbol: metrics
---

Cart metrics of Cart.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/orders/cart/metrics.ts](../../../../../../src/orders/cart/metrics.ts) | [src/orders/cart/config.ts](../../../../../../src/orders/cart/config.ts) | Calls config | HTTP |
| [src/orders/cart/metrics.ts](../../../../../../src/orders/cart/metrics.ts) | [src/orders/cart/logger.ts](../../../../../../src/orders/cart/logger.ts) | Reads logger | HTTP |
