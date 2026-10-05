---
type: C4 Component
title: Sessions
status: stable
groma:
  id: sessions
  parent: api
  code:
    - scanner: typescript
      file: src/sessions.ts
---

Stores sessions.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/sessions.ts](../../../../../../src/sessions.ts) | [src/talks.ts](../../../../../../src/talks.ts) | Pushes schedule changes | Webhook |
