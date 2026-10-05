---
type: C4 Component
title: Directory worker
status: stable
groma:
  id: directory-worker
  parent: directory
  group: Support
  code:
    - scanner: typescript
      file: src/identity/directory/worker.ts
      symbol: worker
    - scanner: typescript
      file: src/identity/directory/worker-1.ts
      symbol: worker
    - scanner: typescript
      file: src/identity/directory/worker-2.ts
      symbol: worker
    - scanner: typescript
      file: src/identity/directory/worker-3.ts
      symbol: worker
    - scanner: typescript
      file: src/identity/directory/worker-4.ts
      symbol: worker
---

Directory worker of Directory.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/identity/directory/worker.ts](../../../../../../src/identity/directory/worker.ts) | [src/identity/directory/scheduler.ts](../../../../../../src/identity/directory/scheduler.ts) | Calls scheduler | HTTP |
| [src/identity/directory/worker.ts](../../../../../../src/identity/directory/worker.ts) | [src/identity/directory/metrics.ts](../../../../../../src/identity/directory/metrics.ts) | Reads metrics | HTTP |
