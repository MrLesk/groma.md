---
type: C4 Component
title: Product Db validator
status: stable
groma:
  id: product-db-validator
  parent: product-db
  group: Core
  code:
    - scanner: typescript
      file: src/catalog/product-db/validator.ts
      symbol: validator
    - scanner: typescript
      file: src/catalog/product-db/validator-1.ts
      symbol: validator
    - scanner: typescript
      file: src/catalog/product-db/validator-2.ts
      symbol: validator
    - scanner: typescript
      file: src/catalog/product-db/validator-3.ts
      symbol: validator
    - scanner: typescript
      file: src/catalog/product-db/validator-4.ts
      symbol: validator
---

Product Db validator of Product Db.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/catalog/product-db/validator.ts](../../../../../../src/catalog/product-db/validator.ts) | [src/catalog/product-db/mapper.ts](../../../../../../src/catalog/product-db/mapper.ts) | Calls mapper | HTTP |
| [src/catalog/product-db/validator.ts](../../../../../../src/catalog/product-db/validator.ts) | [src/catalog/product-db/reader.ts](../../../../../../src/catalog/product-db/reader.ts) | Reads reader | HTTP |
