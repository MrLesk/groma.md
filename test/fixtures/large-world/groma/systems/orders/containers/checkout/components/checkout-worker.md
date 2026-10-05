---
type: C4 Component
title: Checkout worker
status: stable
groma:
  id: checkout-worker
  parent: checkout
  group: Support
  code:
    - scanner: typescript
      file: src/orders/checkout/worker.ts
      symbol: worker
    - scanner: typescript
      file: src/orders/checkout/worker-1.ts
      symbol: worker
    - scanner: typescript
      file: src/orders/checkout/worker-2.ts
      symbol: worker
    - scanner: typescript
      file: src/orders/checkout/worker-3.ts
      symbol: worker
    - scanner: typescript
      file: src/orders/checkout/worker-4.ts
      symbol: worker
---

Checkout worker of Checkout.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/orders/checkout/worker.ts](../../../../../../src/orders/checkout/worker.ts) | [src/orders/checkout/scheduler.ts](../../../../../../src/orders/checkout/scheduler.ts) | Calls scheduler | HTTP |
| [src/orders/checkout/worker.ts](../../../../../../src/orders/checkout/worker.ts) | [src/orders/checkout/metrics.ts](../../../../../../src/orders/checkout/metrics.ts) | Reads metrics | HTTP |
