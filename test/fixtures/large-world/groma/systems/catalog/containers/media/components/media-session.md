---
type: C4 Component
title: Media session
status: stable
groma:
  id: media-session
  parent: media
  group: Core
  code:
    - scanner: typescript
      file: src/catalog/media/session.ts
      symbol: session
    - scanner: typescript
      file: src/catalog/media/session-1.ts
      symbol: session
    - scanner: typescript
      file: src/catalog/media/session-2.ts
      symbol: session
---

Media session of Media.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/catalog/media/session.ts](../../../../../../src/catalog/media/session.ts) | [src/catalog/media/cache.ts](../../../../../../src/catalog/media/cache.ts) | Calls cache | HTTP |
| [src/catalog/media/session.ts](../../../../../../src/catalog/media/session.ts) | [src/catalog/media/validator.ts](../../../../../../src/catalog/media/validator.ts) | Reads validator | HTTP |
