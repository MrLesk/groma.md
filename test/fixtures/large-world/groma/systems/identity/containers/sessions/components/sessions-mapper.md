---
type: C4 Component
title: Sessions mapper
status: stable
groma:
  id: sessions-mapper
  parent: sessions
  group: Support
  code:
    - scanner: typescript
      file: src/identity/sessions/mapper.ts
      symbol: mapper
---

Sessions mapper of Sessions.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/identity/sessions/mapper.ts](../../../../../../src/identity/sessions/mapper.ts) | [src/identity/sessions/reader.ts](../../../../../../src/identity/sessions/reader.ts) | Calls reader | HTTP |
| [src/identity/sessions/mapper.ts](../../../../../../src/identity/sessions/mapper.ts) | [src/identity/sessions/writer.ts](../../../../../../src/identity/sessions/writer.ts) | Reads writer | HTTP |
