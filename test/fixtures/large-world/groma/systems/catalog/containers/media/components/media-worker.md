---
type: C4 Component
title: Media worker
status: stable
groma:
  id: media-worker
  parent: media
  group: Support
  code:
    - scanner: typescript
      file: src/catalog/media/worker.ts
      symbol: worker
    - scanner: typescript
      file: src/catalog/media/worker-1.ts
      symbol: worker
    - scanner: typescript
      file: src/catalog/media/worker-2.ts
      symbol: worker
    - scanner: typescript
      file: src/catalog/media/worker-3.ts
      symbol: worker
    - scanner: typescript
      file: src/catalog/media/worker-4.ts
      symbol: worker
---

Media worker of Media.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/catalog/media/worker.ts](../../../../../../src/catalog/media/worker.ts) | [src/catalog/media/scheduler.ts](../../../../../../src/catalog/media/scheduler.ts) | Calls scheduler | HTTP |
| [src/catalog/media/worker.ts](../../../../../../src/catalog/media/worker.ts) | [src/catalog/media/metrics.ts](../../../../../../src/catalog/media/metrics.ts) | Reads metrics | HTTP |
