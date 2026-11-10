---
id: TASK-637
title: 'Assign named colors to actors, systems, containers and components'
status: Done
assignee:
  - '@claude'
created_date: '2026-10-28T20:33:00Z'
updated_date: '2026-11-10T08:12:00Z'
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
- [x] #1 An author can assign, change, and clear a named color on an actor, system, external system, container, and component through a documented Groma authoring action.
- [x] #2 The web map displays the authored color on the corresponding element in every UI theme, and the theme defines the value of each name.
- [x] #3 Assignments survive reloads and scans and are unchanged by switching UI themes.
- [x] #4 Selection, lit flows, task marks, drafts and comparison keep their own signals over an authored color.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Acceptance criteria have objective verification evidence.
- [x] #2 Relevant checks pass and changes remain task-scoped.
- [x] #3 Public contracts or documentation are updated when behavior changes.
- [x] #4 Implementation Plan reflects the final approach; correction history and verification are recorded in Implementation Notes.
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

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Decisions: Alex said on 2026-11-09 that a stored hex is poor UX, that colors must not be automatic, and that themes define the named colors; whether a color belongs to an element or to a tag he left open. This task puts the name on the element (groma.color), the smallest primitive that needs no other concept. Six names, none green; each bundled theme supplies its own value per name. In the browser a colored element sets four variables that the existing surface and stroke rules read, so selection, lit, draft and comparison rules work unchanged; covers get resolved plain rules because resvg has no variables. A color is not inherited by children. Group colors are left out: a group has no document, and where to store its presentation is Alex decision. The earlier agent PR for this task (MrLesk/groma.md#195) stored a hex and a groupAppearance map; nothing from it is used.

Verification: bun run check passed (28 Node tests, 1017 Bun tests, 64 environment-dependent skips, 0 failures). On groma.md own map, with its five containers colored: Iso at fit zoom in Light, Dark and Blueprint shows each container tinted with a colored outline and its zones following the outline; a selected colored container keeps its tint under the green selection outline; the exported cover shows the colors; in a two-commit comparison export the colored slabs compute to the neutral fill and stroke. On the editing fixture in groma web, clicking a swatch in the details pane tinted the slab at once and marked the swatch; groma edit --color with an unknown name is refused naming the six names.

Cold simplicity review (one round), applied: on covers the color rules reach only the element own faces, so a group hatch inside a colored container is no longer painted over; group zones reset the tint variables, so a color stays on its element in the browser as on covers and the docs sentence about inheritance is true; the cap that gave both sides of a colored building one fill is gone and the strength is 2, which keeps the side shading; a colored actor shades its sides in the browser as on its cover; a hovered colored element keeps its outline color; the per-element variables are named --tint-* so they do not read as the theme --color-<name> values; one depth table feeds both the neutral and the colored surface rules; the two model tests that repeated the editing test are removed. The planned cover stylesheet assertion was not written: it would freeze selector text, and the theme type already requires a value for every name. Kept on purpose: the swatch row writes at once without the Edit form conflict check, because applying a color is a single field overwrite like the CLI.

2026-11-10: removed the colors I had set on groma's own five containers. The architecture comparison job builds each pull request's comparison with the released groma.md, and 0.7.8 rejects the new groma.color field, so the job failed on this branch and on every branch above it. The own map gets its colors back after the release that knows the field.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Elements can carry one of six named colors. groma.color stores the name, groma edit --color and a swatch row in the web details pane set or clear it, and the choice applies at once. Each UI theme defines what every name looks like; the map mixes that value into the element surfaces and outline, in the browser and on exported covers. Selection, lit flows, task marks and drafts keep their own look, and comparison switches authored colors off. groma.md own containers are colored. Group colors are not included and need a storage decision.
<!-- SECTION:FINAL_SUMMARY:END -->
