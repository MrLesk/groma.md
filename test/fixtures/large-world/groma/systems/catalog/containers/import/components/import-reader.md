---
type: C4 Component
title: Import reader
status: stable
groma:
  id: import-reader
  parent: import
  group: Support
  code:
    - scanner: typescript
      file: src/catalog/import/reader.ts
      symbol: reader
    - scanner: typescript
      file: src/catalog/import/reader-1.ts
      symbol: reader
---

Import reader of Import.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/catalog/import/reader.ts](../../../../../../src/catalog/import/reader.ts) | [src/catalog/import/writer.ts](../../../../../../src/catalog/import/writer.ts) | Calls writer | HTTP |
| [src/catalog/import/reader.ts](../../../../../../src/catalog/import/reader.ts) | [src/catalog/import/queue.ts](../../../../../../src/catalog/import/queue.ts) | Reads queue | HTTP |
