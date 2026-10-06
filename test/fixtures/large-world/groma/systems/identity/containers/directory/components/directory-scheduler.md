---
type: C4 Component
title: Directory scheduler
status: stable
groma:
  id: directory-scheduler
  parent: directory
  code:
    - scanner: typescript
      file: src/identity/directory/scheduler.ts
      symbol: scheduler
---

Directory scheduler of Directory.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/identity/directory/scheduler.ts](../../../../../../src/identity/directory/scheduler.ts) | [src/identity/directory/metrics.ts](../../../../../../src/identity/directory/metrics.ts) | Calls metrics | HTTP |
| [src/identity/directory/scheduler.ts](../../../../../../src/identity/directory/scheduler.ts) | [src/identity/directory/config.ts](../../../../../../src/identity/directory/config.ts) | Reads config | HTTP |
