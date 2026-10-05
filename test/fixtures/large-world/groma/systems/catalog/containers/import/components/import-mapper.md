---
type: C4 Component
title: Import mapper
status: stable
groma:
  id: import-mapper
  parent: import
  group: Support
  code:
    - scanner: typescript
      file: src/catalog/import/mapper.ts
      symbol: mapper
---

Import mapper of Import.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/catalog/import/mapper.ts](../../../../../../src/catalog/import/mapper.ts) | [src/catalog/import/reader.ts](../../../../../../src/catalog/import/reader.ts) | Calls reader | HTTP |
| [src/catalog/import/mapper.ts](../../../../../../src/catalog/import/mapper.ts) | [src/catalog/import/writer.ts](../../../../../../src/catalog/import/writer.ts) | Reads writer | HTTP |
