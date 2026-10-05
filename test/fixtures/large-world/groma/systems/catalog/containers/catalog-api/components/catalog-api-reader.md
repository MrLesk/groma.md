---
type: C4 Component
title: Catalog Api reader
status: stable
groma:
  id: catalog-api-reader
  parent: catalog-api
  group: Support
  code:
    - scanner: typescript
      file: src/catalog/catalog-api/reader.ts
      symbol: reader
    - scanner: typescript
      file: src/catalog/catalog-api/reader-1.ts
      symbol: reader
---

Catalog Api reader of Catalog Api.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/catalog/catalog-api/reader.ts](../../../../../../src/catalog/catalog-api/reader.ts) | [src/catalog/catalog-api/writer.ts](../../../../../../src/catalog/catalog-api/writer.ts) | Calls writer | HTTP |
| [src/catalog/catalog-api/reader.ts](../../../../../../src/catalog/catalog-api/reader.ts) | [src/catalog/catalog-api/queue.ts](../../../../../../src/catalog/catalog-api/queue.ts) | Reads queue | HTTP |
