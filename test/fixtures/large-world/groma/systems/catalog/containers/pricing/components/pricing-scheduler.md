---
type: C4 Component
title: Pricing scheduler
status: stable
groma:
  id: pricing-scheduler
  parent: pricing
  code:
    - scanner: typescript
      file: src/catalog/pricing/scheduler.ts
      symbol: scheduler
---

Pricing scheduler of Pricing.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/catalog/pricing/scheduler.ts](../../../../../../src/catalog/pricing/scheduler.ts) | [src/catalog/pricing/metrics.ts](../../../../../../src/catalog/pricing/metrics.ts) | Calls metrics | HTTP |
| [src/catalog/pricing/scheduler.ts](../../../../../../src/catalog/pricing/scheduler.ts) | [src/catalog/pricing/config.ts](../../../../../../src/catalog/pricing/config.ts) | Reads config | HTTP |
