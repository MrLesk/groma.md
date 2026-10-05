---
type: C4 Component
title: Pricing session
status: stable
groma:
  id: pricing-session
  parent: pricing
  group: Core
  code:
    - scanner: typescript
      file: src/catalog/pricing/session.ts
      symbol: session
    - scanner: typescript
      file: src/catalog/pricing/session-1.ts
      symbol: session
    - scanner: typescript
      file: src/catalog/pricing/session-2.ts
      symbol: session
---

Pricing session of Pricing.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/catalog/pricing/session.ts](../../../../../../src/catalog/pricing/session.ts) | [src/catalog/pricing/cache.ts](../../../../../../src/catalog/pricing/cache.ts) | Calls cache | HTTP |
| [src/catalog/pricing/session.ts](../../../../../../src/catalog/pricing/session.ts) | [src/catalog/pricing/validator.ts](../../../../../../src/catalog/pricing/validator.ts) | Reads validator | HTTP |
