---
type: C4 Component
title: Architecture plans
status: stable
groma:
  id: plan
  parent: cli
  code:
    - scanner: typescript
      file: src/plan.ts
  group: Architecture records
description: Shares selected architecture as portable OKF drafts
---

Exports selected C4 responsibilities, their internal relationships and flows as ordinary OKF Markdown without source ownership or layout. Import resolves existing parents, validates IDs and the complete architecture before saving, and writes ghosts at their canonical paths under one named draft record. The command line exports to any new directory; the browser multi-selection exports only into a new directory inside the repository. Scanner matching and element acceptance retain their existing responsibilities.
