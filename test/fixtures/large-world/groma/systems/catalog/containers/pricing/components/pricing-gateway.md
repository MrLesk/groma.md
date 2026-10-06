---
type: C4 Component
title: Pricing gateway
status: stable
groma:
  id: pricing-gateway
  parent: pricing
  group: Core
  code:
    - scanner: typescript
      file: src/catalog/pricing/gateway.ts
      symbol: gateway
---

Pricing gateway of Pricing.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/catalog/pricing/gateway.ts](../../../../../../src/catalog/pricing/gateway.ts) | [src/catalog/pricing/router.ts](../../../../../../src/catalog/pricing/router.ts) | Calls router | HTTP |
| [src/catalog/pricing/gateway.ts](../../../../../../src/catalog/pricing/gateway.ts) | [src/catalog/pricing/session.ts](../../../../../../src/catalog/pricing/session.ts) | Reads session | HTTP |
| [src/catalog/pricing/gateway.ts](../../../../../../src/catalog/pricing/gateway.ts) | [src/catalog/product-db/gateway.ts](../../../../../../src/catalog/product-db/gateway.ts) | Forwards requests | HTTP |
