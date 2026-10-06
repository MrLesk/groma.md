---
type: C4 Component
title: Import metrics
status: stable
groma:
  id: import-metrics
  parent: import
  code:
    - scanner: typescript
      file: src/catalog/import/metrics.ts
      symbol: metrics
    - scanner: typescript
      file: src/catalog/import/metrics-1.ts
      symbol: metrics
---

Import metrics of Import.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/catalog/import/metrics.ts](../../../../../../src/catalog/import/metrics.ts) | [src/catalog/import/config.ts](../../../../../../src/catalog/import/config.ts) | Calls config | HTTP |
| [src/catalog/import/metrics.ts](../../../../../../src/catalog/import/metrics.ts) | [src/catalog/import/logger.ts](../../../../../../src/catalog/import/logger.ts) | Reads logger | HTTP |
