---
type: C4 Component
title: Order Service writer
status: stable
groma:
  id: order-service-writer
  parent: order-service
  group: Support
  code:
    - scanner: typescript
      file: src/orders/order-service/writer.ts
      symbol: writer
    - scanner: typescript
      file: src/orders/order-service/writer-1.ts
      symbol: writer
    - scanner: typescript
      file: src/orders/order-service/writer-2.ts
      symbol: writer
---

Order Service writer of Order Service.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/orders/order-service/writer.ts](../../../../../../src/orders/order-service/writer.ts) | [src/orders/order-service/queue.ts](../../../../../../src/orders/order-service/queue.ts) | Calls queue | HTTP |
| [src/orders/order-service/writer.ts](../../../../../../src/orders/order-service/writer.ts) | [src/orders/order-service/worker.ts](../../../../../../src/orders/order-service/worker.ts) | Reads worker | HTTP |
