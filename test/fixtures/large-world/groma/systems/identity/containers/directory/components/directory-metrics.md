---
type: C4 Component
title: Directory metrics
status: stable
groma:
  id: directory-metrics
  parent: directory
  code:
    - scanner: typescript
      file: src/identity/directory/metrics.ts
      symbol: metrics
    - scanner: typescript
      file: src/identity/directory/metrics-1.ts
      symbol: metrics
---

Directory metrics of Directory.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/identity/directory/metrics.ts](../../../../../../src/identity/directory/metrics.ts) | [src/identity/directory/config.ts](../../../../../../src/identity/directory/config.ts) | Calls config | HTTP |
| [src/identity/directory/metrics.ts](../../../../../../src/identity/directory/metrics.ts) | [src/identity/directory/logger.ts](../../../../../../src/identity/directory/logger.ts) | Reads logger | HTTP |
