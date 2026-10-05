---
type: C4 Component
title: Pricing metrics
status: stable
groma:
  id: pricing-metrics
  parent: pricing
  code:
    - scanner: typescript
      file: src/catalog/pricing/metrics.ts
      symbol: metrics
    - scanner: typescript
      file: src/catalog/pricing/metrics-1.ts
      symbol: metrics
---

Pricing metrics of Pricing.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/catalog/pricing/metrics.ts](../../../../../../src/catalog/pricing/metrics.ts) | [src/catalog/pricing/config.ts](../../../../../../src/catalog/pricing/config.ts) | Calls config | HTTP |
| [src/catalog/pricing/metrics.ts](../../../../../../src/catalog/pricing/metrics.ts) | [src/catalog/pricing/logger.ts](../../../../../../src/catalog/pricing/logger.ts) | Reads logger | HTTP |
