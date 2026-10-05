---
type: C4 Component
title: Page
status: stable
groma:
  id: page
  parent: web
  group: Pages
  code:
    - scanner: typescript
      file: src/page.ts
---

Renders the order.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/page.ts](../../../../../../src/page.ts) | [src/orders.ts](../../../../../../src/orders.ts) | Reads the order | In-process data |
