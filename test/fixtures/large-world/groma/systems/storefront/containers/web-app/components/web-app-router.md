---
type: C4 Component
title: Web App router
status: stable
groma:
  id: web-app-router
  parent: web-app
  group: Core
  code:
    - scanner: typescript
      file: src/storefront/web-app/router.ts
      symbol: router
    - scanner: typescript
      file: src/storefront/web-app/router-1.ts
      symbol: router
---

Web App router of Web App.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/storefront/web-app/router.ts](../../../../../../src/storefront/web-app/router.ts) | [src/storefront/web-app/session.ts](../../../../../../src/storefront/web-app/session.ts) | Calls session | HTTP |
| [src/storefront/web-app/router.ts](../../../../../../src/storefront/web-app/router.ts) | [src/storefront/web-app/cache.ts](../../../../../../src/storefront/web-app/cache.ts) | Reads cache | HTTP |
