---
type: C4 Component
title: Search scheduler
status: stable
groma:
  id: search-scheduler
  parent: search
  code:
    - scanner: typescript
      file: src/storefront/search/scheduler.ts
      symbol: scheduler
---

Search scheduler of Search.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/storefront/search/scheduler.ts](../../../../../../src/storefront/search/scheduler.ts) | [src/storefront/search/metrics.ts](../../../../../../src/storefront/search/metrics.ts) | Calls metrics | HTTP |
| [src/storefront/search/scheduler.ts](../../../../../../src/storefront/search/scheduler.ts) | [src/storefront/search/config.ts](../../../../../../src/storefront/search/config.ts) | Reads config | HTTP |
