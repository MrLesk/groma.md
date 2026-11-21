---
id: TASK-666
title: Give groups a color and an icon
status: Done
assignee:
  - '@claude'
created_date: '2026-11-19T07:06:00Z'
updated_date: '2026-11-19T07:58:00Z'
labels:
  - personalization
milestone: m-6
dependencies:
  - TASK-662
modified_files:
  - docs/agent-instructions/describe.md
  - docs/component-markdown.md
  - docs/product-model.md
  - docs/viewers/web/index.md
  - src/architecture-model.ts
  - src/core.ts
  - src/edit.ts
  - src/group-model.ts
  - src/group.ts
  - src/instructions.ts
  - src/sheet/place.ts
  - src/sheet/types.ts
  - src/types.ts
  - src/viewers/web/atoms/text.ts
  - src/viewers/web/editing/appearance-preview.ts
  - src/viewers/web/iso/painting/ground.ts
  - src/viewers/web/iso/painting/icon-camera.ts
  - src/viewers/web/iso/painting/icons.ts
  - src/viewers/web/iso/painting/names.ts
  - src/viewers/web/iso/painting/style.ts
  - src/viewers/web/iso/painting/text.ts
  - src/viewers/web/organisms/commands.ts
  - src/viewers/web/organisms/details.ts
  - src/viewers/web/organisms/group-details.ts
  - src/viewers/web/organisms/writes.ts
  - src/write-commands.ts
  - test-bun/flows.test.ts
  - test-bun/group-records.test.ts
  - test-bun/sheet-scene.test.ts
type: feature
ordinal: 713000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The milestone promises "authored element and group colors", and the product owner said on 2026-11-12 that groups "should be treated equally in terms of personalization": "groups are the one thing people have most control over in groma. they are not generated and they are persistent." TASK-561 and TASK-637 left groups out because a group had no document. Since TASK-657 a group has its own document and since TASK-665 it is selected and edited on the web map, so its color and icon have an owner. Today groma edit <group-id> --color is refused and every zone looks the same. On 2026-11-19 the owner asked to finish the Personalization Update; this is the last primitive its description names.

OKF and C4: a group stays a narrative overlay, not a C4 element or a containment level. Its document stores groma.color and groma.icon with the names an element uses; they are groma.md presentation metadata under groma. An ordinary Markdown reader keeps the title, the text and the member links of the group. groma.md interprets the two names: the zone takes the color and the icon stands before the name of the zone. Members inherit neither: a color and an icon belong to what carries them.

Design by the agent from the design round of 2026-11-12: three independent proposals agreed on storing color and icon on the group record, on the zone taking the color and on the icon standing before the name of the zone; a spike on the live map showed that an enlarged group icon crowds its zone, so the icon follows the size of the name. The owner has not seen the built result yet.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 groma edit <group-id> --color <name> and --icon <name> store the name under groma in the document of the group, an empty value removes it, an unknown name is refused with the allowed names, and a flow still refuses both
- [x] #2 The web map paints the ground and the outline of the zone of a colored group in that color, in Iso, 2D and Layers and in every theme. A member keeps its own look. Selection, lit flows, tag focus and comparison read as they do on an uncolored zone
- [x] #3 The icon of a group stands before the name of its zone at the size of the name, and the name band of the zone makes room for it. The 2D view draws the flat glyph
- [x] #4 The group pane shows the icon beside the title. Its Edit view offers Color and Icon as the Edit view of an element does, and shows the pick on the zone before Save
- [x] #5 A static export and a filtered export keep the color and the icon of an exported group
- [x] #6 docs/component-markdown.md, docs/viewers/web/index.md and the agent instructions say that a group takes a color and an icon, and the records of TASK-561 and TASK-637 no longer say that a group carries none
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
1. Model: a group carries a color and an icon (ArchitectureGroup; AnnotatedGroup passes every stored field but the members and the file name on to the views). resolveGroups reads groma.color and groma.icon with appearanceOf in src/architecture-model.ts, the name checks an element uses.
2. Writes: groupFields in src/group.ts is the one list of what a group can change. editGroup writes exactly those fields; src/edit.ts refuses every other option for a group and still refuses a color and an icon for a flow.
3. Sheet: a Zone carries the color and the icon of its group, and the name cells of the zone make room for the icon.
4. Web painters: the zone gets data-color, its ground (color) and its hatch are two polygons as on a slab, and surfaceTitle draws the icon before the name as an icon that is no landmark. The map stylesheet paints the ground and the outline of a colored zone at the strength of a colored slab top, on the live map and on covers.
5. Web pane: the icon beside the title of the group; Color and Icon in the Edit entry of the group, from the fields an element uses; the appearance preview paints the zone of the selected group.
6. Docs, agent instructions, and the records of TASK-561 and TASK-637.
7. Tests. Authority: the milestone description (authored element and group colors), the owner words of 2026-11-12 and the criteria of this task. (a) Edit: groma edit <group-id> stores a color and an icon with the wording in one edit, clears them with an empty value and refuses an unknown color name; a wrong result is the refusal groups got before, a misspelled name that is stored and paints nothing, or a name that stays after it was cleared; no test edited the appearance of a group. The same round trip proves the reader, because the edit validates through it. (b) Flow: an edit with a color is refused and the same wording alone is stored; a wrong result is a flow document with a color once groups take one, since both pass the same check in src/edit.ts; no test covered it. (c) Sheet: the zone of a colored group with an icon carries both, and its name band is wider than without the icon; a wrong result is a zone drawn without its color, or an icon drawn over the name; the sheet tests covered icons of islands, slabs and buildings only. No DOM tests.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Built by codex (gpt-6.2-astra, effort max) from a brief with checked facts and the settled design, in one pass (26 files). Then read, corrected and verified by the agent.

