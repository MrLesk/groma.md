---
type: C4 Component
title: Media metrics
status: stable
groma:
  id: media-metrics
  parent: media
  code:
    - scanner: typescript
      file: src/catalog/media/metrics.ts
      symbol: metrics
    - scanner: typescript
      file: src/catalog/media/metrics-1.ts
      symbol: metrics
---

Media metrics of Media.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/catalog/media/metrics.ts](../../../../../../src/catalog/media/metrics.ts) | [src/catalog/media/config.ts](../../../../../../src/catalog/media/config.ts) | Calls config | HTTP |
| [src/catalog/media/metrics.ts](../../../../../../src/catalog/media/metrics.ts) | [src/catalog/media/logger.ts](../../../../../../src/catalog/media/logger.ts) | Reads logger | HTTP |
