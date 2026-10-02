---
type: C4 Component
title: Terminal projection
status: stable
groma:
  id: projection
  parent: cli
  code:
    - scanner: typescript
      file: src/viewers/tui/projection.ts
    - scanner: typescript
      file: src/viewers/tui/projection-camera.ts
    - scanner: typescript
      file: src/viewers/tui/projection-routes.ts
    - scanner: typescript
      file: src/viewers/tui/layout.ts
    - scanner: typescript
      file: src/viewers/tui/projection-sheet.ts
    - scanner: typescript
      file: src/viewers/tui/projection-motion.ts
    - scanner: typescript
      file: src/viewers/tui/projection-spacing.ts
  group: Terminal map
description: Lays out the shared sheet as a terminal plan for one zoom depth
---

Receives the shared sheet, the terminal selection and the map size. Decides what the current depth draws: root shows islands with collapsed containers, a container scope opens one container and, when it does not fit the map, only the selected component group. Keeps every shape on its sheet side and inside its parent while giving each box the cells its name needs, asks the sheet router for the routes between the drawn ends, and moves the camera to keep the selection in view. Each depth is laid out once per sheet; the terminal drawing paints it and animates between depths.
