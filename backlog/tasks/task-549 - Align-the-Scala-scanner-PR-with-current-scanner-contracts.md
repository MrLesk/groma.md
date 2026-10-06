---
id: TASK-549
title: Align the Scala scanner PR with current scanner contracts
status: In Progress
assignee:
  - '@codex'
created_date: '2026-10-06 07:49'
updated_date: '2026-10-06 07:53'
labels: []
dependencies: []
references:
  - 'https://github.com/MrLesk/groma.md/pull/110'
  - modules-discovery
documentation:
  - docs/scanners/creating-a-plugin.md
  - docs/scanners/evidence.md
modified_files:
  - .gitignore
  - README.md
  - bun.lock
  - docs/scanners/creating-a-plugin.md
  - docs/scanners/discovery.md
  - docs/scanners/fresh-checkout-validation.md
  - docs/scanners/java/architecture.md
  - docs/scanners/scala/index.md
  - docs/scanners/scala/proposal-implementation.md
  - docs/scanners/scala/proposal.md
  - docs/scanners/scala/validation.md
  - plugins/scanners/scala/.gitignore
  - plugins/scanners/scala/build.ts
  - plugins/scanners/scala/package.json
  - plugins/scanners/scala/sbt/build.sbt
  - plugins/scanners/scala/sbt/project/build.properties
  - plugins/scanners/scala/sbt/src/main/scala/md/groma/scanner/GromaPlugin.scala
  - plugins/scanners/scala/sbt/src/main/scala/md/groma/scanner/Json.scala
  - plugins/scanners/scala/src/adapter.ts
  - plugins/scanners/scala/src/cache.ts
  - plugins/scanners/scala/src/index.ts
  - plugins/scanners/scala/src/model.ts
  - plugins/scanners/scala/src/process.ts
  - plugins/scanners/scala/src/sbt-global-plugin.sbt.template
  - plugins/scanners/scala/src/sbt.ts
  - plugins/scanners/scala/src/scan.ts
  - plugins/scanners/scala/versions.ts
  - plugins/scanners/scala/worker/build.sbt
  - plugins/scanners/scala/worker/project/build.properties
  - plugins/scanners/scala/worker/project/plugins.sbt
  - >-
    plugins/scanners/scala/worker/src/main/scala/md/groma/scanner/BodyTokens.scala
  - plugins/scanners/scala/worker/src/main/scala/md/groma/scanner/Calls.scala
  - plugins/scanners/scala/worker/src/main/scala/md/groma/scanner/Json.scala
  - plugins/scanners/scala/worker/src/main/scala/md/groma/scanner/Main.scala
  - >-
    plugins/scanners/scala/worker/src/main/scala/md/groma/scanner/Operations.scala
  - plugins/scanners/scala/worker/src/main/scala/md/groma/scanner/Outline.scala
  - plugins/scanners/scala/worker/src/main/scala/md/groma/scanner/Parse.scala
  - plugins/scanners/scala/worker/src/main/scala/md/groma/scanner/Scan.scala
  - plugins/scanners/scala/worker/src/main/scala/md/groma/scanner/Stats.scala
  - plugins/scanners/scala/worker/src/main/scala/md/groma/scanner/Symbols.scala
  - >-
    plugins/scanners/scala/worker/src/main/scala/md/groma/scanner/Visibility.scala
  - scripts/scanner-release.ts
  - src/scanner/modules/official-catalog.ts
  - test-bun/scala-model.test.ts
  - test-bun/scala-outline.test.ts
  - test-bun/scala-parser.test.ts
  - test-bun/scala-sbt.test.ts
  - test-bun/scala-scanner.test.ts
  - test/fixtures/scala-outline/Orders.scala
  - test/fixtures/scala-parse/ApplyInfix.scala
  - test/fixtures/scala-parse/Broken.scala
  - test/fixtures/scala-parse/Calls.scala
  - test/fixtures/scala-parse/DuplicatePrice.scala
  - test/fixtures/scala-parse/Indent.scala
  - test/fixtures/scala-parse/Inventory.scala
  - test/fixtures/scala-parse/Ok.scala
  - test/fixtures/scala-parse/Operations.scala
  - test/fixtures/scala-parse/PackageObject.scala
  - test/fixtures/scala-parse/Selection.scala
  - test/fixtures/scala-parse/Tokens.scala
  - test/fixtures/scala-parse/api/Calls.scala
  - test/fixtures/scala-parse/api/Pricing.scala
  - test/fixtures/scala-sbt-custom-root/build.sbt
  - test/fixtures/scala-sbt-custom-root/modules/Api.scala
  - test/fixtures/scala-sbt-custom-root/project/build.properties
  - test/fixtures/scala-sbt-multi/api/src/main/scala/Api.scala
  - test/fixtures/scala-sbt-multi/build.sbt
  - test/fixtures/scala-sbt-multi/project/build.properties
  - test/fixtures/scala-sbt-multi/worker/src/main/scala/Worker.scala
  - test/fixtures/scala-sbt-single/LICENSE
  - test/fixtures/scala-sbt-single/META-INF/MANIFEST.MF
  - test/fixtures/scala-sbt-single/NOTICE
  - test/fixtures/scala-sbt-single/build.sbt
  - test/fixtures/scala-sbt-single/project/build.properties
  - test/fixtures/scala-sbt-single/src/main/scala/Shop.scala
  - test/fixtures/scala-sbt-single/src/test/scala/ShopSpec.scala
