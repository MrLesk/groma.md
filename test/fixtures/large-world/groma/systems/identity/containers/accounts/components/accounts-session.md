---
type: C4 Component
title: Accounts session
status: stable
groma:
  id: accounts-session
  parent: accounts
  group: Core
  code:
    - scanner: typescript
      file: src/identity/accounts/session.ts
      symbol: session
    - scanner: typescript
      file: src/identity/accounts/session-1.ts
      symbol: session
    - scanner: typescript
      file: src/identity/accounts/session-2.ts
      symbol: session
---

Accounts session of Accounts.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/identity/accounts/session.ts](../../../../../../src/identity/accounts/session.ts) | [src/identity/accounts/cache.ts](../../../../../../src/identity/accounts/cache.ts) | Calls cache | HTTP |
| [src/identity/accounts/session.ts](../../../../../../src/identity/accounts/session.ts) | [src/identity/accounts/validator.ts](../../../../../../src/identity/accounts/validator.ts) | Reads validator | HTTP |
