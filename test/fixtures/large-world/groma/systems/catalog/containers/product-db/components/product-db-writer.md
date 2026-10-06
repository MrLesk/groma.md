---
type: C4 Component
title: Product Db writer
status: stable
groma:
  id: product-db-writer
  parent: product-db
  group: Support
  code:
    - scanner: typescript
      file: src/catalog/product-db/writer.ts
      symbol: writer
    - scanner: typescript
      file: src/catalog/product-db/writer-1.ts
      symbol: writer
    - scanner: typescript
      file: src/catalog/product-db/writer-2.ts
      symbol: writer
---

Product Db writer of Product Db.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/catalog/product-db/writer.ts](../../../../../../src/catalog/product-db/writer.ts) | [src/catalog/product-db/queue.ts](../../../../../../src/catalog/product-db/queue.ts) | Calls queue | HTTP |
| [src/catalog/product-db/writer.ts](../../../../../../src/catalog/product-db/writer.ts) | [src/catalog/product-db/worker.ts](../../../../../../src/catalog/product-db/worker.ts) | Reads worker | HTTP |
