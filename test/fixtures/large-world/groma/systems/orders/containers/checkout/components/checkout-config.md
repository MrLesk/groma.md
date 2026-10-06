---
type: C4 Component
title: Checkout config
status: stable
groma:
  id: checkout-config
  parent: checkout
  code:
    - scanner: typescript
      file: src/orders/checkout/config.ts
      symbol: config
    - scanner: typescript
      file: src/orders/checkout/config-1.ts
      symbol: config
    - scanner: typescript
      file: src/orders/checkout/config-2.ts
      symbol: config
---

Checkout config of Checkout.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/orders/checkout/config.ts](../../../../../../src/orders/checkout/config.ts) | [src/orders/checkout/logger.ts](../../../../../../src/orders/checkout/logger.ts) | Calls logger | HTTP |
| [src/orders/checkout/config.ts](../../../../../../src/orders/checkout/config.ts) | [src/orders/checkout/client.ts](../../../../../../src/orders/checkout/client.ts) | Reads client | HTTP |
