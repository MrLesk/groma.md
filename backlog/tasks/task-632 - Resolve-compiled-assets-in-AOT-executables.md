---
id: TASK-632
title: Resolve compiled assets in AOT executables
status: In Progress
assignee:
  - '@codex'
created_date: '2026-10-27T21:04:00Z'
updated_date: '2026-10-27T23:15:00Z'
labels: []
dependencies: []
references:
  - src/compiled-asset.ts
  - scripts/build.ts
modified_files:
  - src/compiled-asset.ts
  - test-bun/compiled-scanner.test.ts
  - src/viewers/web/sharing/images.ts
ordinal: 700000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
AOT preserves module directories, so compiledAsset resolves shipped guides and web credit files beneath src instead of the embedded asset root. This blocks guides and web export.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 AOT builds read shipped agent guides outside the checkout
- [x] #2 AOT and regular compiled builds export a map with its embedded renderer, credits and cover images
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Acceptance criteria have objective verification evidence.
- [ ] #2 Relevant checks pass and changes remain task-scoped.
- [x] #3 Public contracts or documentation are updated when behavior changes.
- [x] #4 Implementation Plan reflects the final approach; correction history and verification are recorded in Implementation Notes.
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Locate embedded guides and credit assets from the mandatory docs directory in regular bundles and AOT module layouts. Keep the default WASM loader for Resvg so AOT precompiles the renderer. Extend existing compiled scanner coverage with guide, renderer and PNG checks; verify stable compilation, AOT and AOT+trim outside the checkout. Exercise official TypeScript packaging, workers, native web/watch and terminal flows. Run the full required check and qualify existing environment failures. Leave release defaults unchanged.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Baseline reproduced guide and credit ENOENT errors. Latest upstream head is 4f7f658ed173fc23500de183b3713a8ddc18ba33, but bun-pr still selects the latest available successful Linux artifact d260d7d51 from build 133944. Two Backlog watcher lifecycle tests fail identically on unchanged origin/main and this branch in this environment.

Implemented asset-root lookup from the required embedded docs directory, supporting both flattened bundles and AOT src module paths. Extended the existing compiled scanner test: local scanner dependency, shipped inspect guide, exported renderer and PNG signature all pass under stable Bun 1.4.4 (8 assertions). Stable compiled smoke also passes all six commands. AOT guide/map/local scanner/lint now pass with allowCodeFromDisk; export advances beyond missing credits but does not finish within 30 seconds, so AOT export AC remains open. Full check finds missing jar/swiftc and baseline watcher failures; changes are not claimed fully validated. Release defaults remain unchanged.

Further isolation: source exporter stage probe succeeds under stable Bun (map, source outlines, source texts, 28816-byte SVG, Resvg construction/render, 354390-byte PNG). AOT compilation of that smaller probe crashes in LinkAndEmit. A smaller Resvg+fontBuffers program reading that SVG also crashes at build time (index out of bounds len 256 index 1049517) on d260d7d51, whereas the previous font-free 1px Resvg probe compiles/runs. No evidence yet that the export timeout is the same bug; do not conflate them. Current upstream head remains 4f7f658ed173fc23500de183b3713a8ddc18ba33. Scratch export-stages-probe.ts, resvg-font-probe.ts, build logs and bun.report crash URLs are available pending minimized upstream reproducer.

Export root cause isolated: the explicit type:file attribute bypasses WASM precompilation on compiler d260d7d51. With the default WASM loader, the identical 1200x630 solid-image probe renders in 21.24ms rather than 929.43ms. The old full exporter finishes in 38.875s (not a deadlock); the reduced font-module compiler crash is separate and does not block the real CLI build. Removed only that loader override in sharing/images.ts. Real AOT and AOT+trim builds now pass guide/plain map/local scanner dependency/scan/lint/static export. All three cover PNGs are byte-identical to the previous AOT output. Stable compiled regression: 1 pass, 8 assertions. Packaged official TypeScript scanner and native SDK worker: scan/lint/plain view/export pass in both modes; export ~2.2 seconds per mode. Native HTTP checks pass HTML, embedded JS, world JSON and all 3 covers in both modes; SIGTERM exits 0. Source watch refreshes the live world in 306ms/406ms and closes cleanly. AOT+trim real PTY renders the map, d opens API details, Escape returns and Ctrl+C exits 0. Existing packaged-native/npm runtime test passes 7 assertions. Current full check lint/types/Node tests pass; Bun suite 904 pass, 63 skip, 29 fail of 996. Same missing scanner toolchains and baseline watcher failures plus one scanner-update timing failure, isolated rerun pending; do not claim the full check is green. Same compiler, same final source, plain-view fixture, 10 measured runs after 2 warmups: JIT bytecode 175135432 bytes / 54.17ms / peak RSS median 73402 KiB; AOT 179837896 bytes / 31.58ms / 61508 KiB; AOT+trim 128065992 bytes / 29.29ms / 59080 KiB. Linux x64 small fixture only. Logs groma-check-wasm-loader.log, groma-web-aot-smoke.log, groma-watch-aot-smoke.log, official-typescript-smoke.log, groma-mode-benchmark.json. Cross-platform qualification and shipping build options remain separate outstanding work.

The extra scanner-update timing test passes in an isolated rerun (1 pass, 7 assertions); its full-suite failure is not attributed to the WASM import change. Self specification review: both asset/export ACs have direct Linux native evidence. Self quality review: the two delivery fixes preserve source/regular bundled execution, keep embedded fonts/assets and avoid adding a compatibility layer; no task source changes under groma/.

Correction: the isolated scanner-update rerun contains 10 assertions (the 7-assertion result belongs to packaged-native/npm runtime validation).
<!-- SECTION:NOTES:END -->
