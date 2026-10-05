---
type: C4 Component
title: Web App writer
status: stable
groma:
  id: web-app-writer
  parent: web-app
  group: Support
  code:
    - scanner: typescript
      file: src/storefront/web-app/writer.ts
      symbol: writer
    - scanner: typescript
      file: src/storefront/web-app/writer-1.ts
      symbol: writer
    - scanner: typescript
      file: src/storefront/web-app/writer-2.ts
      symbol: writer
---

Web App writer of Web App.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/storefront/web-app/writer.ts](../../../../../../src/storefront/web-app/writer.ts) | [src/storefront/web-app/queue.ts](../../../../../../src/storefront/web-app/queue.ts) | Calls queue | HTTP |
| [src/storefront/web-app/writer.ts](../../../../../../src/storefront/web-app/writer.ts) | [src/storefront/web-app/worker.ts](../../../../../../src/storefront/web-app/worker.ts) | Reads worker | HTTP |
