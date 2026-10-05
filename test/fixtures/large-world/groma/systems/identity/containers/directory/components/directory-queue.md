---
type: C4 Component
title: Directory queue
status: stable
groma:
  id: directory-queue
  parent: directory
  group: Support
  code:
    - scanner: typescript
      file: src/identity/directory/queue.ts
      symbol: queue
    - scanner: typescript
      file: src/identity/directory/queue-1.ts
      symbol: queue
    - scanner: typescript
      file: src/identity/directory/queue-2.ts
      symbol: queue
    - scanner: typescript
      file: src/identity/directory/queue-3.ts
      symbol: queue
---

Directory queue of Directory.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/identity/directory/queue.ts](../../../../../../src/identity/directory/queue.ts) | [src/identity/directory/worker.ts](../../../../../../src/identity/directory/worker.ts) | Calls worker | HTTP |
| [src/identity/directory/queue.ts](../../../../../../src/identity/directory/queue.ts) | [src/identity/directory/scheduler.ts](../../../../../../src/identity/directory/scheduler.ts) | Reads scheduler | HTTP |
