---
id: TASK-637
title: 'Assign named colors to actors, systems, containers and components'
status: In Progress
assignee:
  - '@claude'
created_date: '2026-10-28T20:33:00Z'
updated_date: '2026-11-09T22:36:00Z'
labels:
  - personalization
milestone: m-6
dependencies:
  - TASK-639
references:
  - src/architecture-model.ts
  - src/authoring.ts
  - src/edit.ts
  - src/group.ts
  - src/markdown-emitter.ts
  - src/viewers/web/iso/painting/style.ts
  - src/viewers/web/iso/painting/buildings.ts
documentation:
  - ROADMAP.md
  - docs/component-markdown.md
  - docs/product-model.md
modified_files:
  - src/colors.ts
  - src/types.ts
  - src/architecture-model.ts
  - src/core.ts
  - src/markdown-emitter.ts
  - src/edit.ts
  - src/curate.ts
  - src/write-commands.ts
  - src/plain-world.ts
  - src/history/comparison.ts
  - src/viewers/web/comparison/details.ts
  - src/sheet/types.ts
  - src/sheet/place.ts
  - src/viewers/web/atoms/theme.ts
  - src/viewers/web/iso/painting/scale.ts
  - src/viewers/web/iso/painting/style.ts
  - src/viewers/web/iso/painting/svg.ts
  - src/viewers/web/iso/painting/buildings.ts
  - src/viewers/web/iso/painting/ground.ts
  - src/viewers/web/organisms/color-swatches.ts
  - src/viewers/web/organisms/writes.ts
  - src/viewers/web/authoring.ts
  - src/viewers/web/organisms/details.ts
  - src/viewers/web/page.ts
  - test-bun/architecture-color.test.ts
  - test/architecture-model.test.ts
  - test/architecture-model-errors.test.ts
  - test-bun/editing.test.ts
  - docs/component-markdown.md
  - docs/viewers/web/index.md
  - docs/agent-instructions/describe.md
  - src/instructions.ts
  - docs/product-model.md
  - groma/systems/groma-md/containers/cli/components/src-architecture-model.md
  - groma/systems/groma-md/containers/cli/container.md
  - groma/systems/groma-md/containers/csharp-worker/container.md
  - groma/systems/groma-md/containers/export/components/organisms-details.md
  - groma/systems/groma-md/containers/export/container.md
  - groma/systems/groma-md/containers/go-worker/container.md
  - groma/systems/groma-md/containers/rust-worker/container.md
type: feature
ordinal: 701000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
An architecture author can give an actor, system, container or component one of a small set of named colors to express project meaning, so the big parts of a map can be told apart at fit zoom. Alex decided on 2026-11-09 that a stored hex is poor UX, that colors are never assigned automatically, and that UI themes define what each named color looks like.

The architecture document stores only the name under groma, as presentation metadata: an ordinary Markdown or OKF reader keeps the title, description, body and links, and the name itself stays readable. It adds no C4 element or containment level. The map consumes it; every UI theme supplies a value for every name, so an authored color works in every theme.

Group colors are not part of this task: a group is a name on its members and has no document to hold presentation metadata. That storage decision is open and belongs to Alex.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 An author can assign, change, and clear a named color on an actor, system, external system, container, and component through a documented Groma authoring action.
- [ ] #2 The web map displays the authored color on the corresponding element in every UI theme, and the theme defines the value of each name.
- [ ] #3 Assignments survive reloads and scans and are unchanged by switching UI themes.
- [ ] #4 Selection, lit flows, task marks, drafts and comparison keep their own signals over an authored color.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Acceptance criteria have objective verification evidence.
- [ ] #2 Relevant checks pass and changes remain task-scoped.
- [ ] #3 Public contracts or documentation are updated when behavior changes.
- [ ] #4 Implementation Plan reflects the final approach; correction history and verification are recorded in Implementation Notes.
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Names in core (src/colors.ts): one fixed list of color names, none near the selection green. groma.color holds a name; the model rejects anything else. It follows technology and tags through annotate, edit (--color, empty clears), combine refusal, plain view and history comparison.
2. Themes define the values: each Palette gains colors, one value per name, emitted as CSS variables beside the other theme values and used directly for covers.
3. Map: the sheet carries the name on islands, slabs and buildings; painters write it as data-color; one generated rule set per name and level replaces the ink of the surface tint with the color at a stronger share and colors the outline. Selection, lit, touched and draft rules keep precedence, and comparison switches authored color off because color means change there.
4. Web authoring: a row of swatches in the details pane applies the choice at once through the shared edit write, so the result shows on the map without a Save step.
5. Docs: Markdown contract, web viewer, agent describe guide. Color groma.md own containers.

Tests (authority: acceptance criteria 1 to 4).
- Model and editing: a name loads, an unknown name fails, edit sets and clears it and a scan keeps it. Wrong result caught: a color lost by another edit, or an arbitrary value stored. Extends the model and editing tests.
- Map: a colored container reaches the drawn slab as data-color, and the cover stylesheet holds an explicit fill for it. Wrong result caught: the authored color never reaches the map or the exported cover. Extends the iso map coverage.
No tests of exact color values.
<!-- SECTION:PLAN:END -->
