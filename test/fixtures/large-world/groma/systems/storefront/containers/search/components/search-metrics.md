---
type: C4 Component
title: Search metrics
status: stable
groma:
  id: search-metrics
  parent: search
  code:
    - scanner: typescript
      file: src/storefront/search/metrics.ts
      symbol: metrics
    - scanner: typescript
      file: src/storefront/search/metrics-1.ts
      symbol: metrics
---

Search metrics of Search.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/storefront/search/metrics.ts](../../../../../../src/storefront/search/metrics.ts) | [src/storefront/search/config.ts](../../../../../../src/storefront/search/config.ts) | Calls config | HTTP |
| [src/storefront/search/metrics.ts](../../../../../../src/storefront/search/metrics.ts) | [src/storefront/search/logger.ts](../../../../../../src/storefront/search/logger.ts) | Reads logger | HTTP |
