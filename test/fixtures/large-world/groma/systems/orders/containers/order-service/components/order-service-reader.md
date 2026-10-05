---
type: C4 Component
title: Order Service reader
status: stable
groma:
  id: order-service-reader
  parent: order-service
  group: Support
  code:
    - scanner: typescript
      file: src/orders/order-service/reader.ts
      symbol: reader
    - scanner: typescript
      file: src/orders/order-service/reader-1.ts
      symbol: reader
---

Order Service reader of Order Service.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/orders/order-service/reader.ts](../../../../../../src/orders/order-service/reader.ts) | [src/orders/order-service/writer.ts](../../../../../../src/orders/order-service/writer.ts) | Calls writer | HTTP |
| [src/orders/order-service/reader.ts](../../../../../../src/orders/order-service/reader.ts) | [src/orders/order-service/queue.ts](../../../../../../src/orders/order-service/queue.ts) | Reads queue | HTTP |
