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
| [Merchant](merchant.md "merchant") | [Mobile Api](../systems/storefront/containers/mobile-api/container.md "mobile-api") | Uses mobile-api | HTTP |
| [Merchant](merchant.md "merchant") | [Cart](../systems/orders/containers/cart/container.md "cart") | Uses cart | HTTP |
| [Merchant](merchant.md "merchant") | [Pricing](../systems/catalog/containers/pricing/container.md "pricing") | Uses pricing | HTTP |
| [Merchant](merchant.md "merchant") | [Auth](../systems/identity/containers/auth/container.md "auth") | Uses auth | HTTP |
