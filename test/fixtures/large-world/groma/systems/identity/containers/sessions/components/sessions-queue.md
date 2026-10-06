---
type: C4 Component
title: Sessions queue
status: stable
groma:
  id: sessions-queue
  parent: sessions
  group: Support
  code:
    - scanner: typescript
      file: src/identity/sessions/queue.ts
      symbol: queue
    - scanner: typescript
      file: src/identity/sessions/queue-1.ts
      symbol: queue
    - scanner: typescript
      file: src/identity/sessions/queue-2.ts
      symbol: queue
    - scanner: typescript
      file: src/identity/sessions/queue-3.ts
      symbol: queue
---

Sessions queue of Sessions.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/identity/sessions/queue.ts](../../../../../../src/identity/sessions/queue.ts) | [src/identity/sessions/worker.ts](../../../../../../src/identity/sessions/worker.ts) | Calls worker | HTTP |
| [src/identity/sessions/queue.ts](../../../../../../src/identity/sessions/queue.ts) | [src/identity/sessions/scheduler.ts](../../../../../../src/identity/sessions/scheduler.ts) | Reads scheduler | HTTP |
