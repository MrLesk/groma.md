---
type: C4 Component
title: Map painting
status: stable
tags:
  - map
groma:
  id: map
  parent: export
  code:
    - scanner: typescript
      file: src/viewers/web/iso/painting/map.ts
    - scanner: typescript
      file: src/viewers/web/iso/painting/buildings.ts
    - scanner: typescript
      file: src/viewers/web/iso/painting/ground.ts
    - scanner: typescript
      file: src/viewers/web/iso/painting/routes.ts
      symbol: routesSvg
    - scanner: typescript
      file: src/viewers/web/iso/painting/style.ts
    - scanner: typescript
      file: src/viewers/web/iso/painting/svg.ts
    - scanner: typescript
      file: src/viewers/web/iso/painting/text.ts
    - scanner: typescript
      file: src/viewers/web/iso/painting/scale.ts
    - scanner: typescript
      file: src/viewers/web/iso/painting/glow.ts
    - scanner: typescript
      file: src/viewers/web/iso/painting/layer-planes.ts
    - scanner: typescript
      file: src/viewers/web/icons/objects.ts
      symbol: iconObjects
    - scanner: typescript
      file: src/viewers/web/icons/parts.ts
    - scanner: typescript
      file: src/viewers/web/iso/painting/icons.ts
    - scanner: typescript
      file: src/viewers/web/iso/painting/icon-camera.ts
    - scanner: typescript
      file: src/viewers/web/iso/painting/names.ts
    - scanner: typescript
      file: src/viewers/web/iso/painting/icon-faces.ts
    - scanner: typescript
      file: src/viewers/web/icons/objects/ai.ts
      symbol: aiIcons
    - scanner: typescript
      file: src/viewers/web/icons/objects/clients.ts
      symbol: clientsIcons
    - scanner: typescript
      file: src/viewers/web/icons/objects/commerce.ts
      symbol: commerceIcons
    - scanner: typescript
      file: src/viewers/web/icons/objects/compute.ts
      symbol: computeIcons
    - scanner: typescript
      file: src/viewers/web/icons/objects/media.ts
      symbol: mediaIcons
    - scanner: typescript
      file: src/viewers/web/icons/objects/messaging.ts
      symbol: messagingIcons
    - scanner: typescript
      file: src/viewers/web/icons/objects/data.ts
      symbol: dataIcons
    - scanner: typescript
      file: src/viewers/web/icons/objects/people.ts
      symbol: peopleIcons
    - scanner: typescript
      file: src/viewers/web/icons/objects/security.ts
      symbol: securityIcons
    - scanner: typescript
      file: src/viewers/web/icons/objects/shapes.ts
      symbol: shapesIcons
    - scanner: typescript
      file: src/viewers/web/icons/objects/shared-outlines.ts
    - scanner: typescript
      file: src/viewers/web/icons/objects/traffic.ts
      symbol: trafficIcons
    - scanner: typescript
      file: src/viewers/web/icons/objects/watching.ts
      symbol: watchingIcons
    - scanner: typescript
      file: src/viewers/web/icons/objects/tooling.ts
      symbol: toolingIcons
description: Paints the browser map as SVG buildings, routes and labels
---

Draws the map surfaces, buildings, labels, and connections as SVG. Applies selection and task emphasis.
