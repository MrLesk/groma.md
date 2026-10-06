---
type: C4 Component
title: Catalog Api metrics
status: stable
groma:
  id: catalog-api-metrics
  parent: catalog-api
  code:
    - scanner: typescript
      file: src/catalog/catalog-api/metrics.ts
      symbol: metrics
    - scanner: typescript
      file: src/catalog/catalog-api/metrics-1.ts
      symbol: metrics
---

Catalog Api metrics of Catalog Api.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/catalog/catalog-api/metrics.ts](../../../../../../src/catalog/catalog-api/metrics.ts) | [src/catalog/catalog-api/config.ts](../../../../../../src/catalog/catalog-api/config.ts) | Calls config | HTTP |
| [src/catalog/catalog-api/metrics.ts](../../../../../../src/catalog/catalog-api/metrics.ts) | [src/catalog/catalog-api/logger.ts](../../../../../../src/catalog/catalog-api/logger.ts) | Reads logger | HTTP |
