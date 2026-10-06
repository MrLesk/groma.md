---
id: TASK-549
title: Align the Scala scanner PR with current scanner contracts
status: In Progress
assignee:
  - '@codex'
created_date: '2026-10-06 07:49'
updated_date: '2026-10-06 08:40'
labels: []
dependencies: []
references:
  - 'https://github.com/MrLesk/groma.md/pull/110'
  - modules-discovery
  - scala-src-index
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
  - plugins/scanners/scala/THIRD-PARTY-NOTICES.txt
  - test/fixtures/scala-parse/Rules.scala
  - test-bun/scanner-fresh-checkout.test.ts
  - test-bun/scanner-release.test.ts
  - docs/scanners/index.md
  - groma/systems/groma-md/components/adapter.md
  - groma/systems/groma-md/components/process.md
  - groma/systems/groma-md/components/scala-src-index.md
  - groma/systems/groma-md/containers/cli/components/scala-src-index.md
  - >-
    backlog/tasks/task-549 -
    Align-the-Scala-scanner-PR-with-current-scanner-contracts.md
type: feature
ordinal: 632000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
PR #110 adds a Scala 3 scanner using Scalameta, but it predates current main and has no matching Backlog task. Alex requested updating the contributor branch and making it follow current scanner practices. The current sbt model loader executes project build definitions, can download during scanning, and hides some failures, conflicting with the source-only fresh-checkout contract. Preserve useful parser work and the supported Scala example while removing these conflicts; this task prepares the existing PR for review, not a release.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The contributor PR branch includes the latest main, preserves unrelated changes, and is linked to this task.
- [ ] #2 The installed Scala scanner inventories and outlines selected Scala source without project builds, dependency installation, scan-time downloads, or a separately installed language SDK.
- [x] #3 Source selection, original locations, call certainty, and parse failures follow the shared scanner contracts; source facts do not invent architecture boundaries or relationships.
- [x] #4 Discovery, package builds, source listing, and documentation agree on the supported Scala scope and use the existing scanner delivery flow.
- [ ] #5 Focused scanner and installed-package checks, the repository check, and the required review loop pass with recorded evidence.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Acceptance criteria have objective verification evidence.
- [ ] #2 Relevant checks pass and changes remain task-scoped.
- [x] #3 Public contracts or documentation are updated when behavior changes.
- [x] #4 Implementation Plan reflects the final approach; correction history and verification are recorded in Implementation Notes.
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Merge current main into the contributor branch without rewriting its history; preserve the existing COBOL/NASM additions.
2. Read only host-selected .scala files through the bundled Scalameta parser and Java runtime. Existing include/exclude lists own source selection. No sbt model, cache, build evaluation, project dependencies, scan-time download, or installed-tool fallback.
3. Emit declarations, operation/call UTF-16 positions and conservative unresolved calls. A bad selected file rejects the observation. Omit optional body fingerprints and their ranges. Packages and the single source root are evidence scopes; core owns C4 boundaries and existing OKF Markdown.
4. Reuse existing maintainer builds, release assembly and relocated-package validation. Document experimental Scala 3 scope and ship upstream license texts. Remove obsolete sbt implementation, proposals and tests.
5. Coverage: extend existing parser/outline examples for the shared source selection, atomic failure, position and outline contracts. Wrong custom-path selection, partial observations, shadowed-call certainty, missing calls, missing constructors/abstract methods and package-name flattening must fail. Existing tests lacked these cases; one isolated package test plus the existing fresh-checkout/release harnesses closes the gaps without shared worker builds.
6. Run focused checks; cold simplicity review; accepted cleanup and focused recheck; bun run check; implementer specification/quality reviews; final full-context complexity review. Curate and rescan the existing CLI scanner component through Groma.
7. Push to the existing draft PR #110, update its title/body and task linkage, and leave merging/releasing to later approval.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
No matching Scala task was found. PR head is 604a20a7507f560910976879baca727efd00c24b; latest fetched main is db90ec94f5018017b7a28077657f870e3d460e94. The initial modified-file list records the contributor PR scope. Source-only scanning is the current contract; replacing sbt model evaluation changes automatic module/source-root selection and is awaiting Alexs direction.

Resolved release assembly conflicts by retaining Scala alongside the COBOL and NASM additions from main. Main-owned source and architecture changes remain intact.

Alex explicitly approved replacing sbt module evaluation with source-only scanning and confirmed that scanners must be independent of installed tools. The source-only scope is now authorized. Main merge conflicts are resolved; its unrelated files and architecture are preserved.

The original worker compiles with its pinned versions. Its first dependency download timed out at repo1.maven.org; the build succeeded using Maven Centrals official repo.maven.apache.org endpoint. Inspecting the built JAR found no license or notice entries: the custom assembly strategy discards them. Scalametas published POM declares BSD, not the Apache license stated by the PR build script. Maintainer packaging will retain upstream licenses and correct attribution.

