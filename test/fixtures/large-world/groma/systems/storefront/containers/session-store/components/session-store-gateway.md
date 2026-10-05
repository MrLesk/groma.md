---
type: C4 Component
title: Session Store gateway
status: stable
groma:
  id: session-store-gateway
  parent: session-store
  group: Core
  code:
    - scanner: typescript
      file: src/storefront/session-store/gateway.ts
      symbol: gateway
---

Session Store gateway of Session Store.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/storefront/session-store/gateway.ts](../../../../../../src/storefront/session-store/gateway.ts) | [src/storefront/session-store/router.ts](../../../../../../src/storefront/session-store/router.ts) | Calls router | HTTP |
| [src/storefront/session-store/gateway.ts](../../../../../../src/storefront/session-store/gateway.ts) | [src/storefront/session-store/session.ts](../../../../../../src/storefront/session-store/session.ts) | Reads session | HTTP |
| [src/storefront/session-store/gateway.ts](../../../../../../src/storefront/session-store/gateway.ts) | [src/orders/checkout/gateway.ts](../../../../../../src/orders/checkout/gateway.ts) | Forwards requests | HTTP |
