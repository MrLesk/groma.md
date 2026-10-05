---
type: C4 Component
title: Checkout writer
status: stable
groma:
  id: checkout-writer
  parent: checkout
  group: Support
  code:
    - scanner: typescript
      file: src/orders/checkout/writer.ts
      symbol: writer
    - scanner: typescript
      file: src/orders/checkout/writer-1.ts
      symbol: writer
    - scanner: typescript
      file: src/orders/checkout/writer-2.ts
      symbol: writer
---

Checkout writer of Checkout.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/orders/checkout/writer.ts](../../../../../../src/orders/checkout/writer.ts) | [src/orders/checkout/queue.ts](../../../../../../src/orders/checkout/queue.ts) | Calls queue | HTTP |
| [src/orders/checkout/writer.ts](../../../../../../src/orders/checkout/writer.ts) | [src/orders/checkout/worker.ts](../../../../../../src/orders/checkout/worker.ts) | Reads worker | HTTP |
