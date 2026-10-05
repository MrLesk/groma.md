---
type: C4 Component
title: Media scheduler
status: stable
groma:
  id: media-scheduler
  parent: media
  code:
    - scanner: typescript
      file: src/catalog/media/scheduler.ts
      symbol: scheduler
---

Media scheduler of Media.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/catalog/media/scheduler.ts](../../../../../../src/catalog/media/scheduler.ts) | [src/catalog/media/metrics.ts](../../../../../../src/catalog/media/metrics.ts) | Calls metrics | HTTP |
| [src/catalog/media/scheduler.ts](../../../../../../src/catalog/media/scheduler.ts) | [src/catalog/media/config.ts](../../../../../../src/catalog/media/config.ts) | Reads config | HTTP |
