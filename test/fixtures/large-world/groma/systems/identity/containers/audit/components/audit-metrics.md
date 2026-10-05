---
type: C4 Component
title: Audit metrics
status: stable
groma:
  id: audit-metrics
  parent: audit
  code:
    - scanner: typescript
      file: src/identity/audit/metrics.ts
      symbol: metrics
    - scanner: typescript
      file: src/identity/audit/metrics-1.ts
      symbol: metrics
---

Audit metrics of Audit.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/identity/audit/metrics.ts](../../../../../../src/identity/audit/metrics.ts) | [src/identity/audit/config.ts](../../../../../../src/identity/audit/config.ts) | Calls config | HTTP |
| [src/identity/audit/metrics.ts](../../../../../../src/identity/audit/metrics.ts) | [src/identity/audit/logger.ts](../../../../../../src/identity/audit/logger.ts) | Reads logger | HTTP |
