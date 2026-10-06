---
type: C4 Component
title: Web App metrics
status: stable
groma:
  id: web-app-metrics
  parent: web-app
  code:
    - scanner: typescript
      file: src/storefront/web-app/metrics.ts
      symbol: metrics
    - scanner: typescript
      file: src/storefront/web-app/metrics-1.ts
      symbol: metrics
---

Web App metrics of Web App.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/storefront/web-app/metrics.ts](../../../../../../src/storefront/web-app/metrics.ts) | [src/storefront/web-app/config.ts](../../../../../../src/storefront/web-app/config.ts) | Calls config | HTTP |
| [src/storefront/web-app/metrics.ts](../../../../../../src/storefront/web-app/metrics.ts) | [src/storefront/web-app/logger.ts](../../../../../../src/storefront/web-app/logger.ts) | Reads logger | HTTP |
