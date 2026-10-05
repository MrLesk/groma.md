---
type: C4 Component
title: Accounts metrics
status: stable
groma:
  id: accounts-metrics
  parent: accounts
  code:
    - scanner: typescript
      file: src/identity/accounts/metrics.ts
      symbol: metrics
    - scanner: typescript
      file: src/identity/accounts/metrics-1.ts
      symbol: metrics
---

Accounts metrics of Accounts.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/identity/accounts/metrics.ts](../../../../../../src/identity/accounts/metrics.ts) | [src/identity/accounts/config.ts](../../../../../../src/identity/accounts/config.ts) | Calls config | HTTP |
| [src/identity/accounts/metrics.ts](../../../../../../src/identity/accounts/metrics.ts) | [src/identity/accounts/logger.ts](../../../../../../src/identity/accounts/logger.ts) | Reads logger | HTTP |
