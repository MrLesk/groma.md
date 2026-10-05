---
type: C4 Component
title: Web App session
status: stable
groma:
  id: web-app-session
  parent: web-app
  group: Core
  code:
    - scanner: typescript
      file: src/storefront/web-app/session.ts
      symbol: session
    - scanner: typescript
      file: src/storefront/web-app/session-1.ts
      symbol: session
    - scanner: typescript
      file: src/storefront/web-app/session-2.ts
      symbol: session
---

Web App session of Web App.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/storefront/web-app/session.ts](../../../../../../src/storefront/web-app/session.ts) | [src/storefront/web-app/cache.ts](../../../../../../src/storefront/web-app/cache.ts) | Calls cache | HTTP |
| [src/storefront/web-app/session.ts](../../../../../../src/storefront/web-app/session.ts) | [src/storefront/web-app/validator.ts](../../../../../../src/storefront/web-app/validator.ts) | Reads validator | HTTP |
