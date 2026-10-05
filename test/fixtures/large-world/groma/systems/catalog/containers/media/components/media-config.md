---
type: C4 Component
title: Media config
status: stable
groma:
  id: media-config
  parent: media
  code:
    - scanner: typescript
      file: src/catalog/media/config.ts
      symbol: config
    - scanner: typescript
      file: src/catalog/media/config-1.ts
      symbol: config
    - scanner: typescript
      file: src/catalog/media/config-2.ts
      symbol: config
---

Media config of Media.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/catalog/media/config.ts](../../../../../../src/catalog/media/config.ts) | [src/catalog/media/logger.ts](../../../../../../src/catalog/media/logger.ts) | Calls logger | HTTP |
| [src/catalog/media/config.ts](../../../../../../src/catalog/media/config.ts) | [src/catalog/media/client.ts](../../../../../../src/catalog/media/client.ts) | Reads client | HTTP |
