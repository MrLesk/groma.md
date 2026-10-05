---
type: C4 Component
title: Session Store router
status: stable
groma:
  id: session-store-router
  parent: session-store
  group: Core
  code:
    - scanner: typescript
      file: src/storefront/session-store/router.ts
      symbol: router
    - scanner: typescript
      file: src/storefront/session-store/router-1.ts
      symbol: router
---

Session Store router of Session Store.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/storefront/session-store/router.ts](../../../../../../src/storefront/session-store/router.ts) | [src/storefront/session-store/session.ts](../../../../../../src/storefront/session-store/session.ts) | Calls session | HTTP |
| [src/storefront/session-store/router.ts](../../../../../../src/storefront/session-store/router.ts) | [src/storefront/session-store/cache.ts](../../../../../../src/storefront/session-store/cache.ts) | Reads cache | HTTP |
