---
type: C4 Component
title: Events session
status: stable
groma:
  id: events-session
  parent: events
  group: Core
  code:
    - scanner: typescript
      file: src/orders/events/session.ts
      symbol: session
    - scanner: typescript
      file: src/orders/events/session-1.ts
      symbol: session
    - scanner: typescript
      file: src/orders/events/session-2.ts
      symbol: session
---

Events session of Events.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/orders/events/session.ts](../../../../../../src/orders/events/session.ts) | [src/orders/events/cache.ts](../../../../../../src/orders/events/cache.ts) | Calls cache | HTTP |
| [src/orders/events/session.ts](../../../../../../src/orders/events/session.ts) | [src/orders/events/validator.ts](../../../../../../src/orders/events/validator.ts) | Reads validator | HTTP |
