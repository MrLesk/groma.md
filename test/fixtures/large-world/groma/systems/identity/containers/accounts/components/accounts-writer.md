---
type: C4 Component
title: Accounts writer
status: stable
groma:
  id: accounts-writer
  parent: accounts
  group: Support
  code:
    - scanner: typescript
      file: src/identity/accounts/writer.ts
      symbol: writer
    - scanner: typescript
      file: src/identity/accounts/writer-1.ts
      symbol: writer
    - scanner: typescript
      file: src/identity/accounts/writer-2.ts
      symbol: writer
---

Accounts writer of Accounts.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/identity/accounts/writer.ts](../../../../../../src/identity/accounts/writer.ts) | [src/identity/accounts/queue.ts](../../../../../../src/identity/accounts/queue.ts) | Calls queue | HTTP |
| [src/identity/accounts/writer.ts](../../../../../../src/identity/accounts/writer.ts) | [src/identity/accounts/worker.ts](../../../../../../src/identity/accounts/worker.ts) | Reads worker | HTTP |
