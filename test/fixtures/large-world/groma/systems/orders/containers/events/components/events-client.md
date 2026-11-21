---
type: C4 Component
title: Events client
status: stable
groma:
  id: events-client
  parent: events
  code:
    - scanner: typescript
      file: src/orders/events/client.ts
      symbol: client
    - scanner: typescript
      file: src/orders/events/client-1.ts
      symbol: client
    - scanner: typescript
      file: src/orders/events/client-2.ts
      symbol: client
    - scanner: typescript
      file: src/orders/events/client-3.ts
      symbol: client
    - scanner: typescript
      file: src/orders/events/client-4.ts
      symbol: client
---

Events client of Events.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [Events client](events-client.md "events-client") | [Payments](../../../../../externals/payments.md "payments") | Charges cards | HTTP |
