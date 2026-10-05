---
type: C4 Component
title: Pricing worker
status: stable
groma:
  id: pricing-worker
  parent: pricing
  group: Support
  code:
    - scanner: typescript
      file: src/catalog/pricing/worker.ts
      symbol: worker
    - scanner: typescript
      file: src/catalog/pricing/worker-1.ts
      symbol: worker
    - scanner: typescript
      file: src/catalog/pricing/worker-2.ts
      symbol: worker
    - scanner: typescript
      file: src/catalog/pricing/worker-3.ts
      symbol: worker
    - scanner: typescript
      file: src/catalog/pricing/worker-4.ts
      symbol: worker
---

Pricing worker of Pricing.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/catalog/pricing/worker.ts](../../../../../../src/catalog/pricing/worker.ts) | [src/catalog/pricing/scheduler.ts](../../../../../../src/catalog/pricing/scheduler.ts) | Calls scheduler | HTTP |
| [src/catalog/pricing/worker.ts](../../../../../../src/catalog/pricing/worker.ts) | [src/catalog/pricing/metrics.ts](../../../../../../src/catalog/pricing/metrics.ts) | Reads metrics | HTTP |
