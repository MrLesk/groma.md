---
type: C4 Component
title: Checkout logger
status: stable
groma:
  id: checkout-logger
  parent: checkout
  code:
    - scanner: typescript
      file: src/orders/checkout/logger.ts
      symbol: logger
    - scanner: typescript
      file: src/orders/checkout/logger-1.ts
      symbol: logger
    - scanner: typescript
      file: src/orders/checkout/logger-2.ts
      symbol: logger
    - scanner: typescript
      file: src/orders/checkout/logger-3.ts
      symbol: logger
---

Checkout logger of Checkout.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/orders/checkout/logger.ts](../../../../../../src/orders/checkout/logger.ts) | [src/orders/checkout/client.ts](../../../../../../src/orders/checkout/client.ts) | Calls client | HTTP |
