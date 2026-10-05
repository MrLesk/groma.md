---
type: C4 Component
title: Search config
status: stable
groma:
  id: search-config
  parent: search
  code:
    - scanner: typescript
      file: src/storefront/search/config.ts
      symbol: config
    - scanner: typescript
      file: src/storefront/search/config-1.ts
      symbol: config
    - scanner: typescript
      file: src/storefront/search/config-2.ts
      symbol: config
---

Search config of Search.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/storefront/search/config.ts](../../../../../../src/storefront/search/config.ts) | [src/storefront/search/logger.ts](../../../../../../src/storefront/search/logger.ts) | Calls logger | HTTP |
| [src/storefront/search/config.ts](../../../../../../src/storefront/search/config.ts) | [src/storefront/search/client.ts](../../../../../../src/storefront/search/client.ts) | Reads client | HTTP |
