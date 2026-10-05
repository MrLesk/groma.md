---
type: C4 Component
title: Accounts logger
status: stable
groma:
  id: accounts-logger
  parent: accounts
  code:
    - scanner: typescript
      file: src/identity/accounts/logger.ts
      symbol: logger
    - scanner: typescript
      file: src/identity/accounts/logger-1.ts
      symbol: logger
    - scanner: typescript
      file: src/identity/accounts/logger-2.ts
      symbol: logger
    - scanner: typescript
      file: src/identity/accounts/logger-3.ts
      symbol: logger
---

Accounts logger of Accounts.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/identity/accounts/logger.ts](../../../../../../src/identity/accounts/logger.ts) | [src/identity/accounts/client.ts](../../../../../../src/identity/accounts/client.ts) | Calls client | HTTP |
