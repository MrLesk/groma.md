---
type: C4 Component
title: Events mapper
status: stable
groma:
  id: events-mapper
  parent: events
  group: Support
  code:
    - scanner: typescript
      file: src/orders/events/mapper.ts
      symbol: mapper
---

Events mapper of Events.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/orders/events/mapper.ts](../../../../../../src/orders/events/mapper.ts) | [src/orders/events/reader.ts](../../../../../../src/orders/events/reader.ts) | Calls reader | HTTP |
| [src/orders/events/mapper.ts](../../../../../../src/orders/events/mapper.ts) | [src/orders/events/writer.ts](../../../../../../src/orders/events/writer.ts) | Reads writer | HTTP |
