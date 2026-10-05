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
| [shop-operator](shop-operator.md) | [api](../systems/shop/containers/api/container.md) | Places a correction | Browser |
| [shop-operator](shop-operator.md) | [order-viewer](../systems/shop/containers/order-viewer/container.md) | Watches orders arrive | Browser |
