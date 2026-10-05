---
type: C4 Component
title: Auth router
status: stable
groma:
  id: auth-router
  parent: auth
  group: Core
  code:
    - scanner: typescript
      file: src/identity/auth/router.ts
      symbol: router
    - scanner: typescript
      file: src/identity/auth/router-1.ts
      symbol: router
---

Auth router of Auth.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/identity/auth/router.ts](../../../../../../src/identity/auth/router.ts) | [src/identity/auth/session.ts](../../../../../../src/identity/auth/session.ts) | Calls session | HTTP |
| [src/identity/auth/router.ts](../../../../../../src/identity/auth/router.ts) | [src/identity/auth/cache.ts](../../../../../../src/identity/auth/cache.ts) | Reads cache | HTTP |
