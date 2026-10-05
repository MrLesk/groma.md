---
type: C4 Component
title: Accounts reader
status: stable
groma:
  id: accounts-reader
  parent: accounts
  group: Support
  code:
    - scanner: typescript
      file: src/identity/accounts/reader.ts
      symbol: reader
    - scanner: typescript
      file: src/identity/accounts/reader-1.ts
      symbol: reader
---

Accounts reader of Accounts.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/identity/accounts/reader.ts](../../../../../../src/identity/accounts/reader.ts) | [src/identity/accounts/writer.ts](../../../../../../src/identity/accounts/writer.ts) | Calls writer | HTTP |
| [src/identity/accounts/reader.ts](../../../../../../src/identity/accounts/reader.ts) | [src/identity/accounts/queue.ts](../../../../../../src/identity/accounts/queue.ts) | Reads queue | HTTP |
