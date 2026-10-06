---
type: C4 Component
title: Terminal drawing
status: stable
groma:
  id: tui-paint
  parent: cli
  code:
    - scanner: typescript
      file: src/viewers/tui/paint.ts
      symbol: paintMap
    - scanner: typescript
      file: src/viewers/tui/organisms/world.ts
    - scanner: typescript
      file: src/viewers/tui/organisms/empty.ts
      symbol: drawEmptyWorld
    - scanner: typescript
      file: src/viewers/tui/atoms/cell.ts
      symbol: cell
    - scanner: typescript
      file: src/viewers/tui/atoms/text.ts
      symbol: text
    - scanner: typescript
      file: src/viewers/tui/atoms/theme.ts
    - scanner: typescript
      file: src/viewers/tui/atoms/visible.ts
      symbol: visible
    - scanner: typescript
      file: src/viewers/tui/molecules/building.ts
    - scanner: typescript
      file: src/viewers/tui/molecules/flow-marker.ts
      symbol: drawFlowMarker
    - scanner: typescript
      file: src/viewers/tui/molecules/route.ts
    - scanner: typescript
      file: src/viewers/tui/molecules/surface.ts
    - scanner: typescript
      file: src/viewers/tui/molecules/work-marker.ts
      symbol: drawWorkCorner
    - scanner: typescript
      file: src/viewers/tui/atoms/lines.ts
  group: Terminal map
description: Draws the terminal plan with box-drawing lines, names, arrows and pulses
---

Paints one projected depth into the map buffer: a dotted ground, island, container, group and component frames, and routes joined to those frames with box-drawing junctions. Writes names, collapsed counts, arrowheads and labels over the lines, lights the selection, flows and task work in the brand green, and moves pulses along lit routes. Applies the shared terminal styles.
