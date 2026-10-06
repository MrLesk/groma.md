---
type: C4 Component
title: Search session
status: stable
groma:
  id: search-session
  parent: search
  group: Core
  code:
    - scanner: typescript
      file: src/storefront/search/session.ts
      symbol: session
    - scanner: typescript
      file: src/storefront/search/session-1.ts
      symbol: session
    - scanner: typescript
      file: src/storefront/search/session-2.ts
      symbol: session
---

Search session of Search.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/storefront/search/session.ts](../../../../../../src/storefront/search/session.ts) | [src/storefront/search/cache.ts](../../../../../../src/storefront/search/cache.ts) | Calls cache | HTTP |
| [src/storefront/search/session.ts](../../../../../../src/storefront/search/session.ts) | [src/storefront/search/validator.ts](../../../../../../src/storefront/search/validator.ts) | Reads validator | HTTP |
