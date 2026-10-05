---
type: C4 Component
title: Audit config
status: stable
groma:
  id: audit-config
  parent: audit
  code:
    - scanner: typescript
      file: src/identity/audit/config.ts
      symbol: config
    - scanner: typescript
      file: src/identity/audit/config-1.ts
      symbol: config
    - scanner: typescript
      file: src/identity/audit/config-2.ts
      symbol: config
---

Audit config of Audit.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/identity/audit/config.ts](../../../../../../src/identity/audit/config.ts) | [src/identity/audit/logger.ts](../../../../../../src/identity/audit/logger.ts) | Calls logger | HTTP |
| [src/identity/audit/config.ts](../../../../../../src/identity/audit/config.ts) | [src/identity/audit/client.ts](../../../../../../src/identity/audit/client.ts) | Reads client | HTTP |
