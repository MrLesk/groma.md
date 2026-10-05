---
type: C4 Component
title: Session Store reader
status: stable
groma:
  id: session-store-reader
  parent: session-store
  group: Support
  code:
    - scanner: typescript
      file: src/storefront/session-store/reader.ts
      symbol: reader
    - scanner: typescript
      file: src/storefront/session-store/reader-1.ts
      symbol: reader
---

Session Store reader of Session Store.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/storefront/session-store/reader.ts](../../../../../../src/storefront/session-store/reader.ts) | [src/storefront/session-store/writer.ts](../../../../../../src/storefront/session-store/writer.ts) | Calls writer | HTTP |
| [src/storefront/session-store/reader.ts](../../../../../../src/storefront/session-store/reader.ts) | [src/storefront/session-store/queue.ts](../../../../../../src/storefront/session-store/queue.ts) | Reads queue | HTTP |
