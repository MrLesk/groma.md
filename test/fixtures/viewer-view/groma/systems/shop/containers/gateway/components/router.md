---
type: C4 Component
title: Router
status: stable
groma:
  id: router
  parent: gateway
  code:
    - scanner: typescript
      file: src/router.ts
---

Sends each request to its handler.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/router.ts](../../../../../../src/router.ts) | [src/orders.ts](../../../../../../src/orders.ts) | Forwards order requests | In-process call |