type: feature
ordinal: 632000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
PR #110 adds a Scala 3 scanner using Scalameta, but it predates current main and has no matching Backlog task. Alex requested updating the contributor branch and making it follow current scanner practices. The current sbt model loader executes project build definitions, can download during scanning, and hides some failures, conflicting with the source-only fresh-checkout contract. Preserve useful parser work and the supported Scala example while removing these conflicts; this task prepares the existing PR for review, not a release.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The contributor PR branch includes the latest main, preserves unrelated changes, and is linked to this task.
- [ ] #2 The installed Scala scanner inventories and outlines selected Scala source without project builds, dependency installation, scan-time downloads, or a separately installed language SDK.
- [ ] #3 Source selection, original locations, call certainty, and parse failures follow the shared scanner contracts; source facts do not invent architecture boundaries or relationships.
- [ ] #4 Discovery, package builds, source listing, and documentation agree on the supported Scala scope and use the existing scanner delivery flow.
- [ ] #5 Focused scanner and installed-package checks, the repository check, and the required review loop pass with recorded evidence.
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
1. Merge current main into PR #110, preserve the contributor history, and retain Scala, COBOL and NASM in discovery and release assembly.
2. Implement Alexs approved source-only approach: the scanner reads only host-selected .scala files, using a bundled Scalameta worker and Java runtime. Remove project sbt execution, module-model caching, build-tool imports from Groma core, and installed-Java fallback. Source selection belongs to existing include/exclude lists; no sbt module evaluation or new settings layer.
3. Keep declarations, outlines and bounded source evidence in the existing contract. Fail scans on invalid selected syntax instead of publishing partial evidence; leave unproven calls uncertain. Temporary source groups are not C4 elements; core owns boundaries and existing OKF Markdown remains unchanged.
4. Match the existing maintainer-build and package-assembly flow, bundle required tools and licenses, document the supported Scala dialect and limits, and remove obsolete sbt implementation/proposal material.
5. Coverage rationale: the shared selection/fresh-checkout contract requires selected custom paths to scan without sbt, network, SDKs or source mutations; replace model-injection tests with one selected-source test and extend the existing relocated-package harness. The atomic observation contract requires a broken selected file to reject the scan; replace the partial-success test. The evidence contract requires correct source positions and no false certainty under shadowing; extend the current parser fixture minimally after reproducing that defect. Existing outline/token fixtures cover their original rules and will be retained where meaningful. Tests must run concurrently and must not rebuild shared worker output from several test files.
6. Build the package, run focused checks, run the cold simplicity review, apply accepted deletions, then run bun run check and own specification/quality reviews followed by the full-context complexity review. Curate task source ownership with Groma CLI.
7. Push scoped commits to the existing contributor branch, update PR title/description with TASK-549 and final supported behavior, and report checks and any remaining blockers. Do not merge or publish a release.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
No matching Scala task was found. PR head is 604a20a7507f560910976879baca727efd00c24b; latest fetched main is db90ec94f5018017b7a28077657f870e3d460e94. The initial modified-file list records the contributor PR scope. Source-only scanning is the current contract; replacing sbt model evaluation changes automatic module/source-root selection and is awaiting Alexs direction.

Resolved release assembly conflicts by retaining Scala alongside the COBOL and NASM additions from main. Main-owned source and architecture changes remain intact.

Alex explicitly approved replacing sbt module evaluation with source-only scanning and confirmed that scanners must be independent of installed tools. The source-only scope is now authorized. Main merge conflicts are resolved; its unrelated files and architecture are preserved.
<!-- SECTION:NOTES:END -->
