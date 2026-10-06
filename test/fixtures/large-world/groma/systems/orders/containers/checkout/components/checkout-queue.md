---
type: C4 Component
title: Checkout queue
status: stable
groma:
  id: checkout-queue
  parent: checkout
  group: Support
  code:
    - scanner: typescript
      file: src/orders/checkout/queue.ts
      symbol: queue
    - scanner: typescript
      file: src/orders/checkout/queue-1.ts
      symbol: queue
    - scanner: typescript
      file: src/orders/checkout/queue-2.ts
      symbol: queue
    - scanner: typescript
      file: src/orders/checkout/queue-3.ts
      symbol: queue
---

Checkout queue of Checkout.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/orders/checkout/queue.ts](../../../../../../src/orders/checkout/queue.ts) | [src/orders/checkout/worker.ts](../../../../../../src/orders/checkout/worker.ts) | Calls worker | HTTP |
| [src/orders/checkout/queue.ts](../../../../../../src/orders/checkout/queue.ts) | [src/orders/checkout/scheduler.ts](../../../../../../src/orders/checkout/scheduler.ts) | Reads scheduler | HTTP |
