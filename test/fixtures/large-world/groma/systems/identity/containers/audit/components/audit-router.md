---
type: C4 Component
title: Audit router
status: stable
groma:
  id: audit-router
  parent: audit
  group: Core
  code:
    - scanner: typescript
      file: src/identity/audit/router.ts
      symbol: router
    - scanner: typescript
      file: src/identity/audit/router-1.ts
      symbol: router
---

Audit router of Audit.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/identity/audit/router.ts](../../../../../../src/identity/audit/router.ts) | [src/identity/audit/session.ts](../../../../../../src/identity/audit/session.ts) | Calls session | HTTP |
| [src/identity/audit/router.ts](../../../../../../src/identity/audit/router.ts) | [src/identity/audit/cache.ts](../../../../../../src/identity/audit/cache.ts) | Reads cache | HTTP |
