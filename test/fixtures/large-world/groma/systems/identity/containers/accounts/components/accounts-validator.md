---
type: C4 Component
title: Accounts validator
status: stable
groma:
  id: accounts-validator
  parent: accounts
  group: Core
  code:
    - scanner: typescript
      file: src/identity/accounts/validator.ts
      symbol: validator
    - scanner: typescript
      file: src/identity/accounts/validator-1.ts
      symbol: validator
    - scanner: typescript
      file: src/identity/accounts/validator-2.ts
      symbol: validator
    - scanner: typescript
      file: src/identity/accounts/validator-3.ts
      symbol: validator
    - scanner: typescript
      file: src/identity/accounts/validator-4.ts
      symbol: validator
---

Accounts validator of Accounts.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/identity/accounts/validator.ts](../../../../../../src/identity/accounts/validator.ts) | [src/identity/accounts/mapper.ts](../../../../../../src/identity/accounts/mapper.ts) | Calls mapper | HTTP |
| [src/identity/accounts/validator.ts](../../../../../../src/identity/accounts/validator.ts) | [src/identity/accounts/reader.ts](../../../../../../src/identity/accounts/reader.ts) | Reads reader | HTTP |
