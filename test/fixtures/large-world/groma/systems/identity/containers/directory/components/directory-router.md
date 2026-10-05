---
type: C4 Component
title: Directory router
status: stable
groma:
  id: directory-router
  parent: directory
  group: Core
  code:
    - scanner: typescript
      file: src/identity/directory/router.ts
      symbol: router
    - scanner: typescript
      file: src/identity/directory/router-1.ts
      symbol: router
---

Directory router of Directory.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/identity/directory/router.ts](../../../../../../src/identity/directory/router.ts) | [src/identity/directory/session.ts](../../../../../../src/identity/directory/session.ts) | Calls session | HTTP |
| [src/identity/directory/router.ts](../../../../../../src/identity/directory/router.ts) | [src/identity/directory/cache.ts](../../../../../../src/identity/directory/cache.ts) | Reads cache | HTTP |
