---
type: C4 Component
title: Pricing writer
status: stable
groma:
  id: pricing-writer
  parent: pricing
  group: Support
  code:
    - scanner: typescript
      file: src/catalog/pricing/writer.ts
      symbol: writer
    - scanner: typescript
      file: src/catalog/pricing/writer-1.ts
      symbol: writer
    - scanner: typescript
      file: src/catalog/pricing/writer-2.ts
      symbol: writer
---

Pricing writer of Pricing.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/catalog/pricing/writer.ts](../../../../../../src/catalog/pricing/writer.ts) | [src/catalog/pricing/queue.ts](../../../../../../src/catalog/pricing/queue.ts) | Calls queue | HTTP |
| [src/catalog/pricing/writer.ts](../../../../../../src/catalog/pricing/writer.ts) | [src/catalog/pricing/worker.ts](../../../../../../src/catalog/pricing/worker.ts) | Reads worker | HTTP |
