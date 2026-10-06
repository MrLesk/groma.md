---
type: C4 Component
title: Media writer
status: stable
groma:
  id: media-writer
  parent: media
  group: Support
  code:
    - scanner: typescript
      file: src/catalog/media/writer.ts
      symbol: writer
    - scanner: typescript
      file: src/catalog/media/writer-1.ts
      symbol: writer
    - scanner: typescript
      file: src/catalog/media/writer-2.ts
      symbol: writer
---

Media writer of Media.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/catalog/media/writer.ts](../../../../../../src/catalog/media/writer.ts) | [src/catalog/media/queue.ts](../../../../../../src/catalog/media/queue.ts) | Calls queue | HTTP |
| [src/catalog/media/writer.ts](../../../../../../src/catalog/media/writer.ts) | [src/catalog/media/worker.ts](../../../../../../src/catalog/media/worker.ts) | Reads worker | HTTP |
