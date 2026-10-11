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

Exports selected C4 elements as ordinary OKF Markdown without source ownership or layout: each document's body as written, the relationships inside the selection as draft rows, and the flows that stay inside it. Import resolves existing parents, validates IDs and the complete architecture before saving, and writes software as ghosts and people and external systems as stable declarations at their canonical paths, all tagged with one named draft record. Export never writes into the Groma directory; the command line may use any other new directory, and the browser multi-selection only one inside the repository. Scanner matching and element acceptance retain their existing responsibilities.
