---
type: C4 Component
title: Import scheduler
status: stable
groma:
  id: import-scheduler
  parent: import
  code:
    - scanner: typescript
      file: src/catalog/import/scheduler.ts
      symbol: scheduler
---

Import scheduler of Import.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/catalog/import/scheduler.ts](../../../../../../src/catalog/import/scheduler.ts) | [src/catalog/import/metrics.ts](../../../../../../src/catalog/import/metrics.ts) | Calls metrics | HTTP |
| [src/catalog/import/scheduler.ts](../../../../../../src/catalog/import/scheduler.ts) | [src/catalog/import/config.ts](../../../../../../src/catalog/import/config.ts) | Reads config | HTTP |
