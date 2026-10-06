---
type: C4 Component
title: Catalog Api router
status: stable
groma:
  id: catalog-api-router
  parent: catalog-api
  group: Core
  code:
    - scanner: typescript
      file: src/catalog/catalog-api/router.ts
      symbol: router
    - scanner: typescript
      file: src/catalog/catalog-api/router-1.ts
      symbol: router
---

Catalog Api router of Catalog Api.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/catalog/catalog-api/router.ts](../../../../../../src/catalog/catalog-api/router.ts) | [src/catalog/catalog-api/session.ts](../../../../../../src/catalog/catalog-api/session.ts) | Calls session | HTTP |
| [src/catalog/catalog-api/router.ts](../../../../../../src/catalog/catalog-api/router.ts) | [src/catalog/catalog-api/cache.ts](../../../../../../src/catalog/catalog-api/cache.ts) | Reads cache | HTTP |
