---
type: C4 Component
title: Pricing queue
status: stable
groma:
  id: pricing-queue
  parent: pricing
  group: Support
  code:
    - scanner: typescript
      file: src/catalog/pricing/queue.ts
      symbol: queue
    - scanner: typescript
      file: src/catalog/pricing/queue-1.ts
      symbol: queue
    - scanner: typescript
      file: src/catalog/pricing/queue-2.ts
      symbol: queue
    - scanner: typescript
      file: src/catalog/pricing/queue-3.ts
      symbol: queue
---

Pricing queue of Pricing.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/catalog/pricing/queue.ts](../../../../../../src/catalog/pricing/queue.ts) | [src/catalog/pricing/worker.ts](../../../../../../src/catalog/pricing/worker.ts) | Calls worker | HTTP |
| [src/catalog/pricing/queue.ts](../../../../../../src/catalog/pricing/queue.ts) | [src/catalog/pricing/scheduler.ts](../../../../../../src/catalog/pricing/scheduler.ts) | Reads scheduler | HTTP |
