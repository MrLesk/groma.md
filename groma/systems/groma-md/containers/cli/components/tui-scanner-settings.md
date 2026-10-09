---
type: C4 Component
title: Terminal plugin settings
status: stable
groma:
  id: tui-scanner-settings
  parent: cli
  code:
    - scanner: typescript
      file: src/viewers/tui/scanner-settings.ts
  group: Terminal map
description: Shows plugins by kind and sends actions to the shared settings session
---

Shows installed, missing, and recommended scanners. Sends user actions to the shared scanner settings session.
