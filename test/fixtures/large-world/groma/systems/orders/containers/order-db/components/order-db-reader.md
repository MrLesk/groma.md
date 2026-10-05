---
type: C4 Component
title: Order Db reader
status: stable
groma:
  id: order-db-reader
  parent: order-db
  group: Support
  code:
    - scanner: typescript
      file: src/orders/order-db/reader.ts
      symbol: reader
    - scanner: typescript
      file: src/orders/order-db/reader-1.ts
      symbol: reader
---

Order Db reader of Order Db.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/orders/order-db/reader.ts](../../../../../../src/orders/order-db/reader.ts) | [src/orders/order-db/writer.ts](../../../../../../src/orders/order-db/writer.ts) | Calls writer | HTTP |
| [src/orders/order-db/reader.ts](../../../../../../src/orders/order-db/reader.ts) | [src/orders/order-db/queue.ts](../../../../../../src/orders/order-db/queue.ts) | Reads queue | HTTP |
