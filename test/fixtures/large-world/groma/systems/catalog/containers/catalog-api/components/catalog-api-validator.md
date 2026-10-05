---
type: C4 Component
title: Catalog Api validator
status: stable
groma:
  id: catalog-api-validator
  parent: catalog-api
  group: Core
  code:
    - scanner: typescript
      file: src/catalog/catalog-api/validator.ts
      symbol: validator
    - scanner: typescript
      file: src/catalog/catalog-api/validator-1.ts
      symbol: validator
    - scanner: typescript
      file: src/catalog/catalog-api/validator-2.ts
      symbol: validator
    - scanner: typescript
      file: src/catalog/catalog-api/validator-3.ts
      symbol: validator
    - scanner: typescript
      file: src/catalog/catalog-api/validator-4.ts
      symbol: validator
---

Catalog Api validator of Catalog Api.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/catalog/catalog-api/validator.ts](../../../../../../src/catalog/catalog-api/validator.ts) | [src/catalog/catalog-api/mapper.ts](../../../../../../src/catalog/catalog-api/mapper.ts) | Calls mapper | HTTP |
| [src/catalog/catalog-api/validator.ts](../../../../../../src/catalog/catalog-api/validator.ts) | [src/catalog/catalog-api/reader.ts](../../../../../../src/catalog/catalog-api/reader.ts) | Reads reader | HTTP |
