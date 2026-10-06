---
type: C4 Component
title: Sessions router
status: stable
groma:
  id: sessions-router
  parent: sessions
  group: Core
  code:
    - scanner: typescript
      file: src/identity/sessions/router.ts
      symbol: router
    - scanner: typescript
      file: src/identity/sessions/router-1.ts
      symbol: router
---

Sessions router of Sessions.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/identity/sessions/router.ts](../../../../../../src/identity/sessions/router.ts) | [src/identity/sessions/session.ts](../../../../../../src/identity/sessions/session.ts) | Calls session | HTTP |
| [src/identity/sessions/router.ts](../../../../../../src/identity/sessions/router.ts) | [src/identity/sessions/cache.ts](../../../../../../src/identity/sessions/cache.ts) | Reads cache | HTTP |
