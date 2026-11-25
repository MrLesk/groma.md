---
type: C4 Actor
title: Shop architect
status: stable
groma:
  id: shop-architect
---

Designs how the shop fits together.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [Shop architect](shop-architect.md "shop-architect") | [Api](../systems/shop/containers/api/container.md "api") | Reviews the order rules | Browser |
| [Shop architect](shop-architect.md "shop-architect") | [Order viewer](../systems/shop/containers/order-viewer/container.md "order-viewer") | Watches orders arrive | Browser |
