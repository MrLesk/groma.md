---
type: C4 Component
title: Auth queue
status: stable
groma:
  id: auth-queue
  parent: auth
  group: Support
  code:
    - scanner: typescript
      file: src/identity/auth/queue.ts
      symbol: queue
    - scanner: typescript
      file: src/identity/auth/queue-1.ts
      symbol: queue
    - scanner: typescript
      file: src/identity/auth/queue-2.ts
      symbol: queue
    - scanner: typescript
      file: src/identity/auth/queue-3.ts
      symbol: queue
---

Auth queue of Auth.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/identity/auth/queue.ts](../../../../../../src/identity/auth/queue.ts) | [src/identity/auth/worker.ts](../../../../../../src/identity/auth/worker.ts) | Calls worker | HTTP |
| [src/identity/auth/queue.ts](../../../../../../src/identity/auth/queue.ts) | [src/identity/auth/scheduler.ts](../../../../../../src/identity/auth/scheduler.ts) | Reads scheduler | HTTP |
