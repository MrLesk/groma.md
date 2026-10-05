---
type: C4 Actor
title: Shopper
status: stable
groma:
  id: shopper
---

Shopper of the shop.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [shopper](shopper.md) | [web-app](../systems/storefront/containers/web-app/container.md) | Uses web-app | HTTP |
| [shopper](shopper.md) | [checkout](../systems/orders/containers/checkout/container.md) | Uses checkout | HTTP |
| [shopper](shopper.md) | [catalog-api](../systems/catalog/containers/catalog-api/container.md) | Uses catalog-api | HTTP |
| [shopper](shopper.md) | [accounts](../systems/identity/containers/accounts/container.md) | Uses accounts | HTTP |
