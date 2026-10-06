---
type: C4 Component
title: Search cache
status: stable
groma:
  id: search-cache
  parent: search
  group: Core
  code:
    - scanner: typescript
      file: src/storefront/search/cache.ts
      symbol: cache
    - scanner: typescript
      file: src/storefront/search/cache-1.ts
      symbol: cache
    - scanner: typescript
      file: src/storefront/search/cache-2.ts
      symbol: cache
    - scanner: typescript
      file: src/storefront/search/cache-3.ts
      symbol: cache
---

Search cache of Search.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/storefront/search/cache.ts](../../../../../../src/storefront/search/cache.ts) | [src/storefront/search/validator.ts](../../../../../../src/storefront/search/validator.ts) | Calls validator | HTTP |
| [src/storefront/search/cache.ts](../../../../../../src/storefront/search/cache.ts) | [src/storefront/search/mapper.ts](../../../../../../src/storefront/search/mapper.ts) | Reads mapper | HTTP |
