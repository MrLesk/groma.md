---
type: C4 Component
title: Auth scheduler
status: stable
groma:
  id: auth-scheduler
  parent: auth
  code:
    - scanner: typescript
      file: src/identity/auth/scheduler.ts
      symbol: scheduler
---

Auth scheduler of Auth.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/identity/auth/scheduler.ts](../../../../../../src/identity/auth/scheduler.ts) | [src/identity/auth/metrics.ts](../../../../../../src/identity/auth/metrics.ts) | Calls metrics | HTTP |
| [src/identity/auth/scheduler.ts](../../../../../../src/identity/auth/scheduler.ts) | [src/identity/auth/config.ts](../../../../../../src/identity/auth/config.ts) | Reads config | HTTP |
