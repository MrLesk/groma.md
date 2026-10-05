---
type: C4 Component
title: Mobile Api mapper
status: stable
groma:
  id: mobile-api-mapper
  parent: mobile-api
  group: Support
  code:
    - scanner: typescript
      file: src/storefront/mobile-api/mapper.ts
      symbol: mapper
---

Mobile Api mapper of Mobile Api.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/storefront/mobile-api/mapper.ts](../../../../../../src/storefront/mobile-api/mapper.ts) | [src/storefront/mobile-api/reader.ts](../../../../../../src/storefront/mobile-api/reader.ts) | Calls reader | HTTP |
| [src/storefront/mobile-api/mapper.ts](../../../../../../src/storefront/mobile-api/mapper.ts) | [src/storefront/mobile-api/writer.ts](../../../../../../src/storefront/mobile-api/writer.ts) | Reads writer | HTTP |
