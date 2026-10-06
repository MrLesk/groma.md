---
type: C4 Component
title: Accounts router
status: stable
groma:
  id: accounts-router
  parent: accounts
  group: Core
  code:
    - scanner: typescript
      file: src/identity/accounts/router.ts
      symbol: router
    - scanner: typescript
      file: src/identity/accounts/router-1.ts
      symbol: router
---

Accounts router of Accounts.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/identity/accounts/router.ts](../../../../../../src/identity/accounts/router.ts) | [src/identity/accounts/session.ts](../../../../../../src/identity/accounts/session.ts) | Calls session | HTTP |
| [src/identity/accounts/router.ts](../../../../../../src/identity/accounts/router.ts) | [src/identity/accounts/cache.ts](../../../../../../src/identity/accounts/cache.ts) | Reads cache | HTTP |
