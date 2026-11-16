---
id: TASK-659
title: Keep writes out of the reading pane of the web map
status: Done
assignee:
  - '@claude'
created_date: '2026-11-16T17:02:00Z'
updated_date: '2026-11-16T21:57:00Z'
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
  - src/viewers/web/organisms/write-view.ts
  - src/viewers/web/editing/appearance-preview.ts
  - src/viewers/web/organisms/tags-field.ts
  - test-bun/web-write-view.test.ts
  - docs/component-markdown.md
  - src/viewers/web/atoms/approval-bar.ts
  - src/viewers/web/chrome/add.ts
  - src/viewers/web/editing/create.ts
  - src/viewers/web/chrome/relate.ts
  - src/viewers/web/project/editor.ts
  - test-bun/web-approval-bar.test.ts
  - groma/systems/groma-md/containers/export/components/button.md
  - src/viewers/web/atoms/write-form.ts
  - src/viewers/web/organisms/choice-field.ts
  - test-bun/web-write-form.test.ts
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
- [x] #9 Every write of a pane is approved the same way: its view shows the fields the write needs or, for a write that needs none, one line that says what it will do, then the approval bar at the bottom of the pane with Cancel and the verb. Edit, Accept, Remove, Group and Combine all use it, and none has controls or a confirmation step of its own
- [x] #10 The dialogs of the web map that write (Add, a draft or a group drawn on the map, a drafted relationship, the project editor) end with the same approval bar as a pane's write view, built by one shared atom: the message of a failed write, Cancel, then the verb of the write
- [x] #11 The fields of a pane's write view look like the fields of the dialogs: a small caps label over a control of the same size, radius and background. One shared style, the class write-form of atoms/write-form.ts, gives both their look
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
1. atoms/write-form.ts (new): the write form of the whole web map. A form that writes carries the class write-form, which gives its fields one look (a small caps label over its control), and ends with the approval bar built here. It builds the message line of a failed write, Cancel and the approving button (Save by default), makes its form inert while the write is in flight, runs one write at a time (oneWriteAtATime) and reports what became of a press: stored, failed or ignored. Every form that writes ends with it.
2. write-view.ts (replaces editable.ts): the one way a pane writes. A write is data (WriteView: its verb, its fields or a question, its writer, and the record's other writes as entries). paintWriteEntries paints the entries of a reading pane in its header. The view is painted the same way for every write: the record's other writes, the fields or the question, and the approval bar at the pane's bottom. Only the verb writes.
3. commands.ts: one function per write that only describes it and returns its entry: editEntry, acceptEntry, removeEntry, groupEntry, combineEntry. No function there builds a control. remove.ts is deleted and writes.ts keeps only the hook types.
4. details.ts and relationship-details.ts: the reading pane's only write entry is Edit. Its view holds the fields and offers Accept and Remove above them where they apply; each opens its own view, and neither opens while the fields hold unsaved changes.
5. selection-details.ts (new): several selected elements get their own pane, a list of what is selected. On a live map, while all are components, its write entries are Group and Combine. authoring.ts gives that pane its own hooks (selectionWrites); the element pane no longer knows about a selection.
6. The dialogs that write (chrome/add.ts, editing/create.ts, chrome/relate.ts, project/editor.ts) are write forms: their form carries the class write-form and ends with the approval bar, and they keep no field styles, approval buttons, error line or in-flight handling of their own. Their approving button says Save, or another word only where it tells better what happens: Add, Create group.
7. shell.ts: the details pane sizes its content from its final width (so text does not rewrap while the pane animates). That width now leaves out the room a classic scrollbar takes, measured once by the shell (--details-gutter).
8. highlights.ts and map.ts: every selected component gets the focus look; neighbors are the components one hop from any of them.
9. Docs: the Reading and editing rule in docs/viewers/web/index.md (with the table of the five pane writes), the Web map writes section of AGENTS.md, and the multi-selection sentence in docs/product-model.md.
10. Tests: test-bun/web-write-form.test.ts covers the one-write-at-a-time guard (two tests); test-bun/web-map-highlights.test.ts covers the focus of several selected components. The views and dialogs themselves are DOM and the repository has no DOM harness; they were checked on the live map.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Live map checks on the final code (1600x1000, light theme, own architecture): reading pane of an element, a draft relationship and three selected components holds only Edit and no input. Draft component with a two-paragraph overview: Remove asks, refuses with "Save or cancel your changes first." after a typed title, removes once the title is restored. Draft relationship: Accept and Remove offered; Accept refuses on a changed description, then accepts and the Edit view offers no command afterwards. Matched draft component (a draft given code through groma edit --combine): Accept and Remove offered; Accept made it observed. Three components: meta line reads "3 selected", Edit view holds Group as and Combine into, no fields, Save hidden; Group as returned to reading; deselecting one closed the view; Escape closed it. System plus component selected: Group as failed and the server sentence showed in the view. One Save still stored technology and color together; Save without changes closed the view. All temporary drafts, rows and files were removed again.

Reviews: one cold simplicity review and one full-context review on the same snapshot found no defect. Applied: command controls and styles grouped in commands.ts; one convention (control takes run and its write); the runner shows refusals itself; optional form instead of an unused Save writer; the selected count moved to the function that paints Edit so reading code touches no write hook; docs scoped to that. Left: the count is not shown on read-only maps (nothing there acts on several).

2026-11-16, second round, after Alex tried the map: (1) with several components selected he expected a side panel that recaps the selection with a group button, and saw the last selected element instead; (2) the pane could slide sideways. Changes: several selected elements now get their own pane (selection-details.ts) that lists them, with Group and Combine as write entries that each open the view of one command; the element pane no longer carries selection hooks or a selected count. The sentence "Edit is the only write entry of a pane" became "a pane writes only from a view the person opens": a selection is not a record, so its entries are named for its commands. The sideways slide came from the pane sizing its content from its own width without the room a classic scrollbar takes (11 px here): scrollWidth 418 against clientWidth 407. The shell now measures that room. Live checks on the final code: three components show "Selection / 3 components", the three rows, Group and Combine, no input; Group opens a name field and Group as, Combine opens the survivor list and Combine into, Cancel returns; Group as ran and returned to the pane; a click on a row selected it alone, a shift-click dropped it; a system plus a component show "2 elements" and no entries; scrollWidth equals clientWidth (407) in reading and in the Edit view and the pane does not scroll sideways. bun run check passed on this code (966 Bun and 28 Node tests, 0 failures).

2026-11-16, third round. (1) Review thread on PR 219 (Codex, then a follow-up under the MrLesk account): Save and a command could overlap while one request was in flight, in both directions, and typing during a pending command was discarded. Save and the commands now write through one guard, oneWriteAtATime: while one writes, the fields and commands are inert, the view holds the focus so Escape waits, and a failed write restores the view with its values and its message. Test plan: rule = one write at a time per Edit view (authority: the review thread; Accept can take seconds because it may scan); wrong result caught = a second write starting while the first is in flight, or a failed write leaving the view locked; gap = no coverage; added test-bun/web-edit-view.test.ts (2 tests on the guard, which both directions share). The repository has no DOM harness, so the two directions were checked on the live map with held requests: Save in flight, value restored, Accept pressed: no /accept call, Escape ignored; the held Save then failed: view back, typed value kept, message shown; Accept in flight, Save submitted: no /edit call; Accept released: view closed. (2) Alex: "I don t see the components that I selected as highlighted. only the last one." The map gave the focus look to the last selected component only and receded the other selected ones. Every selected component is now focused and the neighbors are the components one hop from any of them (highlights.ts, map.ts); the highlight test covers it. (3) Own critical pass: the selection pane shows each component s group after its title, so a grouping shows in the list; Group and Combine carry hover hints. bun run check on the final code: 969 Bun and 28 Node tests, 0 failures.

2026-11-16, fourth round. Alex, on a screenshot of the Group view (a name input with Group as beside it and Cancel below): "we should have a consistent approval flow. I don't want each case to have it's own ui. we need to keep it consistent. I don't want to bring in storybook but I cannot let you invent a new flow with each component". Cause: each command painted its own controls (paintCommands received a box), so Remove had its own ask and Keep step, Group as and Combine into an inline submit, Accept wrote on one press, and only Edit used Cancel and Save. The dialogs of the web map (Add, Draft, Relate, project editor) already approve with Cancel and the verb, so that is the flow the pane now uses everywhere. Change: a write is data (commands.ts: editEntry, acceptEntry, removeEntry, groupEntry, combineEntry) and write-view.ts paints all of them: the record's other writes, the fields or one question, and the approval bar at the pane's bottom (message of a failed write, Cancel, the verb). editable.ts is replaced by write-view.ts; a pane's code can only call paintWriteEntries. Accept and Remove stay entries of the Edit view and each opens its own view, so a view holds one write and Save cannot overlap another write of the record. Found and fixed on the walk: the approval bar was see-through over a long form (now covers it); a failed Save could show its message below the fold (the message now stands in the bar); Group and Combine stood under the list while Edit stands in the header (all reading-pane entries now stand in the header). My own calls, not Alex's decisions: bar pinned to the pane's bottom; field-less writes show one question line; Combine's field is labelled Combine into. Cost: Accept is three presses (Edit, Accept, Accept). Live checks on the final code, 1920x907, dark and light theme, own architecture: Edit view of a component (bar covers the icon rows, Cancel and Save); draft component: Edit shows Remove above the fields, a typed title makes Remove answer "Save or cancel your changes first.", Escape and Cancel return to reading with no request, Remove view asks "Remove Zz approval check?" and its verb sent one /remove; draft relationship: Accept view asks "Accept the relationship from Map highlighting to Map fonts?", its verb sent one /accept and the Edit view offered no other write afterwards; four components: Group and Combine in the header, Group view with a Group name field (empty name blocked by the required check, a refused /add showed its message in the bar and kept the typed name and the focus), Combine view with a Combine into list of the four; scrollWidth equals clientWidth (407) in every view. Temporary records were removed again. No new test: the change is DOM layout and the repository has no DOM harness; the guard test moved to test-bun/web-write-view.test.ts unchanged.

2026-11-16, fifth round. Alex answered "Yes, do it" to "Put the map's dialogs (Add, Draft, Relate, project editor) on the same approval bar too?". The bar moved out of write-view.ts into atoms/approval-bar.ts and the four dialogs now end with it. Each dialog lost its own error line, button markup, button styles and try, catch and finally around the write; its submit handler asks the bar to approve the write and closes on stored. Behavior that changed with it: while a dialog's write is in flight its whole form is inert and dimmed (before, only the verb was disabled); a failed write gives the focus back to the field it left; the verb of the draft and group dialog is Draft or Group instead of Save, and the relationship dialog's is Draft instead of Save draft, so the verb names the write as in a pane. Not changed (outside the four dialogs Alex approved): the plugin Add form in settings still has its verb before Cancel and its own buttons; the dialogs' fields keep their own styling, which differs from a pane's fields. Live checks on the final code, 1920x907, dark theme: project editor (opened from the map's project label): Cancel and Save from the atom, a held then refused /edit kept the form inert and dimmed, ignored a second submit, then showed its message in the bar with the typed title kept and the focus back; Save without a change closed with no request; Write and Preview kept their look. Add (its header button is hidden as unfinished, clicked by script): refused /add showed its message; a real add sent one /add, closed the dialog and wrote the actor, which was removed again with groma remove. Draft (the + System tool dragged onto the map by synthetic pointer events, the tools are hidden as unfinished): heading Draft system, verb Draft, refused /draft showed its message. Group (the Group tool drawn around one component): heading Group 1 components, verb Group, the earlier message was gone on reopening, refused /add showed its message. Relate (the Connect tool from Map highlighting to Map grid): verb Draft, refused /draft showed its message and kept the description. Pane write view on the atom: held then refused Save kept the view inert with the focus on it, ignored Escape and a second submit, then showed the message with the typed title kept. Test: the guard test moved to test-bun/web-approval-bar.test.ts unchanged; no DOM test (no harness).

2026-11-16, sixth round. Alex, on the before and after pictures: "I like the style of the second but I think people are more used to have Save most of the times. 'Group' is understandable for me but would probably not be obvious. Create Group would be unambiguous". Decided by him: the approving button says Save in most forms; the group write says Create group. Applied: the draft dialog and the drafted relationship dialog say Save again (my Draft labels are gone; the relationship dialog said Save draft before this task); the Group view of the selection pane and the map's group dialog say Create group. Unchanged: Add, Accept, Remove, Combine. My calls, not his: sentence case (Create group) like the map's other labels; the header entry that opens the Group view still says Group. In code the label is approveLabel (WriteView, approvalBar) and the button is approveButton. The docs rule and AGENTS.md say the approving button says Save unless another word tells better what happens. Live check, dark theme, 1920x907: Draft system shows Cancel and Save; the group dialog drawn on the map shows Cancel and Create group; the drafted relationship dialog shows Cancel and Save; the Group view of four selected components shows Cancel and Create group.

2026-11-16, seventh round. Alex answered "Yes, do it" to "Give the pane's forms the dialogs' field style (small caps labels, larger inputs)?". The dialogs' field rules moved out of chrome/add.ts and project/editor.ts into the shared atom, which is now atoms/write-form.ts (renamed from approval-bar.ts, because it holds the field look and the approval bar of every form that writes). A form that writes carries the class write-form: the pane's form already did, the four dialogs' forms now do. The pane's own label and input rules are gone; it keeps only its taller, resizable text area. The Tags and choice fields give their title the class field-title and the Tags box takes the inputs' radius, height and background. Kept exactly as the dialogs had it, including their input font stack. Live checks on the final code, 1920x907: Edit view in the dark and light themes (small caps labels, 38 px inputs, 6 px radius, Tags box and Color and Icon titles in the same look, content as wide as the pane), Group and Combine views, and the Add, Draft and project editor dialogs, whose computed label and input styles are the same as before the move.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
The reading pane of the web map no longer writes, and every write of the web map is approved the same way. A reading pane holds write entries in its header: Edit for an element or a relationship, Group and Combine for several selected components. An entry opens a write view and stores nothing. Every write view has the same shape: what the write needs (its fields, or one question for a write that needs none), then the approval bar at the bottom of the pane with the message of a failed write, Cancel and the verb. Only the verb writes. Accept and Remove are entries of a record's Edit view and each opens its own view; they do not open while the fields hold unsaved changes.

Every form that writes is a write form, one atom: atoms/write-form.ts. Its class write-form gives the fields one look, a small caps label over its control, in a pane and in a dialog. Its approval bar holds Cancel and the approving button (Save, unless another word tells better what happens: Add, Accept, Remove, Combine, Create group), makes the form inert while the write is in flight, runs one write at a time and shows a failed write's message. The pane's write view and the four dialogs that write (Add, a draft or group drawn on the map, a drafted relationship, the project editor) use it and style no field and build no approval button of their own. Each pane write is described as data in organisms/commands.ts and painted by organisms/write-view.ts, so a new write cannot bring its own layout or confirmation step. Also in this task: the pane of several selected elements, the focus look on every selected component, and a details pane that sizes its content without the room a scrollbar takes.

Verification: bun run check passes on the final code (969 Bun and 28 Node tests, 0 failures). All five pane writes and all four dialogs were walked on the live map, including refused writes, writes held in flight and real key presses; see the notes.

Cost: Accept and Remove sit behind Edit, so Accept is not visible on a matched draft until Edit is pressed and takes three presses (Edit, Accept, Accept).

Not in this task: the plugin Add form in settings keeps its own buttons, with its verb before Cancel. The creation controls of the web map (the header Add button and the map tools) are hidden as unfinished and the rule does not place them yet.
<!-- SECTION:FINAL_SUMMARY:END -->
