---
type: C4 Component
title: Sessions scheduler
status: stable
groma:
  id: sessions-scheduler
  parent: sessions
  code:
    - scanner: typescript
      file: src/identity/sessions/scheduler.ts
      symbol: scheduler
---

Sessions scheduler of Sessions.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/identity/sessions/scheduler.ts](../../../../../../src/identity/sessions/scheduler.ts) | [src/identity/sessions/metrics.ts](../../../../../../src/identity/sessions/metrics.ts) | Calls metrics | HTTP |
| [src/identity/sessions/scheduler.ts](../../../../../../src/identity/sessions/scheduler.ts) | [src/identity/sessions/config.ts](../../../../../../src/identity/sessions/config.ts) | Reads config | HTTP |
