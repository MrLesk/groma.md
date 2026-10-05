---
type: C4 Component
title: Orders
status: stable
groma:
  id: orders
  parent: api
  technology: Typescript, Postgres
  code:
    - scanner: typescript
      file: src/orders.ts
      symbol: placeOrder
---

Records an order and its lines.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/orders.ts](../../../../../../src/orders.ts) | [src/order-page.ts](../../../../../../src/order-page.ts) | Supplies placed orders | In-process data |
