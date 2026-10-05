---
type: C4 Component
title: Events router
status: stable
groma:
  id: events-router
  parent: events
  group: Core
  code:
    - scanner: typescript
      file: src/orders/events/router.ts
      symbol: router
    - scanner: typescript
      file: src/orders/events/router-1.ts
      symbol: router
---

Events router of Events.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/orders/events/router.ts](../../../../../../src/orders/events/router.ts) | [src/orders/events/session.ts](../../../../../../src/orders/events/session.ts) | Calls session | HTTP |
| [src/orders/events/router.ts](../../../../../../src/orders/events/router.ts) | [src/orders/events/cache.ts](../../../../../../src/orders/events/cache.ts) | Reads cache | HTTP |
