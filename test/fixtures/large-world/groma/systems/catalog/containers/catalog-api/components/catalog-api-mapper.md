---
type: C4 Component
title: Catalog Api mapper
status: stable
groma:
  id: catalog-api-mapper
  parent: catalog-api
  group: Support
  code:
    - scanner: typescript
      file: src/catalog/catalog-api/mapper.ts
      symbol: mapper
---

Catalog Api mapper of Catalog Api.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/catalog/catalog-api/mapper.ts](../../../../../../src/catalog/catalog-api/mapper.ts) | [src/catalog/catalog-api/reader.ts](../../../../../../src/catalog/catalog-api/reader.ts) | Calls reader | HTTP |
| [src/catalog/catalog-api/mapper.ts](../../../../../../src/catalog/catalog-api/mapper.ts) | [src/catalog/catalog-api/writer.ts](../../../../../../src/catalog/catalog-api/writer.ts) | Reads writer | HTTP |
