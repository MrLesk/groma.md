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
description: Reports possible duplicate logic and unknown icon names
---

Registers groma lint. Checks current scanner evidence for possible duplicate logic and lists the elements whose icon no installed pack resolves. Reports findings and scan failures through the command exit status without changing saved architecture.
