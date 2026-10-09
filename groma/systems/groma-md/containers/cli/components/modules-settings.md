---
type: C4 Component
title: Plugin settings
status: stable
groma:
  id: modules-settings
  parent: cli
  code:
    - scanner: typescript
      file: src/scanner/modules/settings.ts
    - scanner: typescript
      file: src/scanner/modules/settings-model.ts
    - scanner: typescript
      file: src/scanner/modules/setup.ts
  group: Scanner management
description: Builds shared settings state and applies plugin actions by kind
---

Combines scanner discovery and readiness with the explicitly selected work source and icon packs. The browser and terminal settings screens group plugins by kind and use the same add, update, remove and restore operations. Scanner recommendations remain scanner-specific.
