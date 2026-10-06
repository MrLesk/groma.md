---
type: C4 Component
title: Orders
status: stable
groma:
  id: orders
  parent: api
  code:
    - scanner: typescript
      file: src/orders.ts
      symbol: placeOrder
---

Owns the order lifecycle.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/orders.ts](../../../../../../src/orders.ts) | [src/stock.ts](../../../../../../src/stock.ts) | talks to | Function call |
