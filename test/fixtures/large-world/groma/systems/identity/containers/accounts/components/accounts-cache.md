---
type: C4 Component
title: Accounts cache
status: stable
groma:
  id: accounts-cache
  parent: accounts
  group: Core
  code:
    - scanner: typescript
      file: src/identity/accounts/cache.ts
      symbol: cache
    - scanner: typescript
      file: src/identity/accounts/cache-1.ts
      symbol: cache
    - scanner: typescript
      file: src/identity/accounts/cache-2.ts
      symbol: cache
    - scanner: typescript
      file: src/identity/accounts/cache-3.ts
      symbol: cache
---

Accounts cache of Accounts.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/identity/accounts/cache.ts](../../../../../../src/identity/accounts/cache.ts) | [src/identity/accounts/validator.ts](../../../../../../src/identity/accounts/validator.ts) | Calls validator | HTTP |
| [src/identity/accounts/cache.ts](../../../../../../src/identity/accounts/cache.ts) | [src/identity/accounts/mapper.ts](../../../../../../src/identity/accounts/mapper.ts) | Reads mapper | HTTP |
