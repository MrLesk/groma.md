---
type: C4 Component
title: Events scheduler
status: stable
groma:
  id: events-scheduler
  parent: events
  code:
    - scanner: typescript
      file: src/orders/events/scheduler.ts
      symbol: scheduler
---

Events scheduler of Events.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/orders/events/scheduler.ts](../../../../../../src/orders/events/scheduler.ts) | [src/orders/events/metrics.ts](../../../../../../src/orders/events/metrics.ts) | Calls metrics | HTTP |
| [src/orders/events/scheduler.ts](../../../../../../src/orders/events/scheduler.ts) | [src/orders/events/config.ts](../../../../../../src/orders/events/config.ts) | Reads config | HTTP |
