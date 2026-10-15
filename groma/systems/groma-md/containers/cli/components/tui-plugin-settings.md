---
type: C4 Component
title: Terminal plugin settings
status: stable
groma:
  id: tui-plugin-settings
  parent: cli
  group: Terminal map
  code:
    - scanner: typescript
      file: src/viewers/tui/plugin-settings.ts
description: Shows plugins by kind and sends actions to the shared settings session
---

Lists the plugins of the project by kind: installed, missing and recommended scanners, then the work sources, where Backlog.md is listed or offered to add. Search, the details view and the add, update, remove, install and retry keys send their actions to the shared settings session, which changes config.json and reports each row again.
