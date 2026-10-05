---
type: C4 Component
title: Auth metrics
status: stable
groma:
  id: auth-metrics
  parent: auth
  code:
    - scanner: typescript
      file: src/identity/auth/metrics.ts
      symbol: metrics
    - scanner: typescript
      file: src/identity/auth/metrics-1.ts
      symbol: metrics
---

Auth metrics of Auth.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/identity/auth/metrics.ts](../../../../../../src/identity/auth/metrics.ts) | [src/identity/auth/config.ts](../../../../../../src/identity/auth/config.ts) | Calls config | HTTP |
| [src/identity/auth/metrics.ts](../../../../../../src/identity/auth/metrics.ts) | [src/identity/auth/logger.ts](../../../../../../src/identity/auth/logger.ts) | Reads logger | HTTP |
