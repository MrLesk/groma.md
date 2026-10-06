---
type: C4 Component
title: Checkout scheduler
status: stable
groma:
  id: checkout-scheduler
  parent: checkout
  code:
    - scanner: typescript
      file: src/orders/checkout/scheduler.ts
      symbol: scheduler
---

Checkout scheduler of Checkout.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/orders/checkout/scheduler.ts](../../../../../../src/orders/checkout/scheduler.ts) | [src/orders/checkout/metrics.ts](../../../../../../src/orders/checkout/metrics.ts) | Calls metrics | HTTP |
| [src/orders/checkout/scheduler.ts](../../../../../../src/orders/checkout/scheduler.ts) | [src/orders/checkout/config.ts](../../../../../../src/orders/checkout/config.ts) | Reads config | HTTP |
