---
type: C4 Component
title: Media router
status: stable
groma:
  id: media-router
  parent: media
  group: Core
  code:
    - scanner: typescript
      file: src/catalog/media/router.ts
      symbol: router
    - scanner: typescript
      file: src/catalog/media/router-1.ts
      symbol: router
---

Media router of Media.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/catalog/media/router.ts](../../../../../../src/catalog/media/router.ts) | [src/catalog/media/session.ts](../../../../../../src/catalog/media/session.ts) | Calls session | HTTP |
| [src/catalog/media/router.ts](../../../../../../src/catalog/media/router.ts) | [src/catalog/media/cache.ts](../../../../../../src/catalog/media/cache.ts) | Reads cache | HTTP |
