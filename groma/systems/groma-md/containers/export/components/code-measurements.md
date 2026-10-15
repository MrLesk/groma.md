---
type: C4 Component
title: Code measurements
status: stable
groma:
  id: code-measurements
  parent: export
  code:
    - scanner: typescript
      file: src/viewers/web/metrics/control.ts
      symbol: createMetricsControl
    - scanner: typescript
      file: src/viewers/web/metrics/details.ts
      symbol: paintMetricDetails
  group: Browser controls
description: Colours live buildings by code history and identifies unusually large components
---

After the live map paints, requests code history for the selected commit window. Owns the Colour by setting, metric legend, building tints and outlier marks, and the runtime measurements shown in component details. Published maps contain no measurement controls or data.

## Derived relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/viewers/web/metrics/control.ts](../../../../../../src/viewers/web/metrics/control.ts) | [src/viewers/web/render.ts](../../../../../../src/viewers/web/render.ts) | Invokes supplied callbacks: generation, live, repaint, world | typescript |
