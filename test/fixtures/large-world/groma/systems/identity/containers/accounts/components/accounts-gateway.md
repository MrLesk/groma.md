---
type: C4 Component
title: Accounts gateway
status: stable
groma:
  id: accounts-gateway
  parent: accounts
  group: Core
  code:
    - scanner: typescript
      file: src/identity/accounts/gateway.ts
      symbol: gateway
---

Accounts gateway of Accounts.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/identity/accounts/gateway.ts](../../../../../../src/identity/accounts/gateway.ts) | [src/identity/accounts/router.ts](../../../../../../src/identity/accounts/router.ts) | Calls router | HTTP |
| [src/identity/accounts/gateway.ts](../../../../../../src/identity/accounts/gateway.ts) | [src/identity/accounts/session.ts](../../../../../../src/identity/accounts/session.ts) | Reads session | HTTP |
| [src/identity/accounts/gateway.ts](../../../../../../src/identity/accounts/gateway.ts) | [src/identity/auth/gateway.ts](../../../../../../src/identity/auth/gateway.ts) | Forwards requests | HTTP |
