---
type: C4 Component
title: Pricing reader
status: stable
groma:
  id: pricing-reader
  parent: pricing
  group: Support
  code:
    - scanner: typescript
      file: src/catalog/pricing/reader.ts
      symbol: reader
    - scanner: typescript
      file: src/catalog/pricing/reader-1.ts
      symbol: reader
---

Pricing reader of Pricing.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/catalog/pricing/reader.ts](../../../../../../src/catalog/pricing/reader.ts) | [src/catalog/pricing/writer.ts](../../../../../../src/catalog/pricing/writer.ts) | Calls writer | HTTP |
| [src/catalog/pricing/reader.ts](../../../../../../src/catalog/pricing/reader.ts) | [src/catalog/pricing/queue.ts](../../../../../../src/catalog/pricing/queue.ts) | Reads queue | HTTP |
