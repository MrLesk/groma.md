---
type: C4 Component
title: Media mapper
status: stable
groma:
  id: media-mapper
  parent: media
  group: Support
  code:
    - scanner: typescript
      file: src/catalog/media/mapper.ts
      symbol: mapper
---

Media mapper of Media.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/catalog/media/mapper.ts](../../../../../../src/catalog/media/mapper.ts) | [src/catalog/media/reader.ts](../../../../../../src/catalog/media/reader.ts) | Calls reader | HTTP |
| [src/catalog/media/mapper.ts](../../../../../../src/catalog/media/mapper.ts) | [src/catalog/media/writer.ts](../../../../../../src/catalog/media/writer.ts) | Reads writer | HTTP |
