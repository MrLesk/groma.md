---
type: C4 Component
title: Mobile Api metrics
status: stable
groma:
  id: mobile-api-metrics
  parent: mobile-api
  code:
    - scanner: typescript
      file: src/storefront/mobile-api/metrics.ts
      symbol: metrics
    - scanner: typescript
      file: src/storefront/mobile-api/metrics-1.ts
      symbol: metrics
---

Mobile Api metrics of Mobile Api.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/storefront/mobile-api/metrics.ts](../../../../../../src/storefront/mobile-api/metrics.ts) | [src/storefront/mobile-api/config.ts](../../../../../../src/storefront/mobile-api/config.ts) | Calls config | HTTP |
| [src/storefront/mobile-api/metrics.ts](../../../../../../src/storefront/mobile-api/metrics.ts) | [src/storefront/mobile-api/logger.ts](../../../../../../src/storefront/mobile-api/logger.ts) | Reads logger | HTTP |
