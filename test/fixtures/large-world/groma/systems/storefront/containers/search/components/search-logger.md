---
type: C4 Component
title: Search logger
status: stable
groma:
  id: search-logger
  parent: search
  code:
    - scanner: typescript
      file: src/storefront/search/logger.ts
      symbol: logger
    - scanner: typescript
      file: src/storefront/search/logger-1.ts
      symbol: logger
    - scanner: typescript
      file: src/storefront/search/logger-2.ts
      symbol: logger
    - scanner: typescript
      file: src/storefront/search/logger-3.ts
      symbol: logger
---

Search logger of Search.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/storefront/search/logger.ts](../../../../../../src/storefront/search/logger.ts) | [src/storefront/search/client.ts](../../../../../../src/storefront/search/client.ts) | Calls client | HTTP |
