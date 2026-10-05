---
type: C4 Component
title: Import session
status: stable
groma:
  id: import-session
  parent: import
  group: Core
  code:
    - scanner: typescript
      file: src/catalog/import/session.ts
      symbol: session
    - scanner: typescript
      file: src/catalog/import/session-1.ts
      symbol: session
    - scanner: typescript
      file: src/catalog/import/session-2.ts
      symbol: session
---

Import session of Import.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/catalog/import/session.ts](../../../../../../src/catalog/import/session.ts) | [src/catalog/import/cache.ts](../../../../../../src/catalog/import/cache.ts) | Calls cache | HTTP |
| [src/catalog/import/session.ts](../../../../../../src/catalog/import/session.ts) | [src/catalog/import/validator.ts](../../../../../../src/catalog/import/validator.ts) | Reads validator | HTTP |
