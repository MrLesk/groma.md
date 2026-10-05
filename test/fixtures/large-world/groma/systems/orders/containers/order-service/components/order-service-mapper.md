---
type: C4 Component
title: Order Service mapper
status: stable
groma:
  id: order-service-mapper
  parent: order-service
  group: Support
  code:
    - scanner: typescript
      file: src/orders/order-service/mapper.ts
      symbol: mapper
---

Order Service mapper of Order Service.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/orders/order-service/mapper.ts](../../../../../../src/orders/order-service/mapper.ts) | [src/orders/order-service/reader.ts](../../../../../../src/orders/order-service/reader.ts) | Calls reader | HTTP |
| [src/orders/order-service/mapper.ts](../../../../../../src/orders/order-service/mapper.ts) | [src/orders/order-service/writer.ts](../../../../../../src/orders/order-service/writer.ts) | Reads writer | HTTP |
