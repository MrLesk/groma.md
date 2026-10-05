---
type: C4 Component
title: Events metrics
status: stable
groma:
  id: events-metrics
  parent: events
  code:
    - scanner: typescript
      file: src/orders/events/metrics.ts
      symbol: metrics
    - scanner: typescript
      file: src/orders/events/metrics-1.ts
      symbol: metrics
---

Events metrics of Events.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/orders/events/metrics.ts](../../../../../../src/orders/events/metrics.ts) | [src/orders/events/config.ts](../../../../../../src/orders/events/config.ts) | Calls config | HTTP |
| [src/orders/events/metrics.ts](../../../../../../src/orders/events/metrics.ts) | [src/orders/events/logger.ts](../../../../../../src/orders/events/logger.ts) | Reads logger | HTTP |
