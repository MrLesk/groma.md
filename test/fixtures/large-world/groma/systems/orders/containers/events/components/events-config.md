---
type: C4 Component
title: Events config
status: stable
groma:
  id: events-config
  parent: events
  code:
    - scanner: typescript
      file: src/orders/events/config.ts
      symbol: config
    - scanner: typescript
      file: src/orders/events/config-1.ts
      symbol: config
    - scanner: typescript
      file: src/orders/events/config-2.ts
      symbol: config
---

Events config of Events.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/orders/events/config.ts](../../../../../../src/orders/events/config.ts) | [src/orders/events/logger.ts](../../../../../../src/orders/events/logger.ts) | Calls logger | HTTP |
| [src/orders/events/config.ts](../../../../../../src/orders/events/config.ts) | [src/orders/events/client.ts](../../../../../../src/orders/events/client.ts) | Reads client | HTTP |
