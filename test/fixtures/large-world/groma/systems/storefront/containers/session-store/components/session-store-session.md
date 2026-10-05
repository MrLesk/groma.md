---
type: C4 Component
title: Session Store session
status: stable
groma:
  id: session-store-session
  parent: session-store
  group: Core
  code:
    - scanner: typescript
      file: src/storefront/session-store/session.ts
      symbol: session
    - scanner: typescript
      file: src/storefront/session-store/session-1.ts
      symbol: session
    - scanner: typescript
      file: src/storefront/session-store/session-2.ts
      symbol: session
---

Session Store session of Session Store.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/storefront/session-store/session.ts](../../../../../../src/storefront/session-store/session.ts) | [src/storefront/session-store/cache.ts](../../../../../../src/storefront/session-store/cache.ts) | Calls cache | HTTP |
| [src/storefront/session-store/session.ts](../../../../../../src/storefront/session-store/session.ts) | [src/storefront/session-store/validator.ts](../../../../../../src/storefront/session-store/validator.ts) | Reads validator | HTTP |
