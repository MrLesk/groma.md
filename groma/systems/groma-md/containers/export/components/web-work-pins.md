---
type: C4 Component
title: Task map markers
status: stable
tags:
  - work
groma:
  id: web-work-pins
  parent: export
  code:
    - scanner: typescript
      file: src/viewers/web/work/pins.ts
    - scanner: typescript
      file: src/viewers/web/work/badge.ts
    - scanner: typescript
      file: src/viewers/web/work/backlog-mark.ts
description: Draws task markers on the components those tasks touch
---

Shows task markers on affected components. Moves completed task markers through their closing animation.
