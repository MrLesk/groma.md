---
type: C4 Component
title: Audit worker
status: stable
groma:
  id: audit-worker
  parent: audit
  group: Support
  code:
    - scanner: typescript
      file: src/identity/audit/worker.ts
      symbol: worker
    - scanner: typescript
      file: src/identity/audit/worker-1.ts
      symbol: worker
    - scanner: typescript
      file: src/identity/audit/worker-2.ts
      symbol: worker
    - scanner: typescript
      file: src/identity/audit/worker-3.ts
      symbol: worker
    - scanner: typescript
      file: src/identity/audit/worker-4.ts
      symbol: worker
---

Audit worker of Audit.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/identity/audit/worker.ts](../../../../../../src/identity/audit/worker.ts) | [src/identity/audit/scheduler.ts](../../../../../../src/identity/audit/scheduler.ts) | Calls scheduler | HTTP |
| [src/identity/audit/worker.ts](../../../../../../src/identity/audit/worker.ts) | [src/identity/audit/metrics.ts](../../../../../../src/identity/audit/metrics.ts) | Reads metrics | HTTP |
