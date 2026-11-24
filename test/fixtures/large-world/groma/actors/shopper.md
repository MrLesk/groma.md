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
| [Shopper](shopper.md "shopper") | [Web App](../systems/storefront/containers/web-app/container.md "web-app") | Uses web-app | HTTP |
| [Shopper](shopper.md "shopper") | [Checkout](../systems/orders/containers/checkout/container.md "checkout") | Uses checkout | HTTP |
| [Shopper](shopper.md "shopper") | [Catalog Api](../systems/catalog/containers/catalog-api/container.md "catalog-api") | Uses catalog-api | HTTP |
| [Shopper](shopper.md "shopper") | [Accounts](../systems/identity/containers/accounts/container.md "accounts") | Uses accounts | HTTP |