Changed after the first read of codex's code: editGroup passed the whole edit input on to the document writer; it now passes only the group's fields. The content of a zone before packing got a named type (ZoneContent).

Review round (one cold simplicity review without history and one full-context review, in parallel; neither found a failure in the supported flow). Applied:
1. Look. The brief asked for a zone color clearly lighter than a colored slab, and codex used the island tint (8 percent). The zone's ground covers the slab's tint, so in the light theme a colored zone on a neutral slab read as a pale cut-out. A zone now uses the slab's own depth (14.4 percent, as strong as a colored slab top) and reads as a marking on the slab in both themes. This was the brief's mistake, not codex's.
2. One list of what a group takes: groupFields in src/group.ts. editGroup writes exactly these and src/edit.ts refuses every other option for a group, as editSeveralElements does with its list. Before, the edit had a deny list and the writer an allow list, and an option missing from the deny list would have been dropped silently.
3. A stylesheet rule that matched nothing after the change (.ghost > .ground) and its comment are deleted.
4. The form fields are colorAndIconFields in organisms/commands.ts (the core already has a list named appearanceFields); a parameter that shadowed heading() is renamed; a Zone states its own color and icon instead of inheriting comments about elements; comments on the icon camera rules say that a zone's icon is no landmark and fades like a roof icon.
5. Tests: the separate load test repeated the round trip and is gone, with its helper change; the round trip gained the refusal of an unknown color name through the edit; the flow refusal moved to the flow tests and now proves its reason (the same wording alone is stored); an assertion that members carry no color, which no sheet code could break, is removed.
6. Docs: docs/product-model.md and the agent instructions name --color and --icon for a group.
7. The records of TASK-561 and TASK-637 said that groups carry no icon by decision and that group colors wait for a storage decision. They now say what happened: the owner rejected that exclusion on 2026-11-12, TASK-657 gave a group a record and this task gives it a color and an icon.

Not changed, known:
- The terminal map draws no authored color for any element and has no group pane; nothing changed there. groma view <group-id> prints the record with its color and icon.
- Groups have no row in the hierarchy pane and the search of the web map, so the icon shows on the zone and in the group pane only.
- A zone's hatch is now its own polygon above the ground, as a slab's grain is, so the hatch overlays the inner half of the zone's outline. Not visible at any zoom looked at.

Verification. bun run check passes: 1004 Bun tests and 28 Node tests, 0 failures, no complexity warning; the lint notes left are in files this task does not touch. Criterion 1 has tests (test-bun/group-records.test.ts, test-bun/flows.test.ts) and the full-context review ran the command line on scratch copies: unknown color and icon refused with the allowed names, an empty value on a group without a color, color with title in one edit, a group id among several ids refused in both orders. Criterion 3 has the sheet test. Criterion 5: the review ran a plain and a filtered export on a scratch copy and both snapshots keep color and icon; codex rendered the Light, Dark and Blueprint covers. On the live map of this repository with four colored groups: dark and light theme in Iso, the 2D view with the flat glyph, the Layers view in the blueprint theme, a colored zone on a colored container and an uncolored zone beside it, click selection of a colored and of an uncolored zone at the opening zoom, the Edit view with Color and Icon, the pick shown on the zone and gone after Cancel, Save stored in the record with the icon beside the title of the pane, tag focus receding a colored zone to the same opacity as the others, and comparison switching the color off. Lit flows on a colored zone were not walked; the rule is the one selection uses.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
A group can carry a color and an icon, stored as groma.color and groma.icon in its record with the names an element uses. groma edit <group-id> --color <name> --icon <name> writes them, and so does the Edit view of the group on the web map, with the pick shown on the zone before Save. The ground and the outline of the zone take the color at the strength of a colored container, the icon stands before the name of the zone and follows its size, and members inherit neither. This closes the last primitive the milestone description names (authored element and group colors). The design comes from the round of 2026-11-12, where three independent proposals agreed on it; the owner had not seen the built result when the task closed. Verified by bun run check (1004 Bun and 28 Node tests pass) and a walk of the live map in three themes and three views; details are in the notes. Not built: a group row in the hierarchy pane and in search, and any color in the terminal map (no element has one there).
<!-- SECTION:FINAL_SUMMARY:END -->
