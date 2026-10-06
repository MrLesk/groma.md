---
type: C4 Component
title: Catalog Api scheduler
status: stable
groma:
  id: catalog-api-scheduler
  parent: catalog-api
  code:
    - scanner: typescript
      file: src/catalog/catalog-api/scheduler.ts
      symbol: scheduler
---

Catalog Api scheduler of Catalog Api.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/catalog/catalog-api/scheduler.ts](../../../../../../src/catalog/catalog-api/scheduler.ts) | [src/catalog/catalog-api/metrics.ts](../../../../../../src/catalog/catalog-api/metrics.ts) | Calls metrics | HTTP |
| [src/catalog/catalog-api/scheduler.ts](../../../../../../src/catalog/catalog-api/scheduler.ts) | [src/catalog/catalog-api/config.ts](../../../../../../src/catalog/catalog-api/config.ts) | Reads config | HTTP |
