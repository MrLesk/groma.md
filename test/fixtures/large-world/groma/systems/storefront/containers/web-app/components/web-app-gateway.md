---
type: C4 Component
title: Web App gateway
status: stable
groma:
  id: web-app-gateway
  parent: web-app
  group: Core
  code:
    - scanner: typescript
      file: src/storefront/web-app/gateway.ts
      symbol: gateway
---

Web App gateway of Web App.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/storefront/web-app/gateway.ts](../../../../../../src/storefront/web-app/gateway.ts) | [src/storefront/web-app/router.ts](../../../../../../src/storefront/web-app/router.ts) | Calls router | HTTP |
| [src/storefront/web-app/gateway.ts](../../../../../../src/storefront/web-app/gateway.ts) | [src/storefront/web-app/session.ts](../../../../../../src/storefront/web-app/session.ts) | Reads session | HTTP |
| [src/storefront/web-app/gateway.ts](../../../../../../src/storefront/web-app/gateway.ts) | [src/storefront/mobile-api/gateway.ts](../../../../../../src/storefront/mobile-api/gateway.ts) | Forwards requests | HTTP |
