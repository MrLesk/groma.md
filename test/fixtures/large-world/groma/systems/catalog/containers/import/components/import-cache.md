---
type: C4 Component
title: Import cache
status: stable
groma:
  id: import-cache
  parent: import
  group: Core
  code:
    - scanner: typescript
      file: src/catalog/import/cache.ts
      symbol: cache
    - scanner: typescript
      file: src/catalog/import/cache-1.ts
      symbol: cache
    - scanner: typescript
      file: src/catalog/import/cache-2.ts
      symbol: cache
    - scanner: typescript
      file: src/catalog/import/cache-3.ts
      symbol: cache
---

Import cache of Import.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/catalog/import/cache.ts](../../../../../../src/catalog/import/cache.ts) | [src/catalog/import/validator.ts](../../../../../../src/catalog/import/validator.ts) | Calls validator | HTTP |
| [src/catalog/import/cache.ts](../../../../../../src/catalog/import/cache.ts) | [src/catalog/import/mapper.ts](../../../../../../src/catalog/import/mapper.ts) | Reads mapper | HTTP |
