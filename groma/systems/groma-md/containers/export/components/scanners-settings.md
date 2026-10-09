---
type: C4 Component
title: Plugin settings panel
status: stable
groma:
  id: scanners-settings
  parent: export
  code:
    - scanner: typescript
      file: src/viewers/web/scanners/settings.ts
    - scanner: typescript
      file: src/viewers/web/scanners/name.ts
      symbol: scannerName
  group: Browser controls
description: Browser panel for project plugin installation, updates and readiness
---

Shows scanner state and error details. Lets the user install, update, remove, or retry a scanner.
