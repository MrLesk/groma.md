---
id: TASK-639
title: Dim nonmatching architecture when filtering the web map
status: Done
assignee:
  - '@claude'
created_date: '2026-10-28T20:33:00Z'
updated_date: '2026-11-16T07:39:00Z'
labels:
  - personalization
milestone: m-6
dependencies:
  - TASK-638
references:
  - src/architecture-model.ts
  - src/viewers/web/chrome/c4-filter.ts
  - src/viewers/web/chrome/map-view.ts
  - src/viewers/web/render.ts
  - src/viewers/web/iso/painting/style.ts
documentation:
  - ROADMAP.md
  - docs/viewers/web/index.md
  - docs/component-markdown.md
modified_files:
  - src/tag-selection.ts
  - src/viewers/web/iso/painting/ground.ts
  - src/viewers/web/iso/painting/map.ts
  - src/viewers/web/iso/painting/style.ts
  - src/viewers/web/chrome/tag-focus.ts
  - src/viewers/web/url.ts
  - src/viewers/web/organisms/details.ts
  - src/viewers/web/page.ts
  - src/viewers/web/render.ts
  - test-bun/tag-selection.test.ts
  - docs/viewers/web/index.md
  - docs/component-markdown.md
  - groma/systems/groma-md/containers/cli/components/ada-src-index.md
  - groma/systems/groma-md/containers/cli/components/angular-src-index.md
  - groma/systems/groma-md/containers/cli/components/backlog-src-index.md
  - groma/systems/groma-md/containers/cli/components/c-src-index.md
  - groma/systems/groma-md/containers/cli/components/cobol-src-index.md
  - groma/systems/groma-md/containers/cli/components/cpp-src-index.md
  - groma/systems/groma-md/containers/cli/components/csharp-src-index.md
  - groma/systems/groma-md/containers/cli/components/dart-src-index.md
  - groma/systems/groma-md/containers/cli/components/flow.md
  - groma/systems/groma-md/containers/cli/components/go-src-index.md
  - groma/systems/groma-md/containers/cli/components/java-src-index.md
  - groma/systems/groma-md/containers/cli/components/javascript-src-index.md
  - groma/systems/groma-md/containers/cli/components/kotlin-src-index.md
  - groma/systems/groma-md/containers/cli/components/modules-discovery.md
  - groma/systems/groma-md/containers/cli/components/modules-readiness.md
  - groma/systems/groma-md/containers/cli/components/mojo-src-index.md
  - groma/systems/groma-md/containers/cli/components/mql5-src-index.md
  - groma/systems/groma-md/containers/cli/components/nasm-src-index.md
  - groma/systems/groma-md/containers/cli/components/php-src-index.md
  - groma/systems/groma-md/containers/cli/components/projection.md
  - groma/systems/groma-md/containers/cli/components/r-src-index.md
  - groma/systems/groma-md/containers/cli/components/react-src-index.md
  - groma/systems/groma-md/containers/cli/components/relationships.md
  - groma/systems/groma-md/containers/cli/components/repository-listing.md
  - groma/systems/groma-md/containers/cli/components/ruby-src-index.md
  - groma/systems/groma-md/containers/cli/components/runtime.md
  - groma/systems/groma-md/containers/cli/components/rust-src-index.md
  - groma/systems/groma-md/containers/cli/components/scala-src-index.md
  - groma/systems/groma-md/containers/cli/components/scan-evidence.md
  - groma/systems/groma-md/containers/cli/components/scanner-registry.md
  - groma/systems/groma-md/containers/cli/components/scanner-session.md
  - groma/systems/groma-md/containers/cli/components/scanner-source-watch.md
  - groma/systems/groma-md/containers/cli/components/scanner-src-index.md
  - groma/systems/groma-md/containers/cli/components/scanners-http-routes.md
  - groma/systems/groma-md/containers/cli/components/scanners-projects.md
  - '>-'
  - src/viewers/web/organisms/hierarchy.ts
  - src/viewers/web/organisms/tag-row.ts
  - src/viewers/web/work/pins.ts
