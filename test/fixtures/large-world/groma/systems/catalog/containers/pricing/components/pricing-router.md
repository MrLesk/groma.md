---
type: C4 Component
title: Pricing router
status: stable
groma:
  id: pricing-router
  parent: pricing
  group: Core
  code:
    - scanner: typescript
      file: src/catalog/pricing/router.ts
      symbol: router
    - scanner: typescript
      file: src/catalog/pricing/router-1.ts
      symbol: router
---

Pricing router of Pricing.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/catalog/pricing/router.ts](../../../../../../src/catalog/pricing/router.ts) | [src/catalog/pricing/session.ts](../../../../../../src/catalog/pricing/session.ts) | Calls session | HTTP |
| [src/catalog/pricing/router.ts](../../../../../../src/catalog/pricing/router.ts) | [src/catalog/pricing/cache.ts](../../../../../../src/catalog/pricing/cache.ts) | Reads cache | HTTP |
