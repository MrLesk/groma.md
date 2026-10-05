---
type: C4 Component
title: Catalog Api session
status: stable
groma:
  id: catalog-api-session
  parent: catalog-api
  group: Core
  code:
    - scanner: typescript
      file: src/catalog/catalog-api/session.ts
      symbol: session
    - scanner: typescript
      file: src/catalog/catalog-api/session-1.ts
      symbol: session
    - scanner: typescript
      file: src/catalog/catalog-api/session-2.ts
      symbol: session
---

Catalog Api session of Catalog Api.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/catalog/catalog-api/session.ts](../../../../../../src/catalog/catalog-api/session.ts) | [src/catalog/catalog-api/cache.ts](../../../../../../src/catalog/catalog-api/cache.ts) | Calls cache | HTTP |
| [src/catalog/catalog-api/session.ts](../../../../../../src/catalog/catalog-api/session.ts) | [src/catalog/catalog-api/validator.ts](../../../../../../src/catalog/catalog-api/validator.ts) | Reads validator | HTTP |
