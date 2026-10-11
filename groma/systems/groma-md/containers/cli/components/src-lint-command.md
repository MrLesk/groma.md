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
description: Reports critical task changes, possible duplicate logic and unknown icon names
---

Registers groma lint. Reads tasks once through the work source that plugins.json selects and reports each in-progress or done task that changes a critical component; a selected work source that cannot be read is an error. Checks current scanner evidence for possible duplicate logic and lists the elements whose icon no installed pack resolves. Reports findings and scan failures through the command exit status without changing saved architecture.
