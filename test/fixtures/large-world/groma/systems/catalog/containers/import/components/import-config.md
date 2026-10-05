---
type: C4 Component
title: Import config
status: stable
groma:
  id: import-config
  parent: import
  code:
    - scanner: typescript
      file: src/catalog/import/config.ts
      symbol: config
    - scanner: typescript
      file: src/catalog/import/config-1.ts
      symbol: config
    - scanner: typescript
      file: src/catalog/import/config-2.ts
      symbol: config
---

Import config of Import.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/catalog/import/config.ts](../../../../../../src/catalog/import/config.ts) | [src/catalog/import/logger.ts](../../../../../../src/catalog/import/logger.ts) | Calls logger | HTTP |
| [src/catalog/import/config.ts](../../../../../../src/catalog/import/config.ts) | [src/catalog/import/client.ts](../../../../../../src/catalog/import/client.ts) | Reads client | HTTP |
