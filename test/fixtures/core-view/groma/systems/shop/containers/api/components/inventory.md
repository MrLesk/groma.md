---
type: C4 Component
title: Inventory
status: draft
groma:
  id: inventory
  parent: api
  draft: inventory
  code:
    - scanner: typescript
      file: src/inventory.ts
---

Reserves stock for an order.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/inventory.ts](../../../../../../src/inventory.ts) | [src/orders.ts](../../../../../../src/orders.ts) | Reports reserved stock | Function call |
