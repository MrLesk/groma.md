---
type: C4 Component
title: Accounts mapper
status: stable
groma:
  id: accounts-mapper
  parent: accounts
  group: Support
  code:
    - scanner: typescript
      file: src/identity/accounts/mapper.ts
      symbol: mapper
---

Accounts mapper of Accounts.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/identity/accounts/mapper.ts](../../../../../../src/identity/accounts/mapper.ts) | [src/identity/accounts/reader.ts](../../../../../../src/identity/accounts/reader.ts) | Calls reader | HTTP |
| [src/identity/accounts/mapper.ts](../../../../../../src/identity/accounts/mapper.ts) | [src/identity/accounts/writer.ts](../../../../../../src/identity/accounts/writer.ts) | Reads writer | HTTP |
