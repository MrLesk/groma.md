---
id: TASK-659
title: Keep writes out of the reading pane of the web map
status: Done
assignee:
  - '@claude'
created_date: '2026-11-16T17:02:00Z'
updated_date: '2026-11-16T19:03:00Z'
labels:
  - personalization
milestone: m-6
dependencies: []
references:
  - src/viewers/web/organisms/editable.ts
  - src/viewers/web/organisms/details.ts
  - src/viewers/web/organisms/relationship-details.ts
  - src/viewers/web/organisms/writes.ts
documentation:
  - docs/viewers/web/index.md
modified_files:
  - src/viewers/web/organisms/editable.ts
  - src/viewers/web/organisms/details.ts
  - src/viewers/web/organisms/writes.ts
  - src/viewers/web/organisms/relationship-details.ts
  - src/viewers/web/organisms/remove.ts
  - src/viewers/web/page.ts
  - docs/viewers/web/index.md
  - AGENTS.md
  - docs/product-model.md
  - src/viewers/web/organisms/commands.ts
  - groma/systems/groma-md/containers/export/components/create.md
  - src/viewers/web/organisms/selection-details.ts
  - src/viewers/web/authoring.ts
  - src/viewers/web/chrome/shell.ts
  - src/viewers/web/render.ts
  - groma/systems/groma-md/containers/export/components/organisms-details.md
  - test-bun/web-edit-view.test.ts
  - src/viewers/web/iso/highlights.ts
  - src/viewers/web/iso/painting/map.ts
  - test-bun/web-map-highlights.test.ts
type: feature
ordinal: 707000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The web map rule for writes (docs/viewers/web/index.md, "Reading and editing") says reading never writes, yet Accept, Remove, Group as and Combine into still sit in the reading pane and write on a click, Group as next to a text input. They predate the rule. On 2026-11-16 Alex decided they move behind Edit, so a pane has exactly one control that leads to writing and no later command can be added to a reading view. Accepted cost: one more click for each of the four, and Accept is no longer visible on a matched draft before Edit is pressed.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 On a live current map a reading pane writes nothing on a click and holds no input. Its only write controls are write entries, buttons that open a view: Edit for an element or a relationship, Group and Combine for several selected components
- [x] #2 The Edit view of a matched draft element or a draft relationship offers Accept, and the Edit view of a removable element or a draft relationship offers Remove, which still asks before it removes
- [x] #3 Several selected elements get their own pane that lists them; a click on a listed element selects it alone and a shift-click drops it. On a live current map, while all of them are components, Group and Combine each open the view of that one command
- [x] #4 A command writes once and returns the pane to reading; while the form holds unsaved field changes a command writes nothing and says so
- [x] #5 The rule text of the web viewer documentation and the Web map writes section of AGENTS.md state that a pane writes only from a view the person opens
- [x] #6 The content of the details pane is as wide as its visible area when a scrollbar takes room, so the pane cannot slide sideways
- [x] #7 While Save or a command of an Edit view writes, nothing else in that view can start, what was typed stays, and Cancel and Escape wait; a failed write leaves the view as it was with its message
- [x] #8 On the map every selected component has the focus look, and the components one hop from any of them are softly accented
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
1. editable.ts: a write entry opens an Edit view: commands, the line that reports on them, then the fields form. The view takes an optional form (fields and the Save writer) and a function that paints its commands. One runner serves every command: it refuses while the form holds unsaved changes, writes once, closes the view, and shows a refusal or a failed write in the view. editButton is the entry of a record; openEditView is exported for entries with their own label.
2. commands.ts (new): Accept, Remove, Group as and Combine into, one function each, with their styles. Each control takes the runner and its write. remove.ts is deleted and writes.ts keeps only the hook types.
3. details.ts and relationship-details.ts: the reading pane paints no command. Edit opens the element or relationship fields plus Accept and Remove where they apply.
4. selection-details.ts (new): several selected elements get their own pane, a list of what is selected. On a live map, while all are components, it offers Group and Combine as write entries; each opens a view with that one command and no form. authoring.ts gives that pane its own hooks (selectionWrites); the element pane no longer knows about a selection.
5. shell.ts: the details pane sizes its content from its final width (so text does not rewrap while the pane animates). That width now leaves out the room a classic scrollbar takes, measured once by the shell (--details-gutter).
6. Docs: the Reading and editing rule in docs/viewers/web/index.md, the Web map writes section of AGENTS.md, and the multi-selection sentence in docs/product-model.md.
7. Tests: none added. The change moves DOM controls and the repository has no DOM harness; the conflict check (changedEdit, checkEdit) and the writers keep their existing coverage. Verified on the live map instead.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Live map checks on the final code (1600x1000, light theme, own architecture): reading pane of an element, a draft relationship and three selected components holds only Edit and no input. Draft component with a two-paragraph overview: Remove asks, refuses with "Save or cancel your changes first." after a typed title, removes once the title is restored. Draft relationship: Accept and Remove offered; Accept refuses on a changed description, then accepts and the Edit view offers no command afterwards. Matched draft component (a draft given code through groma edit --combine): Accept and Remove offered; Accept made it observed. Three components: meta line reads "3 selected", Edit view holds Group as and Combine into, no fields, Save hidden; Group as returned to reading; deselecting one closed the view; Escape closed it. System plus component selected: Group as failed and the server sentence showed in the view. One Save still stored technology and color together; Save without changes closed the view. All temporary drafts, rows and files were removed again.

