---
type: C4 Component
title: Pricing config
status: stable
groma:
  id: pricing-config
  parent: pricing
  code:
    - scanner: typescript
      file: src/catalog/pricing/config.ts
      symbol: config
    - scanner: typescript
      file: src/catalog/pricing/config-1.ts
      symbol: config
    - scanner: typescript
      file: src/catalog/pricing/config-2.ts
      symbol: config
---

Pricing config of Pricing.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/catalog/pricing/config.ts](../../../../../../src/catalog/pricing/config.ts) | [src/catalog/pricing/logger.ts](../../../../../../src/catalog/pricing/logger.ts) | Calls logger | HTTP |
| [src/catalog/pricing/config.ts](../../../../../../src/catalog/pricing/config.ts) | [src/catalog/pricing/client.ts](../../../../../../src/catalog/pricing/client.ts) | Reads client | HTTP |
