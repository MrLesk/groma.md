---
type: C4 Component
title: Plugin settings
status: stable
groma:
  id: plugin-settings
  parent: cli
  code:
    - scanner: typescript
      file: src/scanner/modules/settings.ts
    - scanner: typescript
      file: src/scanner/modules/setup.ts
    - scanner: typescript
      file: src/plugins/settings.ts
    - scanner: typescript
      file: src/plugins/settings-model.ts
  group: Plugins
description: Builds shared settings state and applies plugin actions by kind
---

Combines scanner discovery and readiness with the explicitly selected work source. The browser and terminal settings screens group plugins by kind and use the same add, update, remove and restore operations. Scanner recommendations remain scanner-specific.
