---
type: C4 Component
title: Cart mapper
status: stable
groma:
  id: cart-mapper
  parent: cart
  group: Support
  code:
    - scanner: typescript
      file: src/orders/cart/mapper.ts
      symbol: mapper
---

Cart mapper of Cart.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/orders/cart/mapper.ts](../../../../../../src/orders/cart/mapper.ts) | [src/orders/cart/reader.ts](../../../../../../src/orders/cart/reader.ts) | Calls reader | HTTP |
| [src/orders/cart/mapper.ts](../../../../../../src/orders/cart/mapper.ts) | [src/orders/cart/writer.ts](../../../../../../src/orders/cart/writer.ts) | Reads writer | HTTP |
