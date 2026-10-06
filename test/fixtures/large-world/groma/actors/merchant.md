---
type: C4 Actor
title: Merchant
status: stable
groma:
  id: merchant
---

Merchant of the shop.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [merchant](merchant.md) | [mobile-api](../systems/storefront/containers/mobile-api/container.md) | Uses mobile-api | HTTP |
| [merchant](merchant.md) | [cart](../systems/orders/containers/cart/container.md) | Uses cart | HTTP |
| [merchant](merchant.md) | [pricing](../systems/catalog/containers/pricing/container.md) | Uses pricing | HTTP |
| [merchant](merchant.md) | [auth](../systems/identity/containers/auth/container.md) | Uses auth | HTTP |
