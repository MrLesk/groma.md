---
type: C4 Component
title: Accounts config
status: stable
groma:
  id: accounts-config
  parent: accounts
  code:
    - scanner: typescript
      file: src/identity/accounts/config.ts
      symbol: config
    - scanner: typescript
      file: src/identity/accounts/config-1.ts
      symbol: config
    - scanner: typescript
      file: src/identity/accounts/config-2.ts
      symbol: config
---

Accounts config of Accounts.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/identity/accounts/config.ts](../../../../../../src/identity/accounts/config.ts) | [src/identity/accounts/logger.ts](../../../../../../src/identity/accounts/logger.ts) | Calls logger | HTTP |
| [src/identity/accounts/config.ts](../../../../../../src/identity/accounts/config.ts) | [src/identity/accounts/client.ts](../../../../../../src/identity/accounts/client.ts) | Reads client | HTTP |
