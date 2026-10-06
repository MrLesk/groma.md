---
type: C4 Component
title: Catalog Api writer
status: stable
groma:
  id: catalog-api-writer
  parent: catalog-api
  group: Support
  code:
    - scanner: typescript
      file: src/catalog/catalog-api/writer.ts
      symbol: writer
    - scanner: typescript
      file: src/catalog/catalog-api/writer-1.ts
      symbol: writer
    - scanner: typescript
      file: src/catalog/catalog-api/writer-2.ts
      symbol: writer
---

Catalog Api writer of Catalog Api.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/catalog/catalog-api/writer.ts](../../../../../../src/catalog/catalog-api/writer.ts) | [src/catalog/catalog-api/queue.ts](../../../../../../src/catalog/catalog-api/queue.ts) | Calls queue | HTTP |
| [src/catalog/catalog-api/writer.ts](../../../../../../src/catalog/catalog-api/writer.ts) | [src/catalog/catalog-api/worker.ts](../../../../../../src/catalog/catalog-api/worker.ts) | Reads worker | HTTP |
