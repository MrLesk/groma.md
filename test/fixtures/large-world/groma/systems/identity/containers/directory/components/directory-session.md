---
type: C4 Component
title: Directory session
status: stable
groma:
  id: directory-session
  parent: directory
  group: Core
  code:
    - scanner: typescript
      file: src/identity/directory/session.ts
      symbol: session
    - scanner: typescript
      file: src/identity/directory/session-1.ts
      symbol: session
    - scanner: typescript
      file: src/identity/directory/session-2.ts
      symbol: session
---

Directory session of Directory.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/identity/directory/session.ts](../../../../../../src/identity/directory/session.ts) | [src/identity/directory/cache.ts](../../../../../../src/identity/directory/cache.ts) | Calls cache | HTTP |
| [src/identity/directory/session.ts](../../../../../../src/identity/directory/session.ts) | [src/identity/directory/validator.ts](../../../../../../src/identity/directory/validator.ts) | Reads validator | HTTP |
