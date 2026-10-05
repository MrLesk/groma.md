---
type: C4 Component
title: Mobile Api writer
status: stable
groma:
  id: mobile-api-writer
  parent: mobile-api
  group: Support
  code:
    - scanner: typescript
      file: src/storefront/mobile-api/writer.ts
      symbol: writer
    - scanner: typescript
      file: src/storefront/mobile-api/writer-1.ts
      symbol: writer
    - scanner: typescript
      file: src/storefront/mobile-api/writer-2.ts
      symbol: writer
---

Mobile Api writer of Mobile Api.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/storefront/mobile-api/writer.ts](../../../../../../src/storefront/mobile-api/writer.ts) | [src/storefront/mobile-api/queue.ts](../../../../../../src/storefront/mobile-api/queue.ts) | Calls queue | HTTP |
| [src/storefront/mobile-api/writer.ts](../../../../../../src/storefront/mobile-api/writer.ts) | [src/storefront/mobile-api/worker.ts](../../../../../../src/storefront/mobile-api/worker.ts) | Reads worker | HTTP |
