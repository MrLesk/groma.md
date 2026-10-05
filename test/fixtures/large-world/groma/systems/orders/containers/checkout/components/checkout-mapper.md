---
type: C4 Component
title: Checkout mapper
status: stable
groma:
  id: checkout-mapper
  parent: checkout
  group: Support
  code:
    - scanner: typescript
      file: src/orders/checkout/mapper.ts
      symbol: mapper
---

Checkout mapper of Checkout.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/orders/checkout/mapper.ts](../../../../../../src/orders/checkout/mapper.ts) | [src/orders/checkout/reader.ts](../../../../../../src/orders/checkout/reader.ts) | Calls reader | HTTP |
| [src/orders/checkout/mapper.ts](../../../../../../src/orders/checkout/mapper.ts) | [src/orders/checkout/writer.ts](../../../../../../src/orders/checkout/writer.ts) | Reads writer | HTTP |
