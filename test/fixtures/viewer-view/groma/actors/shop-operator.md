---
type: C4 Actor
title: Shop operator
status: stable
groma:
  id: shop-operator
---

Runs the shop day to day.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [Shop operator](shop-operator.md "shop-operator") | [Api](../systems/shop/containers/api/container.md "api") | Places a correction | Browser |
| [Shop operator](shop-operator.md "shop-operator") | [Order viewer](../systems/shop/containers/order-viewer/container.md "order-viewer") | Watches orders arrive | Browser |
