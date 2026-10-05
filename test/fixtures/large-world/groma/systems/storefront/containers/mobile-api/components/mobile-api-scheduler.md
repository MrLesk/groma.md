---
type: C4 Component
title: Mobile Api scheduler
status: stable
groma:
  id: mobile-api-scheduler
  parent: mobile-api
  code:
    - scanner: typescript
      file: src/storefront/mobile-api/scheduler.ts
      symbol: scheduler
---

Mobile Api scheduler of Mobile Api.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/storefront/mobile-api/scheduler.ts](../../../../../../src/storefront/mobile-api/scheduler.ts) | [src/storefront/mobile-api/metrics.ts](../../../../../../src/storefront/mobile-api/metrics.ts) | Calls metrics | HTTP |
| [src/storefront/mobile-api/scheduler.ts](../../../../../../src/storefront/mobile-api/scheduler.ts) | [src/storefront/mobile-api/config.ts](../../../../../../src/storefront/mobile-api/config.ts) | Reads config | HTTP |
