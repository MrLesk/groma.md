---
type: C4 Component
title: Order Db mapper
status: stable
groma:
  id: order-db-mapper
  parent: order-db
  group: Support
  code:
    - scanner: typescript
      file: src/orders/order-db/mapper.ts
      symbol: mapper
---

Order Db mapper of Order Db.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/orders/order-db/mapper.ts](../../../../../../src/orders/order-db/mapper.ts) | [src/orders/order-db/reader.ts](../../../../../../src/orders/order-db/reader.ts) | Calls reader | HTTP |
| [src/orders/order-db/mapper.ts](../../../../../../src/orders/order-db/mapper.ts) | [src/orders/order-db/writer.ts](../../../../../../src/orders/order-db/writer.ts) | Reads writer | HTTP |
