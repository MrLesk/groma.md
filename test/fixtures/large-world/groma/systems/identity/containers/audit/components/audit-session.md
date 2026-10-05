---
type: C4 Component
title: Audit session
status: stable
groma:
  id: audit-session
  parent: audit
  group: Core
  code:
    - scanner: typescript
      file: src/identity/audit/session.ts
      symbol: session
    - scanner: typescript
      file: src/identity/audit/session-1.ts
      symbol: session
    - scanner: typescript
      file: src/identity/audit/session-2.ts
      symbol: session
---

Audit session of Audit.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/identity/audit/session.ts](../../../../../../src/identity/audit/session.ts) | [src/identity/audit/cache.ts](../../../../../../src/identity/audit/cache.ts) | Calls cache | HTTP |
| [src/identity/audit/session.ts](../../../../../../src/identity/audit/session.ts) | [src/identity/audit/validator.ts](../../../../../../src/identity/audit/validator.ts) | Reads validator | HTTP |
