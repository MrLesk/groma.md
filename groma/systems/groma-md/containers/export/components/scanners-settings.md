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

Lists the plugins of the project by kind inside Settings: the scanner groups with their detection evidence, then the selected work source. Shows state, offered updates and error details, and lets the user add, install, restore, update, remove or retry a plugin through the live data source.
