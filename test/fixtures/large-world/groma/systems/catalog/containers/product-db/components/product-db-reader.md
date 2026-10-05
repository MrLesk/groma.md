---
type: C4 Component
title: Product Db reader
status: stable
groma:
  id: product-db-reader
  parent: product-db
  group: Support
  code:
    - scanner: typescript
      file: src/catalog/product-db/reader.ts
      symbol: reader
    - scanner: typescript
      file: src/catalog/product-db/reader-1.ts
      symbol: reader
---

Product Db reader of Product Db.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/catalog/product-db/reader.ts](../../../../../../src/catalog/product-db/reader.ts) | [src/catalog/product-db/writer.ts](../../../../../../src/catalog/product-db/writer.ts) | Calls writer | HTTP |
| [src/catalog/product-db/reader.ts](../../../../../../src/catalog/product-db/reader.ts) | [src/catalog/product-db/queue.ts](../../../../../../src/catalog/product-db/queue.ts) | Reads queue | HTTP |
