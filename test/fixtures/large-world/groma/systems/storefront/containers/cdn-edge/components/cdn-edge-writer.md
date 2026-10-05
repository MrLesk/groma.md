---
type: C4 Component
title: Cdn Edge writer
status: stable
groma:
  id: cdn-edge-writer
  parent: cdn-edge
  group: Support
  code:
    - scanner: typescript
      file: src/storefront/cdn-edge/writer.ts
      symbol: writer
    - scanner: typescript
      file: src/storefront/cdn-edge/writer-1.ts
      symbol: writer
    - scanner: typescript
      file: src/storefront/cdn-edge/writer-2.ts
      symbol: writer
---

Cdn Edge writer of Cdn Edge.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/storefront/cdn-edge/writer.ts](../../../../../../src/storefront/cdn-edge/writer.ts) | [src/storefront/cdn-edge/queue.ts](../../../../../../src/storefront/cdn-edge/queue.ts) | Calls queue | HTTP |
| [src/storefront/cdn-edge/writer.ts](../../../../../../src/storefront/cdn-edge/writer.ts) | [src/storefront/cdn-edge/worker.ts](../../../../../../src/storefront/cdn-edge/worker.ts) | Reads worker | HTTP |
