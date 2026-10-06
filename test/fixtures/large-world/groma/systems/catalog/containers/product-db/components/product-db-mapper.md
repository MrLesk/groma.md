---
type: C4 Component
title: Product Db mapper
status: stable
groma:
  id: product-db-mapper
  parent: product-db
  group: Support
  code:
    - scanner: typescript
      file: src/catalog/product-db/mapper.ts
      symbol: mapper
---

Product Db mapper of Product Db.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/catalog/product-db/mapper.ts](../../../../../../src/catalog/product-db/mapper.ts) | [src/catalog/product-db/reader.ts](../../../../../../src/catalog/product-db/reader.ts) | Calls reader | HTTP |
| [src/catalog/product-db/mapper.ts](../../../../../../src/catalog/product-db/mapper.ts) | [src/catalog/product-db/writer.ts](../../../../../../src/catalog/product-db/writer.ts) | Reads writer | HTTP |
