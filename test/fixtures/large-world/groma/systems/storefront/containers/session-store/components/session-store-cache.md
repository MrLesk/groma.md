---
type: C4 Component
title: Session Store cache
status: stable
groma:
  id: session-store-cache
  parent: session-store
  group: Core
  code:
    - scanner: typescript
      file: src/storefront/session-store/cache.ts
      symbol: cache
    - scanner: typescript
      file: src/storefront/session-store/cache-1.ts
      symbol: cache
    - scanner: typescript
      file: src/storefront/session-store/cache-2.ts
      symbol: cache
    - scanner: typescript
      file: src/storefront/session-store/cache-3.ts
      symbol: cache
---

Session Store cache of Session Store.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/storefront/session-store/cache.ts](../../../../../../src/storefront/session-store/cache.ts) | [src/storefront/session-store/validator.ts](../../../../../../src/storefront/session-store/validator.ts) | Calls validator | HTTP |
| [src/storefront/session-store/cache.ts](../../../../../../src/storefront/session-store/cache.ts) | [src/storefront/session-store/mapper.ts](../../../../../../src/storefront/session-store/mapper.ts) | Reads mapper | HTTP |
