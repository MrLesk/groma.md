---
type: C4 Component
title: Auth worker
status: stable
groma:
  id: auth-worker
  parent: auth
  group: Support
  code:
    - scanner: typescript
      file: src/identity/auth/worker.ts
      symbol: worker
    - scanner: typescript
      file: src/identity/auth/worker-1.ts
      symbol: worker
    - scanner: typescript
      file: src/identity/auth/worker-2.ts
      symbol: worker
    - scanner: typescript
      file: src/identity/auth/worker-3.ts
      symbol: worker
    - scanner: typescript
      file: src/identity/auth/worker-4.ts
      symbol: worker
---

Auth worker of Auth.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/identity/auth/worker.ts](../../../../../../src/identity/auth/worker.ts) | [src/identity/auth/scheduler.ts](../../../../../../src/identity/auth/scheduler.ts) | Calls scheduler | HTTP |
| [src/identity/auth/worker.ts](../../../../../../src/identity/auth/worker.ts) | [src/identity/auth/metrics.ts](../../../../../../src/identity/auth/metrics.ts) | Reads metrics | HTTP |
