---
type: C4 Component
title: Events cache
status: stable
groma:
  id: events-cache
  parent: events
  group: Core
  code:
    - scanner: typescript
      file: src/orders/events/cache.ts
      symbol: cache
    - scanner: typescript
      file: src/orders/events/cache-1.ts
      symbol: cache
    - scanner: typescript
      file: src/orders/events/cache-2.ts
      symbol: cache
    - scanner: typescript
      file: src/orders/events/cache-3.ts
      symbol: cache
---

Events cache of Events.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/orders/events/cache.ts](../../../../../../src/orders/events/cache.ts) | [src/orders/events/validator.ts](../../../../../../src/orders/events/validator.ts) | Calls validator | HTTP |
| [src/orders/events/cache.ts](../../../../../../src/orders/events/cache.ts) | [src/orders/events/mapper.ts](../../../../../../src/orders/events/mapper.ts) | Reads mapper | HTTP |
