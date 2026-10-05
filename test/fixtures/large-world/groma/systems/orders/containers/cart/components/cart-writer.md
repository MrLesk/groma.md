---
type: C4 Component
title: Cart writer
status: stable
groma:
  id: cart-writer
  parent: cart
  group: Support
  code:
    - scanner: typescript
      file: src/orders/cart/writer.ts
      symbol: writer
    - scanner: typescript
      file: src/orders/cart/writer-1.ts
      symbol: writer
    - scanner: typescript
      file: src/orders/cart/writer-2.ts
      symbol: writer
---

Cart writer of Cart.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/orders/cart/writer.ts](../../../../../../src/orders/cart/writer.ts) | [src/orders/cart/queue.ts](../../../../../../src/orders/cart/queue.ts) | Calls queue | HTTP |
| [src/orders/cart/writer.ts](../../../../../../src/orders/cart/writer.ts) | [src/orders/cart/worker.ts](../../../../../../src/orders/cart/worker.ts) | Reads worker | HTTP |
