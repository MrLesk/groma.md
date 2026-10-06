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
| [shop-architect](shop-architect.md) | [api](../systems/shop/containers/api/container.md) | Reviews the order rules | Browser |
| [shop-architect](shop-architect.md) | [order-viewer](../systems/shop/containers/order-viewer/container.md) | Watches orders arrive | Browser |