type: feature
ordinal: 703000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
A map reader selects a tag filter to focus on relevant architecture while retaining the surrounding map. Nonmatching elements are dimmed, and filtering does not remove them or rearrange the layout.

Use one documented matching rule for this view and for the later includeFilter/excludeFilter export task. The architecture model supplies standard OKF tags; the existing map controls own the selected filter, and rendering owns emphasis. This is view state, not a new OKF concept or C4 relationship.

Before implementation, agree one tagged-map example that shows matching children, their parents, groups, and connecting relationships. Keep the selected tags independent of source language and project-specific technology. Assigned-work filters and computed activity/risk views are outside this task.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A reader can focus the web map on one or more tags and clear the focus, with matching and nonmatching architecture visible together.
- [x] #2 Nonmatching elements are dimmed without changing element positions, containment, or the stored architecture.
- [x] #3 Clearing the focus restores the ordinary appearance.
- [x] #4 One documented example defines tag matching and the treatment of parents, groups, and relationships, using rules shared with filtered exports.
- [x] #5 A link carries the focused tags and reopens the same focus; a tag the architecture does not use is ignored.
- [x] #6 A focus shows its tags in a bar over the map; a click there ends one tag's focus, also while both panes are closed
- [x] #7 Focusing a tag, or opening a link that carries focused tags, frames the camera on everything the tags select; releasing the last tag frames the selection again
- [x] #8 Hierarchy rows and task pins of what the tags do not select recede with their buildings
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
1. Shared rule in core (src/tag-selection.ts): an element matches when it carries any selected tag. A match takes everything inside it; the systems and containers that hold a match are its context. The filtered export (TASK-640) uses the same function.
2. View state: the focused tags are part of the shared view, written as repeated `tag=<tag>` in the URL like `flow=`, and read against the opened world so unknown tags are ignored. They are not saved as a browser preference: tags belong to one project while saved map controls are shared by every map on the same address.
3. Control (src/viewers/web/chrome/tag-focus.ts): owns the focused tags and paints a Tags block above the kind legend in the hierarchy pane, one toggle chip per tag in use with its element count. The tag chips in the details pane are the same toggles. The block is absent while no element is tagged.
4. Map: IsoMap.focus marks matched and context bodies, zones with a matched member and routes whose two ends match; one CSS rule recedes everything else to the opacity a lit flow already uses. Positions, containment and stored architecture are untouched. Selection, lit flows and task marks stay full.
5. Docs: web viewer (control, URL), Markdown contract (one worked matching example). Tag groma.md own architecture so its map shows the feature.

Tests (authority: acceptance criteria 1, 2 and 4).
- selectByTags on a minimal world: a tagged container takes its components and keeps its system as context; an untagged sibling is neither; two tags select the union. Wrong result caught: children of a match dimmed, or parents dimmed. Gap: no tag rule exists.
- URL: a view with focused tags round-trips through writeView and readView, and a tag the world does not use is dropped. Wrong result caught: a shared link opens without its focus, or focuses a tag that dims the whole map. Extends the existing URL coverage.
No tests for chip styling or opacity values.

