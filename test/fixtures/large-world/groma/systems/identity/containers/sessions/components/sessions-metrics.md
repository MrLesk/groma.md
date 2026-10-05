---
type: C4 Component
title: Sessions metrics
status: stable
groma:
  id: sessions-metrics
  parent: sessions
  code:
    - scanner: typescript
      file: src/identity/sessions/metrics.ts
      symbol: metrics
    - scanner: typescript
      file: src/identity/sessions/metrics-1.ts
      symbol: metrics
---

Sessions metrics of Sessions.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/identity/sessions/metrics.ts](../../../../../../src/identity/sessions/metrics.ts) | [src/identity/sessions/config.ts](../../../../../../src/identity/sessions/config.ts) | Calls config | HTTP |
| [src/identity/sessions/metrics.ts](../../../../../../src/identity/sessions/metrics.ts) | [src/identity/sessions/logger.ts](../../../../../../src/identity/sessions/logger.ts) | Reads logger | HTTP |
