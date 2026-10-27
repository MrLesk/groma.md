---
id: TASK-632
title: Resolve compiled assets in AOT executables
status: In Progress
assignee:
  - '@codex'
created_date: '2026-10-27T21:04:00Z'
updated_date: '2026-10-27T22:12:00Z'
labels: []
dependencies: []
references:
  - src/compiled-asset.ts
  - scripts/build.ts
modified_files:
  - src/compiled-asset.ts
  - test-bun/compiled-scanner.test.ts
ordinal: 700000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
AOT preserves module directories, so compiledAsset resolves shipped guides and web credit files beneath src instead of the embedded asset root. This blocks guides and web export.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 AOT builds read shipped agent guides outside the checkout
- [ ] #2 AOT and regular compiled builds export a map with its embedded renderer, credits and cover images
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
Use the mandatory embedded docs directory to locate the asset root in the bundled root or the parent of the AOT src module. Extend compiled scanner coverage to read a shipped guide and verify exported renderer and PNG covers. Compare unchanged source, stable compiled and AOT artifacts outside the checkout. Run repository checks and distinguish baseline failures.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Baseline reproduced guide and credit ENOENT errors. Latest upstream head is 4f7f658ed173fc23500de183b3713a8ddc18ba33, but bun-pr still selects the latest available successful Linux artifact d260d7d51 from build 133944. Two Backlog watcher lifecycle tests fail identically on unchanged origin/main and this branch in this environment.

Implemented asset-root lookup from the required embedded docs directory, supporting both flattened bundles and AOT src module paths. Extended the existing compiled scanner test: local scanner dependency, shipped inspect guide, exported renderer and PNG signature all pass under stable Bun 1.4.4 (8 assertions). Stable compiled smoke also passes all six commands. AOT guide/map/local scanner/lint now pass with allowCodeFromDisk; export advances beyond missing credits but does not finish within 30 seconds, so AOT export AC remains open. Full check finds missing jar/swiftc and baseline watcher failures; changes are not claimed fully validated. Release defaults remain unchanged.

Further isolation: source exporter stage probe succeeds under stable Bun (map, source outlines, source texts, 28816-byte SVG, Resvg construction/render, 354390-byte PNG). AOT compilation of that smaller probe crashes in LinkAndEmit. A smaller Resvg+fontBuffers program reading that SVG also crashes at build time (index out of bounds len 256 index 1049517) on d260d7d51, whereas the previous font-free 1px Resvg probe compiles/runs. No evidence yet that the export timeout is the same bug; do not conflate them. Current upstream head remains 4f7f658ed173fc23500de183b3713a8ddc18ba33. Scratch export-stages-probe.ts, resvg-font-probe.ts, build logs and bun.report crash URLs are available pending minimized upstream reproducer.
<!-- SECTION:NOTES:END -->
