---
type: C4 Component
title: Sessions session
status: stable
groma:
  id: sessions-session
  parent: sessions
  group: Core
  code:
    - scanner: typescript
      file: src/identity/sessions/session.ts
      symbol: session
    - scanner: typescript
      file: src/identity/sessions/session-1.ts
      symbol: session
    - scanner: typescript
      file: src/identity/sessions/session-2.ts
      symbol: session
---

Sessions session of Sessions.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/identity/sessions/session.ts](../../../../../../src/identity/sessions/session.ts) | [src/identity/sessions/cache.ts](../../../../../../src/identity/sessions/cache.ts) | Calls cache | HTTP |
| [src/identity/sessions/session.ts](../../../../../../src/identity/sessions/session.ts) | [src/identity/sessions/validator.ts](../../../../../../src/identity/sessions/validator.ts) | Reads validator | HTTP |
