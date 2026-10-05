---
type: C4 Component
title: Cart reader
status: stable
groma:
  id: cart-reader
  parent: cart
  group: Support
  code:
    - scanner: typescript
      file: src/orders/cart/reader.ts
      symbol: reader
    - scanner: typescript
      file: src/orders/cart/reader-1.ts
      symbol: reader
---

Cart reader of Cart.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/orders/cart/reader.ts](../../../../../../src/orders/cart/reader.ts) | [src/orders/cart/writer.ts](../../../../../../src/orders/cart/writer.ts) | Calls writer | HTTP |
| [src/orders/cart/reader.ts](../../../../../../src/orders/cart/reader.ts) | [src/orders/cart/queue.ts](../../../../../../src/orders/cart/queue.ts) | Reads queue | HTTP |
