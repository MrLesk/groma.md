---
type: C4 Component
title: Search router
status: stable
groma:
  id: search-router
  parent: search
  group: Core
  code:
    - scanner: typescript
      file: src/storefront/search/router.ts
      symbol: router
    - scanner: typescript
      file: src/storefront/search/router-1.ts
      symbol: router
---

Search router of Search.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/storefront/search/router.ts](../../../../../../src/storefront/search/router.ts) | [src/storefront/search/session.ts](../../../../../../src/storefront/search/session.ts) | Calls session | HTTP |
| [src/storefront/search/router.ts](../../../../../../src/storefront/search/router.ts) | [src/storefront/search/cache.ts](../../../../../../src/storefront/search/cache.ts) | Reads cache | HTTP |
