---
type: C4 Component
title: Audit scheduler
status: stable
groma:
  id: audit-scheduler
  parent: audit
  code:
    - scanner: typescript
      file: src/identity/audit/scheduler.ts
      symbol: scheduler
---

Audit scheduler of Audit.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/identity/audit/scheduler.ts](../../../../../../src/identity/audit/scheduler.ts) | [src/identity/audit/metrics.ts](../../../../../../src/identity/audit/metrics.ts) | Calls metrics | HTTP |
| [src/identity/audit/scheduler.ts](../../../../../../src/identity/audit/scheduler.ts) | [src/identity/audit/config.ts](../../../../../../src/identity/audit/config.ts) | Reads config | HTTP |
