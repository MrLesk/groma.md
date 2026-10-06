---
type: C4 Component
title: Search mapper
status: stable
groma:
  id: search-mapper
  parent: search
  group: Support
  code:
    - scanner: typescript
      file: src/storefront/search/mapper.ts
      symbol: mapper
---

Search mapper of Search.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/storefront/search/mapper.ts](../../../../../../src/storefront/search/mapper.ts) | [src/storefront/search/reader.ts](../../../../../../src/storefront/search/reader.ts) | Calls reader | HTTP |
| [src/storefront/search/mapper.ts](../../../../../../src/storefront/search/mapper.ts) | [src/storefront/search/writer.ts](../../../../../../src/storefront/search/writer.ts) | Reads writer | HTTP |
