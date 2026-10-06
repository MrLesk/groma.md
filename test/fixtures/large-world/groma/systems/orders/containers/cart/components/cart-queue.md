---
type: C4 Component
title: Cart queue
status: stable
groma:
  id: cart-queue
  parent: cart
  group: Support
  code:
    - scanner: typescript
      file: src/orders/cart/queue.ts
      symbol: queue
    - scanner: typescript
      file: src/orders/cart/queue-1.ts
      symbol: queue
    - scanner: typescript
      file: src/orders/cart/queue-2.ts
      symbol: queue
    - scanner: typescript
      file: src/orders/cart/queue-3.ts
      symbol: queue
---

Cart queue of Cart.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/orders/cart/queue.ts](../../../../../../src/orders/cart/queue.ts) | [src/orders/cart/worker.ts](../../../../../../src/orders/cart/worker.ts) | Calls worker | HTTP |
| [src/orders/cart/queue.ts](../../../../../../src/orders/cart/queue.ts) | [src/orders/cart/scheduler.ts](../../../../../../src/orders/cart/scheduler.ts) | Reads scheduler | HTTP |
