---
type: C4 Component
title: Audit queue
status: stable
groma:
  id: audit-queue
  parent: audit
  group: Support
  code:
    - scanner: typescript
      file: src/identity/audit/queue.ts
      symbol: queue
    - scanner: typescript
      file: src/identity/audit/queue-1.ts
      symbol: queue
    - scanner: typescript
      file: src/identity/audit/queue-2.ts
      symbol: queue
    - scanner: typescript
      file: src/identity/audit/queue-3.ts
      symbol: queue
---

Audit queue of Audit.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/identity/audit/queue.ts](../../../../../../src/identity/audit/queue.ts) | [src/identity/audit/worker.ts](../../../../../../src/identity/audit/worker.ts) | Calls worker | HTTP |
| [src/identity/audit/queue.ts](../../../../../../src/identity/audit/queue.ts) | [src/identity/audit/scheduler.ts](../../../../../../src/identity/audit/scheduler.ts) | Reads scheduler | HTTP |