Evidence review: syntax alone cannot prove a call target, so all Scala calls remain unresolved. Body fingerprints are optional in the shared contract. The current normalizer also lacks local binding resolution; remove that optional output instead of adding a semantic analyzer to this PR. Scala will provide operations and original ranges but no duplicate-body findings. Outline contract gaps are reproduced by the existing ordinary class fixture (missing constructor); add a small abstract-method/top-level-lambda/package-name fixture to cover missing members and an object wrongly flattened because its name equals the package. Existing outline tests cover neither case. Extend the existing release assembly test with Scala because its new catalog entry requires the same host runtime merge; no separate release harness.

Focused Scala package check passes (22 assertions), including custom source paths, strict parse failure, source positions, conservative call evidence, and outlines. Shared relocated-package harness passes (7 assertions) with empty home, no language tools on PATH, network fetch disabled, repeated scans identical, and unchanged checkout. Existing five-host runtime assembly checks pass including Scala. No body tokens or their optional ranges are emitted; declaration and invocation UTF-16 positions remain. A newer main CI/architecture fix arrived during implementation and has been merged. The cold simplicity review is running.

Cold simplicity review passed without blockers. Accepted both deletions: folded the single-use process runner into adapter.ts and removed unused custom-root fixture build metadata. Scala source has one component in the existing CLI language-scanner group. No new C4 level or OKF metadata was introduced.

Required check passed: bun run check; Node 16 pass, Bun 765 pass / 51 existing optional skips / 0 failures. Lint has one existing warning and two existing infos outside this change; changed Scala/package tests have no lint findings. Final Scala package and relocated no-tools test both pass after simplicity cleanup. Implementer specification review: approved selected-source flow, failure/position/outline contracts, discovery, package assembly, documentation and task linkage are satisfied; pushing the PR remains the delivery step. Implementer quality review: traced selected paths -> adapter -> bundled parser -> inventory/operations/uncertain calls or strict failure -> shared observation; no project build, cache, installed-tool fallback, download or core import remains at scan time. New assertions detect incorrect selection, shadowed-call certainty, missing calls, wrong UTF-16 positions, partial success and missing outline members; none freezes implementation text or prose. No blocking defect found. Two architecture rescans created zero components and preserve the Scala scanner group and Code references. Other locally unbuilt C#/Go/Java/Rust scanners retained their saved evidence; these unrelated workers were not rebuilt for this task.

The final full-context complexity review passed with no blockers or material simplifications. Domain ownership and usage are clear; no architecture expansion is needed. Both independent review gates and implementer reviews are complete.

Published implementation commit 6573c6fb to aboisvert/groma.md:scala3-scanner and updated PR #110 title/body with the task link. GitHub confirms it is mergeable and remains a draft. Main is synchronized through 0a75d08d (its final change is only TASK-550 notes). GitHub's architecture comparison fails before project code runs: actions/checkout v7 refuses a fork head in pull_request_target. This is a repository workflow issue outside the Scala change; no unsafe-checkout bypass was added. Standard fork CI needs workflow approval. Local required checks and all review gates remain passed.

Real-project validation requested by Alex on 2026-10-06 used the relocated built package from PR head 97976413 on macOS ARM64, Groma's default Scala include/exclude selection, empty homes, and PATH containing only git. No project build or dependency installation ran. All three checkouts stayed byte-for-byte unchanged for tracked files and clean including ignored/untracked files. JS fetch was disabled; this was not an OS-level network isolation test.

- softwaremill/ox at e343bba8b713a19ee627533d79fabd1033fabeb6 (Scala 3.3.8): 214 selected/inventoried files, 438 symbols, 680 operations, 2,809 unresolved calls. Repeated observations match; operation/call offsets are in bounds, call offset/line pairs agree, and outline lines are in bounds. Source comparison found missing extension methods: core/src/main/scala/ox/channels/BufferCapacity.scala:8 toInt is absent from symbols, operations and outline; core/src/main/scala/ox/collections.scala contains public collectPar/filterPar/foreachPar extension methods, but only private commonPar appears.
- kitlangton/neotype at d278c46814d581eb434b92f22036a5a5a5ace706 (Scala 3.3.8): 188 selected/inventoried files, 432 symbols, 793 operations, 5,791 unresolved calls. Same repeatability and position consistency checks pass, including parsing macros without project dependencies. The top-level extension unwrap in modules/core/shared/src/main/scala/neotype/package.scala:150 is missing from operations and outline; the ordinary Newtype.unwrap at line 138 is present.
- getkyo/kyo at ba27c7a69d6538d836fe2eca924c0d8ad79f1148 (default Scala 3.9.0): 4,307 selected files. The parser rejects kyo-combinators/shared/src/main/scala/kyo/EmitCombinators.scala:46 at ArrowEffect.handleCont(tag, effect): [C] => with "identifier expected but [ found". Scan fails atomically, with no partial observation. No failing files were excluded to obtain a pass.

Reports, input lists, successful observations and the reproducible temporary harness are in /tmp/groma-scala-real-projects.Vkj4ZD. This audit supersedes the earlier readiness conclusion: task reopened because extension outlines are incomplete and the declared Scala 3 scope encounters a real parser failure. Recommend fixing extension extraction and investigating parser support before merging, then rerunning these same revisions. No scanner code changed during this audit. PR remains draft; npm publication is explicitly deferred until after merge. Standard CI was approved by Alex and started; Linux has passed, macOS and Windows were still running at the latest check.
<!-- SECTION:NOTES:END -->
