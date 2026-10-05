---
type: C4 Component
title: Import router
status: stable
groma:
  id: import-router
  parent: import
  group: Core
  code:
    - scanner: typescript
      file: src/catalog/import/router.ts
      symbol: router
    - scanner: typescript
      file: src/catalog/import/router-1.ts
      symbol: router
---

Import router of Import.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/catalog/import/router.ts](../../../../../../src/catalog/import/router.ts) | [src/catalog/import/session.ts](../../../../../../src/catalog/import/session.ts) | Calls session | HTTP |
| [src/catalog/import/router.ts](../../../../../../src/catalog/import/router.ts) | [src/catalog/import/cache.ts](../../../../../../src/catalog/import/cache.ts) | Reads cache | HTTP |
