---
id: TASK-639
title: Dim nonmatching architecture when filtering the web map
status: Done
assignee:
  - '@claude'
created_date: '2026-10-28T20:33:00Z'
updated_date: '2026-11-09T22:21:00Z'
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
  - >-
    groma/systems/groma-md/containers/cli/components/scanners-typescript-operations.md
  - >-
    groma/systems/groma-md/containers/cli/components/scanners-typescript-outline.md
  - groma/systems/groma-md/containers/cli/components/scene.md
  - groma/systems/groma-md/containers/cli/components/screen.md
  - groma/systems/groma-md/containers/cli/components/source-operations.md
  - >-
    groma/systems/groma-md/containers/cli/components/src-architecture-findings.md
  - groma/systems/groma-md/containers/cli/components/src-architecture-model.md
  - groma/systems/groma-md/containers/cli/components/src-http-endpoints.md
  - groma/systems/groma-md/containers/cli/components/src-index.md
  - groma/systems/groma-md/containers/cli/components/src-scanner.md
  - groma/systems/groma-md/containers/cli/components/src-structure.md
  - groma/systems/groma-md/containers/cli/components/src-view-host.md
  - groma/systems/groma-md/containers/cli/components/src-work-pins.md
  - groma/systems/groma-md/containers/cli/components/swift-src-index.md
  - groma/systems/groma-md/containers/cli/components/tui-navigation.md
  - groma/systems/groma-md/containers/cli/components/tui-paint.md
  - groma/systems/groma-md/containers/cli/components/tui-plugin-settings.md
  - groma/systems/groma-md/containers/cli/components/typescript-src-index.md
  - groma/systems/groma-md/containers/cli/components/vue-src-index.md
  - groma/systems/groma-md/containers/cli/components/web-export.md
  - groma/systems/groma-md/containers/cli/components/web-page.md
  - groma/systems/groma-md/containers/cli/components/web-server.md
  - groma/systems/groma-md/containers/cli/components/work-model.md
  - groma/systems/groma-md/containers/cli/components/work-source-src-index.md
  - groma/systems/groma-md/containers/cli/components/work-sources.md
  - groma/systems/groma-md/containers/cli/components/workspace-packages.md
  - groma/systems/groma-md/containers/csharp-worker/container.md
  - groma/systems/groma-md/containers/export/components/c4-filter.md
  - groma/systems/groma-md/containers/export/components/camera.md
  - groma/systems/groma-md/containers/export/components/fonts-index.md
  - groma/systems/groma-md/containers/export/components/grid.md
  - groma/systems/groma-md/containers/export/components/island.md
  - groma/systems/groma-md/containers/export/components/iso-project.md
  - groma/systems/groma-md/containers/export/components/map-highlights.md
  - groma/systems/groma-md/containers/export/components/map.md
  - groma/systems/groma-md/containers/export/components/presentation.md
  - groma/systems/groma-md/containers/export/components/task-diff-control.md
  - groma/systems/groma-md/containers/export/components/web-work-pins.md
  - groma/systems/groma-md/containers/export/container.md
  - groma/systems/groma-md/containers/go-worker/container.md
  - groma/systems/groma-md/containers/rust-worker/container.md
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
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Decisions: the focused tags are part of the shared link (repeated tag=) and are not saved as a browser preference, because saved map controls are shared by every map on one address while tags belong to one project; this replaces the tag half of TASK-641. The control lives above the kind legend in the hierarchy pane so it is always visible and reads as a legend; the details pane chips toggle the same list. Neutral routes are one batched stroke, so focus recedes that stroke and lets a route with two matched ends draw its own line, as comparison does. The criterion about authored icons and colors moved to TASK-637, which now comes after this task.

Dogfooding: groma.md own architecture now carries five tags (scanning, map, web, terminal, work) on 74 elements, assigned from the existing groups through groma edit --tags. Verification: bun run check passed (28 Node tests, 1011 Bun tests, 64 environment-dependent skips, 0 failures) before the last change, which keeps an unchanged chip list in place; after it typecheck, lint of the changed files and the focused tests pass. On the exported groma.md map (Iso and 2D, Light and Dark): tag=scanning leaves the scanner groups and the three workers full and recedes the rest; clicking chips in the Tags block and in the details pane toggles the same focus, updates the URL, and the toggled chip keeps keyboard focus; clearing the last tag removes every focus mark.

Cold simplicity review (one round), applied: map names are tag-specific (IsoMap.focusTags, the tag-match class, data-tag-focus, TagSelection.parents) because focus, focused and context already mean camera framing, a flow step and the surface under a selection; dropping a tag the world stopped using is an explicit tagFocus.retain step in applyWorld beside retainFlows and retainSelection, so painting is read-only and its order no longer matters; tagsInUse is the one rule both the URL reader and retain use; groups drawn beside a system island now recede; a hovered or compared route keeps its arrow; the Markdown contract says the map, not selectByTags, decides groups and routes. Removed: the extra state that kept an unchanged chip list in place, so the earlier note about keyboard focus no longer holds; like the flow rows, the Tags block is rebuilt on each paint. The test file is named tag-selection after what it tests.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
The web map can focus on tags. One rule in core (selectByTags) says what a set of tags selects: carriers, everything inside them, and their parents as context. A Tags block above the kind legend lists every tag in use as toggle chips, the details pane chips toggle the same list, and the map recedes everything outside the selection without moving or hiding it. The focus travels in the link as repeated tag= entries. groma.md own architecture is tagged so the project map shows it.
<!-- SECTION:FINAL_SUMMARY:END -->
