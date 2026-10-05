---
type: C4 Component
title: Import writer
status: stable
groma:
  id: import-writer
  parent: import
  group: Support
  code:
    - scanner: typescript
      file: src/catalog/import/writer.ts
      symbol: writer
    - scanner: typescript
      file: src/catalog/import/writer-1.ts
      symbol: writer
    - scanner: typescript
      file: src/catalog/import/writer-2.ts
      symbol: writer
---

Import writer of Import.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/catalog/import/writer.ts](../../../../../../src/catalog/import/writer.ts) | [src/catalog/import/queue.ts](../../../../../../src/catalog/import/queue.ts) | Calls queue | HTTP |
| [src/catalog/import/writer.ts](../../../../../../src/catalog/import/writer.ts) | [src/catalog/import/worker.ts](../../../../../../src/catalog/import/worker.ts) | Reads worker | HTTP |
