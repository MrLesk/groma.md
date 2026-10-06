---
type: C4 Component
title: Accounts scheduler
status: stable
groma:
  id: accounts-scheduler
  parent: accounts
  code:
    - scanner: typescript
      file: src/identity/accounts/scheduler.ts
      symbol: scheduler
---

Accounts scheduler of Accounts.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/identity/accounts/scheduler.ts](../../../../../../src/identity/accounts/scheduler.ts) | [src/identity/accounts/metrics.ts](../../../../../../src/identity/accounts/metrics.ts) | Calls metrics | HTTP |
| [src/identity/accounts/scheduler.ts](../../../../../../src/identity/accounts/scheduler.ts) | [src/identity/accounts/config.ts](../../../../../../src/identity/accounts/config.ts) | Reads config | HTTP |
