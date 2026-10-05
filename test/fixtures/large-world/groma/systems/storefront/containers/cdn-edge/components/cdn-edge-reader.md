---
type: C4 Component
title: Cdn Edge reader
status: stable
groma:
  id: cdn-edge-reader
  parent: cdn-edge
  group: Support
  code:
    - scanner: typescript
      file: src/storefront/cdn-edge/reader.ts
      symbol: reader
    - scanner: typescript
      file: src/storefront/cdn-edge/reader-1.ts
      symbol: reader
---

Cdn Edge reader of Cdn Edge.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/storefront/cdn-edge/reader.ts](../../../../../../src/storefront/cdn-edge/reader.ts) | [src/storefront/cdn-edge/writer.ts](../../../../../../src/storefront/cdn-edge/writer.ts) | Calls writer | HTTP |
| [src/storefront/cdn-edge/reader.ts](../../../../../../src/storefront/cdn-edge/reader.ts) | [src/storefront/cdn-edge/queue.ts](../../../../../../src/storefront/cdn-edge/queue.ts) | Reads queue | HTTP |
