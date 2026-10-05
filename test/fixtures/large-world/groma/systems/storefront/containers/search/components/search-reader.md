---
type: C4 Component
title: Search reader
status: stable
groma:
  id: search-reader
  parent: search
  group: Support
  code:
    - scanner: typescript
      file: src/storefront/search/reader.ts
      symbol: reader
    - scanner: typescript
      file: src/storefront/search/reader-1.ts
      symbol: reader
---

Search reader of Search.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/storefront/search/reader.ts](../../../../../../src/storefront/search/reader.ts) | [src/storefront/search/writer.ts](../../../../../../src/storefront/search/writer.ts) | Calls writer | HTTP |
| [src/storefront/search/reader.ts](../../../../../../src/storefront/search/reader.ts) | [src/storefront/search/queue.ts](../../../../../../src/storefront/search/queue.ts) | Reads queue | HTTP |
