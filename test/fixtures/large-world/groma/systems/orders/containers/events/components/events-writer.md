---
type: C4 Component
title: Events writer
status: stable
groma:
  id: events-writer
  parent: events
  group: Support
  code:
    - scanner: typescript
      file: src/orders/events/writer.ts
      symbol: writer
    - scanner: typescript
      file: src/orders/events/writer-1.ts
      symbol: writer
    - scanner: typescript
      file: src/orders/events/writer-2.ts
      symbol: writer
---

Events writer of Events.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/orders/events/writer.ts](../../../../../../src/orders/events/writer.ts) | [src/orders/events/queue.ts](../../../../../../src/orders/events/queue.ts) | Calls queue | HTTP |
| [src/orders/events/writer.ts](../../../../../../src/orders/events/writer.ts) | [src/orders/events/worker.ts](../../../../../../src/orders/events/worker.ts) | Reads worker | HTTP |
