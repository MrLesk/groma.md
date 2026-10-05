---
type: C4 Component
title: Session Store writer
status: stable
groma:
  id: session-store-writer
  parent: session-store
  group: Support
  code:
    - scanner: typescript
      file: src/storefront/session-store/writer.ts
      symbol: writer
    - scanner: typescript
      file: src/storefront/session-store/writer-1.ts
      symbol: writer
    - scanner: typescript
      file: src/storefront/session-store/writer-2.ts
      symbol: writer
---

Session Store writer of Session Store.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/storefront/session-store/writer.ts](../../../../../../src/storefront/session-store/writer.ts) | [src/storefront/session-store/queue.ts](../../../../../../src/storefront/session-store/queue.ts) | Calls queue | HTTP |
| [src/storefront/session-store/writer.ts](../../../../../../src/storefront/session-store/writer.ts) | [src/storefront/session-store/worker.ts](../../../../../../src/storefront/session-store/worker.ts) | Reads worker | HTTP |
