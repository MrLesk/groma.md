---
type: C4 Component
title: Media reader
status: stable
groma:
  id: media-reader
  parent: media
  group: Support
  code:
    - scanner: typescript
      file: src/catalog/media/reader.ts
      symbol: reader
    - scanner: typescript
      file: src/catalog/media/reader-1.ts
      symbol: reader
---

Media reader of Media.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/catalog/media/reader.ts](../../../../../../src/catalog/media/reader.ts) | [src/catalog/media/writer.ts](../../../../../../src/catalog/media/writer.ts) | Calls writer | HTTP |
| [src/catalog/media/reader.ts](../../../../../../src/catalog/media/reader.ts) | [src/catalog/media/queue.ts](../../../../../../src/catalog/media/queue.ts) | Reads queue | HTTP |
