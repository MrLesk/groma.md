---
type: C4 Component
title: Mobile Api reader
status: stable
groma:
  id: mobile-api-reader
  parent: mobile-api
  group: Support
  code:
    - scanner: typescript
      file: src/storefront/mobile-api/reader.ts
      symbol: reader
    - scanner: typescript
      file: src/storefront/mobile-api/reader-1.ts
      symbol: reader
---

Mobile Api reader of Mobile Api.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/storefront/mobile-api/reader.ts](../../../../../../src/storefront/mobile-api/reader.ts) | [src/storefront/mobile-api/writer.ts](../../../../../../src/storefront/mobile-api/writer.ts) | Calls writer | HTTP |
| [src/storefront/mobile-api/reader.ts](../../../../../../src/storefront/mobile-api/reader.ts) | [src/storefront/mobile-api/queue.ts](../../../../../../src/storefront/mobile-api/queue.ts) | Reads queue | HTTP |
