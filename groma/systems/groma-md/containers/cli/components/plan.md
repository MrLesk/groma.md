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

Exports selected C4 responsibilities, their internal relationships and flows as ordinary OKF Markdown without source ownership or layout. Import resolves existing parents, validates IDs and the complete architecture before saving, and writes ghosts at their canonical paths under one named draft record. The shared authoring API exposes the same operation to command-line users and browser multi-selection. Scanner matching and element acceptance retain their existing responsibilities.