Added scope, 2026-11-16 (Alex asked for a product and design pass on tag focus). Observed on groma's own map: a link with tag=map opened at fit zoom as a uniformly pale map, the 17 matches were specks, task pins of unrelated work were the loudest thing on screen, nothing but a chip at the bottom of the hierarchy pane said the map was focused, and with both panes closed the focus could not be seen or ended. Changes: (1) chrome/tag-focus.ts also paints a bar under the view switch with the focused tags as pressed chips; (2) render.ts focusOpened frames everything the focused tags select, on a toggle and when a view opens, and falls back to the selection when no tag is focused; (3) hierarchy.ts recedes rows outside the selection of the focus, work/pins.ts recedes pins standing on such elements unless their task is active; (4) the details pane's Tags row from TASK-638 presses and toggles its chips. No new test: the added code is DOM wiring and styling over selectByTags, which test-bun/tag-selection.test.ts already covers, and this repository has no DOM test harness; each behavior is verified on the live map.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Decisions: the focused tags are part of the shared link (repeated tag=) and are not saved as a browser preference, because saved map controls are shared by every map on one address while tags belong to one project; this replaces the tag half of TASK-641. The control lives above the kind legend in the hierarchy pane so it is always visible and reads as a legend; the details pane chips toggle the same list. Neutral routes are one batched stroke, so focus recedes that stroke and lets a route with two matched ends draw its own line, as comparison does. The criterion about authored icons and colors moved to TASK-637, which now comes after this task.

Dogfooding: groma.md own architecture now carries five tags (scanning, map, web, terminal, work) on 74 elements, assigned from the existing groups through groma edit --tags. Verification: bun run check passed (28 Node tests, 1011 Bun tests, 64 environment-dependent skips, 0 failures) before the last change, which keeps an unchanged chip list in place; after it typecheck, lint of the changed files and the focused tests pass. On the exported groma.md map (Iso and 2D, Light and Dark): tag=scanning leaves the scanner groups and the three workers full and recedes the rest; clicking chips in the Tags block and in the details pane toggles the same focus, updates the URL, and the toggled chip keeps keyboard focus; clearing the last tag removes every focus mark.

Cold simplicity review (one round), applied: map names are tag-specific (IsoMap.focusTags, the tag-match class, data-tag-focus, TagSelection.parents) because focus, focused and context already mean camera framing, a flow step and the surface under a selection; dropping a tag the world stopped using is an explicit tagFocus.retain step in applyWorld beside retainFlows and retainSelection, so painting is read-only and its order no longer matters; tagsInUse is the one rule both the URL reader and retain use; groups drawn beside a system island now recede; a hovered or compared route keeps its arrow; the Markdown contract says the map, not selectByTags, decides groups and routes. Removed: the extra state that kept an unchanged chip list in place, so the earlier note about keyboard focus no longer holds; like the flow rows, the Tags block is rebuilt on each paint. The test file is named tag-selection after what it tests.

Added scope 2026-11-16, verified on the live map of this repository in light and dark themes. A link with tag=map alone opens at 229 percent framed on the three zones the tag selects, with a map chip in the bar under the view switch, where it opened at 100 percent as a pale map before. Clicking the bar chip ends the focus, hides the bar and frames the selection again (90 percent); terminal alone frames its zone, terminal and web together frame both. With component=scene and tag=map in one link the camera frames all matches and the selected component stays highlighted. Hierarchy rows outside the focus recede (external systems and non-matching components) and matches and their parents keep full ink. 212 of 233 task pins recede; pins on matched elements keep full strength. bun run check passes on this branch (28 Node tests, 947 Bun tests, 0 failures, the 2 lint warnings are older and in other files). Not done, by choice: tagging several elements at once in the web map, which tags on groups will cover; an add or remove form of --tags on the command line.

2026-11-16: after the tags PR moved tag editing into the Edit form, the Tags row of the details pane only reads: it is the title plus the same focus chips (tagChips) the hierarchy pane and the focus bar use, so a chip toggles the focus and nothing in the row writes. The rule in docs/viewers/web/index.md names tag focus as view state.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
The web map can focus on tags. One rule in core (selectByTags) says what a set of tags selects: carriers, everything inside them, and their parents as context. A Tags block above the kind legend lists every tag in use as toggle chips, the details pane chips toggle the same list, and the map recedes everything outside the selection without moving or hiding it. The focus travels in the link as repeated tag= entries. groma.md own architecture is tagged so the project map shows it.
<!-- SECTION:FINAL_SUMMARY:END -->
