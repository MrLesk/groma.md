---
type: C4 Component
title: Events gateway
status: stable
groma:
  id: events-gateway
  parent: events
  group: Core
  code:
    - scanner: typescript
      file: src/orders/events/gateway.ts
      symbol: gateway
---

Events gateway of Events.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/orders/events/gateway.ts](../../../../../../src/orders/events/gateway.ts) | [src/orders/events/router.ts](../../../../../../src/orders/events/router.ts) | Calls router | HTTP |
| [src/orders/events/gateway.ts](../../../../../../src/orders/events/gateway.ts) | [src/orders/events/session.ts](../../../../../../src/orders/events/session.ts) | Reads session | HTTP |
| [src/orders/events/gateway.ts](../../../../../../src/orders/events/gateway.ts) | [src/catalog/catalog-api/gateway.ts](../../../../../../src/catalog/catalog-api/gateway.ts) | Forwards requests | HTTP |
