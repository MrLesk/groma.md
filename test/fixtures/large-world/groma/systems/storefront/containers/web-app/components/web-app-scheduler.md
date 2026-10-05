---
type: C4 Component
title: Web App scheduler
status: stable
groma:
  id: web-app-scheduler
  parent: web-app
  code:
    - scanner: typescript
      file: src/storefront/web-app/scheduler.ts
      symbol: scheduler
---

Web App scheduler of Web App.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/storefront/web-app/scheduler.ts](../../../../../../src/storefront/web-app/scheduler.ts) | [src/storefront/web-app/metrics.ts](../../../../../../src/storefront/web-app/metrics.ts) | Calls metrics | HTTP |
| [src/storefront/web-app/scheduler.ts](../../../../../../src/storefront/web-app/scheduler.ts) | [src/storefront/web-app/config.ts](../../../../../../src/storefront/web-app/config.ts) | Reads config | HTTP |
