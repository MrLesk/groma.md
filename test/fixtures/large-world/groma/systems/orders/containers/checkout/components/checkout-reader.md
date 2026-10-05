---
type: C4 Component
title: Checkout reader
status: stable
groma:
  id: checkout-reader
  parent: checkout
  group: Support
  code:
    - scanner: typescript
      file: src/orders/checkout/reader.ts
      symbol: reader
    - scanner: typescript
      file: src/orders/checkout/reader-1.ts
      symbol: reader
---

Checkout reader of Checkout.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/orders/checkout/reader.ts](../../../../../../src/orders/checkout/reader.ts) | [src/orders/checkout/writer.ts](../../../../../../src/orders/checkout/writer.ts) | Calls writer | HTTP |
| [src/orders/checkout/reader.ts](../../../../../../src/orders/checkout/reader.ts) | [src/orders/checkout/queue.ts](../../../../../../src/orders/checkout/queue.ts) | Reads queue | HTTP |
