---
type: C4 Component
title: Events reader
status: stable
groma:
  id: events-reader
  parent: events
  group: Support
  code:
    - scanner: typescript
      file: src/orders/events/reader.ts
      symbol: reader
    - scanner: typescript
      file: src/orders/events/reader-1.ts
      symbol: reader
---

Events reader of Events.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/orders/events/reader.ts](../../../../../../src/orders/events/reader.ts) | [src/orders/events/writer.ts](../../../../../../src/orders/events/writer.ts) | Calls writer | HTTP |
| [src/orders/events/reader.ts](../../../../../../src/orders/events/reader.ts) | [src/orders/events/queue.ts](../../../../../../src/orders/events/queue.ts) | Reads queue | HTTP |
