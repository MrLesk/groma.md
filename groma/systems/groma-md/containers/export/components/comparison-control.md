---
type: C4 Component
title: Comparison panel
status: stable
groma:
  id: comparison-control
  parent: export
  code:
    - scanner: typescript
      file: src/viewers/web/comparison/control.ts
    - scanner: typescript
      file: src/viewers/web/comparison/tree.ts
  group: Architecture panels
  icon: groma:component
  color: '#C87966'
description: Shows the changed architecture and source files between two revisions
---

Shows the architecture elements and source files that changed between two Git revisions.
