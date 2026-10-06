---
type: C4 Component
title: Directory config
status: stable
groma:
  id: directory-config
  parent: directory
  code:
    - scanner: typescript
      file: src/identity/directory/config.ts
      symbol: config
    - scanner: typescript
      file: src/identity/directory/config-1.ts
      symbol: config
    - scanner: typescript
      file: src/identity/directory/config-2.ts
      symbol: config
---

Directory config of Directory.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/identity/directory/config.ts](../../../../../../src/identity/directory/config.ts) | [src/identity/directory/logger.ts](../../../../../../src/identity/directory/logger.ts) | Calls logger | HTTP |
| [src/identity/directory/config.ts](../../../../../../src/identity/directory/config.ts) | [src/identity/directory/client.ts](../../../../../../src/identity/directory/client.ts) | Reads client | HTTP |
