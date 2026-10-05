---
type: C4 Component
title: Checkout metrics
status: stable
groma:
  id: checkout-metrics
  parent: checkout
  code:
    - scanner: typescript
      file: src/orders/checkout/metrics.ts
      symbol: metrics
    - scanner: typescript
      file: src/orders/checkout/metrics-1.ts
      symbol: metrics
---

Checkout metrics of Checkout.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/orders/checkout/metrics.ts](../../../../../../src/orders/checkout/metrics.ts) | [src/orders/checkout/config.ts](../../../../../../src/orders/checkout/config.ts) | Calls config | HTTP |
| [src/orders/checkout/metrics.ts](../../../../../../src/orders/checkout/metrics.ts) | [src/orders/checkout/logger.ts](../../../../../../src/orders/checkout/logger.ts) | Reads logger | HTTP |
