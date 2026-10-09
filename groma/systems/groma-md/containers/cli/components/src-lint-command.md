---
type: C4 Component
title: Lint command
status: stable
groma:
  id: src-lint-command
  parent: cli
  code:
    - scanner: typescript
      file: src/lint-command.ts
      symbol: registerLintCommand
  group: Project commands
description: Reports possible duplicate logic from current scanner evidence
---

Registers groma lint and reports possible duplicate logic from current scanner evidence. Reads tasks through the configured work source and reports each in-progress or done task that modifies a critical component. Reports findings and scan failures through the command exit status without changing saved architecture.