Reviews: one cold simplicity review and one full-context review on the same snapshot found no defect. Applied: command controls and styles grouped in commands.ts; one convention (control takes run and its write); the runner shows refusals itself; optional form instead of an unused Save writer; the selected count moved to the function that paints Edit so reading code touches no write hook; docs scoped to that. Left: the count is not shown on read-only maps (nothing there acts on several).

2026-11-16, second round, after Alex tried the map: (1) with several components selected he expected a side panel that recaps the selection with a group button, and saw the last selected element instead; (2) the pane could slide sideways. Changes: several selected elements now get their own pane (selection-details.ts) that lists them, with Group and Combine as write entries that each open the view of one command; the element pane no longer carries selection hooks or a selected count. The sentence "Edit is the only write entry of a pane" became "a pane writes only from a view the person opens": a selection is not a record, so its entries are named for its commands. The sideways slide came from the pane sizing its content from its own width without the room a classic scrollbar takes (11 px here): scrollWidth 418 against clientWidth 407. The shell now measures that room. Live checks on the final code: three components show "Selection / 3 components", the three rows, Group and Combine, no input; Group opens a name field and Group as, Combine opens the survivor list and Combine into, Cancel returns; Group as ran and returned to the pane; a click on a row selected it alone, a shift-click dropped it; a system plus a component show "2 elements" and no entries; scrollWidth equals clientWidth (407) in reading and in the Edit view and the pane does not scroll sideways. bun run check passed on this code (966 Bun and 28 Node tests, 0 failures).

2026-11-16, third round. (1) Review thread on PR 219 (Codex, then a follow-up under the MrLesk account): Save and a command could overlap while one request was in flight, in both directions, and typing during a pending command was discarded. Save and the commands now write through one guard, oneWriteAtATime: while one writes, the fields and commands are inert, the view holds the focus so Escape waits, and a failed write restores the view with its values and its message. Test plan: rule = one write at a time per Edit view (authority: the review thread; Accept can take seconds because it may scan); wrong result caught = a second write starting while the first is in flight, or a failed write leaving the view locked; gap = no coverage; added test-bun/web-edit-view.test.ts (2 tests on the guard, which both directions share). The repository has no DOM harness, so the two directions were checked on the live map with held requests: Save in flight, value restored, Accept pressed: no /accept call, Escape ignored; the held Save then failed: view back, typed value kept, message shown; Accept in flight, Save submitted: no /edit call; Accept released: view closed. (2) Alex: "I don t see the components that I selected as highlighted. only the last one." The map gave the focus look to the last selected component only and receded the other selected ones. Every selected component is now focused and the neighbors are the components one hop from any of them (highlights.ts, map.ts); the highlight test covers it. (3) Own critical pass: the selection pane shows each component s group after its title, so a grouping shows in the list; Group and Combine carry hover hints. bun run check on the final code: 969 Bun and 28 Node tests, 0 failures.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
The reading pane of the web map no longer writes. An element or a relationship has one write entry, Edit, which opens its Edit view: Accept and Remove above the fields. Several selected elements get their own pane that lists them; while all are components it offers Group and Combine, each opening the view of that one command. One runner serves every command: it refuses while the form holds unsaved changes, writes once, returns the pane to reading, and shows a refusal or a failed write in the view. The command controls live in organisms/commands.ts and the selection pane in organisms/selection-details.ts. The details pane now sizes its content without the room a scrollbar takes, so it cannot slide sideways. The rule text in docs/viewers/web/index.md and AGENTS.md says a pane writes only from a view the person opens.

Verification: bun run check passes (966 Bun and 28 Node tests, 0 failures, no lint finding in the changed files). Every command path and the selection pane were exercised on the live map; see the notes.

Accepted cost: one more click for Accept and Remove, and Accept is not visible on a matched draft until Edit is pressed.

Not in this task: the creation controls of the web map (the header Add button and the map tools) are hidden as unfinished and the rule does not place them yet. The Save and Cancel bar still floats mid-pane on short forms such as a relationship.
<!-- SECTION:FINAL_SUMMARY:END -->
