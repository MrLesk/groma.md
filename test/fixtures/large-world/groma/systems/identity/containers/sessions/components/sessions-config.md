---
type: C4 Component
title: Sessions config
status: stable
groma:
  id: sessions-config
  parent: sessions
  code:
    - scanner: typescript
      file: src/identity/sessions/config.ts
      symbol: config
    - scanner: typescript
      file: src/identity/sessions/config-1.ts
      symbol: config
    - scanner: typescript
      file: src/identity/sessions/config-2.ts
      symbol: config
---

Sessions config of Sessions.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/identity/sessions/config.ts](../../../../../../src/identity/sessions/config.ts) | [src/identity/sessions/logger.ts](../../../../../../src/identity/sessions/logger.ts) | Calls logger | HTTP |
| [src/identity/sessions/config.ts](../../../../../../src/identity/sessions/config.ts) | [src/identity/sessions/client.ts](../../../../../../src/identity/sessions/client.ts) | Reads client | HTTP |
