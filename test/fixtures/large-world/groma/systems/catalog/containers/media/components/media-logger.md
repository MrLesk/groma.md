---
type: C4 Component
title: Media logger
status: stable
groma:
  id: media-logger
  parent: media
  code:
    - scanner: typescript
      file: src/catalog/media/logger.ts
      symbol: logger
    - scanner: typescript
      file: src/catalog/media/logger-1.ts
      symbol: logger
    - scanner: typescript
      file: src/catalog/media/logger-2.ts
      symbol: logger
    - scanner: typescript
      file: src/catalog/media/logger-3.ts
      symbol: logger
---

Media logger of Media.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/catalog/media/logger.ts](../../../../../../src/catalog/media/logger.ts) | [src/catalog/media/client.ts](../../../../../../src/catalog/media/client.ts) | Calls client | HTTP |
