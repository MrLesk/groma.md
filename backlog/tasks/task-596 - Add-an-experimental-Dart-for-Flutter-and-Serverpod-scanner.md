---
id: TASK-596
title: Add an experimental Dart for Flutter and Serverpod scanner
status: Done
assignee:
  - '@scanner-dart'
created_date: '2026-10-14 19:38'
updated_date: '2026-10-15 22:15'
labels: []
dependencies: []
references:
  - 'https://github.com/MrLesk/groma.md/issues/132'
  - plugins/scanners/dart/src/index.ts
  - src/scanner/modules/official-catalog.ts
documentation:
  - docs/scanners/creating-a-plugin.md
  - docs/scanners/evidence.md
modified_files:
  - plugins/scanners/dart/worker/pubspec.yaml
  - plugins/scanners/dart/worker/pubspec.lock
  - plugins/scanners/dart/.gitignore
  - plugins/scanners/dart/worker/bin/main.dart
  - plugins/scanners/dart/worker/lib/calls.dart
  - plugins/scanners/dart/worker/lib/source.dart
  - plugins/scanners/dart/package.json
  - plugins/scanners/dart/src/index.ts
  - plugins/scanners/dart/src/worker.ts
  - plugins/scanners/dart/src/parts.ts
  - plugins/scanners/dart/build.ts
  - docs/scanners/dart/index.md
  - test/fixtures/dart-source/main.dart
  - test/fixtures/dart-source/src/cart.dart
  - test/fixtures/dart-source/src/not_a_part.dart
  - test/fixtures/dart-source/types.dart
  - test-bun/dart-scanner.test.ts
  - src/scanner/modules/official-catalog.ts
  - scripts/scanner-release.ts
  - test-bun/scanner-fresh-checkout.test.ts
  - .github/workflows/ci.yml
  - .github/workflows/release.yml
  - README.md
  - docs/scanners/index.md
  - docs/scanners/creating-a-plugin.md
  - docs/scanners/evidence.md
  - bun.lock
  - test-bun/scanner-release.test.ts
  - plugins/scanners/dart/worker/lib/language_versions.dart
  - test-bun/dart-language-version.test.ts
type: feature
ordinal: 674000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
GitHub issue #132 requests Dart for Flutter and Serverpod support so a developer can inspect that source in Groma without installing its project dependencies or development toolchain. The user requested an implementation agent for each scanner, a cold simplicity review, then independent adversarial validation on 3-5 public repositories. Existing scanner contracts own evidence; core owns C4 boundaries and OKF output. Publication and merging are separate from preparing and qualifying these scanners.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A packaged Dart for Flutter and Serverpod scanner reads only Groma-selected inputs and works without separately installed language tools, project dependency installation, build execution, or scan-time downloads.
- [x] #2 Source listing, inventory and Code outlines report supported declarations, visibility and physical source locations deterministically; parse limitations are concrete and do not silently become successful fabricated facts.
- [x] #3 Supported operation, invocation and execution evidence follows the shared contract, preserves uncertainty and caller ownership, and does not infer architecture from imports, folders or names.
- [x] #4 A fresh-project Groma installation, scan and outline exercise the packaged scanner; source inputs remain unchanged and focused regression coverage proves supported language rules.
- [x] #5 The scanner has experimental documentation and the necessary existing catalog and release-build integration, with supported scope and tooling or platform limits stated accurately.
- [x] #6 After simplification, an independent agent chooses 3-5 open-source repositories, records pinned revisions and expected source-backed architecture evidence, compares scans with those expectations and reports mismatches and reproduced defects.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Acceptance criteria have objective verification evidence.
- [x] #2 Relevant checks pass and changes remain task-scoped.
- [x] #3 Public contracts or documentation are updated when behavior changes.
- [x] #4 Implementation Plan reflects the final approach; correction history and verification are recorded in Implementation Notes.
- [x] #5 Cold simplicity review and implementer specification/quality reviews pass; a final full-context complexity review finds no authority-backed blocker.
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Compile official Dart analyzer 14.5.0 with Dart SDK 3.13.5 into a bundled native worker. Parse selected source strings without resolving imports, reading project dependencies, invoking project tools or using the network.
2. Derive language defaults from the nearest selected pubspec.yaml SDK lower bound using official pub_semver/yaml and analyzer feature APIs. Let the official parser apply per-library @dart overrides. Metadata has no inventory, Code reference or architecture owner. TASK-601 supplies the same selected metadata and exact snapshot bytes to live, historical and exported outlines.
3. Keep inventory and physical outlines for top-level functions/types and direct methods/constructors. Preserve library privacy, main evidence, explicit part associations and nested caller boundaries. Calls remain unresolved. Flutter/Serverpod support does not infer framework deployment, provider/navigation dispatch or HTTP/RPC relationships. Core owns C4 placement and ordinary OKF Markdown.
4. Use the existing TypeScript adapter, native package staging/assembly, scanner catalog and experimental documentation. Assemble all five release worker targets with executable permissions; no shared runtime library is needed for the self-contained Dart binary.
5. Verify scanner-contract behavior through the existing compact fixtures: private names must not become public, nested calls must not leak, excluded parts must not be read, a type Code link must not mark its unnamed constructor, syntax recovery must not become facts, and positions/entry/part ownership must be exact. The reproduced LocalSend gap needs the declared-language regression: valid pre-3.13 final parameters, selected nearest metadata, @dart override, metadata exclusion and scan/outline agreement. The existing assembly fixture verifies that no native worker is dropped.
6. Exercise actual package installation, scan and live/historical Code flows against unchanged pinned independent selections, with no project tools/network and unchanged source hashes. Preserve before-fail evidence and completed simplicity, implementer and final complexity reviews. Run focused/native/package checks and the parent combined repository check; distinguish macOS qualification from native Windows/Linux CI.

Cross-platform CI reproduced an upstream setup-action conflict: Windows Swift setup exports its GITHUB_ACTION_PATH, and the Dart action uses that value to locate its optional annotation matcher. Use setup-dart’s documented problem-matcher=false input in CI and release workflows. Dart SDK installation, fatal Dart analysis and scanner tests remain required. Existing real Windows jobs provide the regression; no source-text workflow test is added.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented the official Dart analyzer 14.5.0 source parser in a native executable compiled by pinned Dart SDK 3.13.5. Primary references: https://pub.dev/packages/analyzer, https://pub.dev/documentation/analyzer/latest/dart_analysis_utilities/parseString.html, https://dart.dev/tools/dart-compile, https://dart.dev/language/libraries. Package carries SDK and dependency licenses. Runtime reads only selected text supplied by the adapter; no source dependency resolution or framework dispatch inference. macOS ARM64 package measured 8.31 MB unpacked / 3.28 MB packed. Focused packaged test passes 29 assertions; fresh-checkout test passes 7 assertions with no language SDK on PATH; extracted exact tarball passes the same semantic test. Real Groma local installation and scan produced a main container and combined the library with its reciprocal part, while unrelated files remained outside that container. A constructor-entry regression failed before the fix and passed after it: type Code links never mark unnamed constructors; explicit Type.new is available. Existing release assembly coverage extended for Dart passes 3 tests / 98 assertions. Full repository check is running; its first run found the now-fixed release fixture omission. No publication or native Linux/Windows qualification has occurred.

Cold simplicity review (parent-dispatched) passed with no material code simplification. Applied its documentation-only clarification of Dart Type.name/Type.new constructor entry spelling in the shared authoring guide. Implementer specification review: the selected-source, bundled runtime, concrete syntax failure, deterministic inventory/outline, caller ownership, explicit part/main and experimental documentation requirements are implemented and supported by focused checks. Actual Linux/Windows native qualification and independent 3-5-repository validation remain open; no acceptance criteria are prematurely checked. Implementer quality review: traced manifest selection → adapter UTF-8 reads → native parser → SourceEvidence declarations/operations → Calls traversal → adapter source units/entries → unchanged core. Each responsibility has one named owner; no Groma-owned source is edited and no project tooling or dependency resolver is invoked at scan time. Production source/build files are 29-134 lines, with no new Biome complexity findings. Tests detect wrong physical positions, exposed private names, lost selected-source associations, nested calls wrongly owned by callers, invalid syntax becoming facts, missing runtime, type links marking constructors, and dropped native release workers. They assert semantic outcomes rather than prose or implementation text. No additional authority-backed defect found. Final full repository rerun continues after the release-fixture fix; task stays In Progress for independent repository validation.

Final full check passed after the fixture correction: Biome/TypeScript/Node 16 of 16, Bun 790 pass / 55 skip / 0 fail / 3015 assertions. Log: /tmp/groma-dart-check-final.log. The real Groma static export from the installed package also completed; its snapshot contains all four Dart outlines, library-private constructors/methods, and a type entry that correctly leaves its unnamed constructor unmarked. Local export: /tmp/groma-dart-consumer-export. Implementation is ready for the parent final complexity gate and independent 3-5-repository tests; those later gates remain open.

Independent repository qualification completed on 2026-10-14 after the cold simplicity and final full-context complexity gates. The independent reviewer selected all four projects and wrote expected source-backed responsibilities before scanning. No supported-flow defect or new code fix was found.

| Repository and pinned revision | Selected Dart files | Expected versus observed evidence |
| --- | ---: | --- |
| [Shelf](https://github.com/dart-lang/shelf), `b2cb503d3ba2f0ce6320b820f2b3b0c2b1777485` | 57 | Middleware/request/response/router libraries stayed distinct from execution entries. Twelve physical main functions became example/tool containers; the router-generator main and its declared generated part shared one owner. Public Pipeline/private _Pipeline and public addHandler member visibility were preserved. Calls inside returned middleware callbacks were not attributed to the factory. |
| [Wonderous](https://github.com/gskinnerTeam/flutter-wonderous-app), `747b945a7e5239356bf2664261aa2f3b020b8898` | 192 | Flutter bootstrap produced one main entry. Eighteen explicit library associations produced 144 initial owners; CollectibleFoundScreen and its two widget parts shared one owner, while an ordinarily imported backdrop stayed separate. Ten direct singleton-registration calls remained with registerSingletons; constructors inside registration callbacks did not leak to that caller. |
| [Pixorama](https://github.com/serverpod/pixorama), `6a3603ddfd5cc9368ad90ca839b377f33d099d6e` | 14 | The Flutter and Serverpod physical main files became separate containers. Endpoint setPixel/imageUpdates outlines and direct stream/update calls retained their source caller. UI callback work was not falsely assigned to build. No grouping or HTTP/RPC relationship was invented from Endpoint inheritance, generated client names or imports. |
| [json_serializable.dart](https://github.com/google/json_serializable.dart), `9769ea5c9cfe74687345e67b096a07102239a361` | 75 | Nine explicit part associations produced 66 initial owners. Model examples and committed generated converters shared ownership. Named factories and private converter helpers kept their names, visibility and physical lines. Order.fromJson inside a map callback was absent from the enclosing converter's direct calls, while direct Person/DateTime.parse/map/toList calls remained unresolved. Current null-aware collection syntax parsed. |

Across all four: 338 selected files had unique inventory and source ownership; 1,550 operations, 4,908 unresolved invocations, 678 top-level outlines and 1,343 direct members passed selected-source, physical UTF-16/line, visibility and caller checks. Default exclusions were unchanged. Registry observations repeated identically; the second full reconciliation created no new elements; selected-file SHA-256 hashes and tracked Git source remained unchanged. Removing Shelf's generated part through normal selection removed its inventory, association and entry membership. A copy of Wonderous main with BOM, astral Unicode and CRLF retained correct physical locations.

All four complete workflows passed with an empty HOME, PATH containing only Git, JavaScript fetch disabled and native process networking denied by macOS sandbox-exec. Groma installation, selection, scan/reconciliation, ownership and core Code outlines were exercised; real CLI scanner add, scan and source view also ran. Tested archive SHA-256: `7b24e3a0c4ed2990b81dacaf82947bbe7ee5646b33568c75039d4520f7bf9d60`.

Caveats: this proves source-only coverage, not full Flutter/Serverpod architecture reconstruction. Calls have no resolved targets and initial maps have no inferred collaborations. Full Flutter target membership, provider/navigation dispatch, Serverpod RPC/streams and redirecting-factory outgoing calls remain outside the documented scope; imported sources can remain unplaced until curation. Main entries currently share the source title main and need human titles. Native execution was qualified on macOS ARM64 only; Linux/Windows native CI remains a release qualification step, and the docs state that limit.

Acceptance evidence: AC1 is supported by the isolated no-tools/network-denied workflows; AC2 by complete outline/location/visibility checks plus the focused concrete syntax-failure and repeatability tests; AC3 by source-backed main/part/caller checks and zero fabricated resolved relationships; AC4 by real Groma install/scan/outline and immutable inputs; AC5 by experimental docs, catalog/build integration and the passing five-host assembly test (not a native-host execution claim); AC6 by these four independently chosen pinned repositories and before-scan expectations. DoD evidence: all acceptance items have evidence; bun run check passed (Node 16/16; Bun 790 pass, 55 skip, zero failures); source scope and docs remain aligned; implementation/test rationale and corrections are recorded; cold simplicity, implementer specification/quality and final full-context complexity reviews all passed.

Supporting temporary artifacts: [independent report](/tmp/groma-dart-adversarial/reports/report.md), [pre-scan expectations](/tmp/groma-dart-adversarial/reports/expected-before-scan.md), [pinned revisions and package metadata](/tmp/groma-dart-adversarial/reports/metadata.json), [verification results](/tmp/groma-dart-adversarial/reports/verification.json), [negative checks](/tmp/groma-dart-adversarial/reports/negative-checks.json). Replay scripts and detailed observations are under /tmp/groma-dart-adversarial. The essential URLs, revisions, outcomes and limitations above remain durable in this task if temporary artifacts are removed.

Status remains In Progress by parent instruction pending batch integration and delivery. No code change, check rerun, commit, PR, merge or publication was performed during this record update.

Parent integration review: combined all six scanner implementations in codex/scanner-batch. Package-owned code matches the reviewed language branches byte for byte; shared changes only combine catalog registrations, existing release builders, Dart native build setup, documentation and existing package-test fixtures. The flow remains selected source files -> bundled language parser -> shared outlines/evidence -> existing Groma core. Core still owns C4 boundaries and portable OKF Markdown. No new architecture metadata or shared parser framework was added. Full combined bun run check passed lint, typecheck, 16 Node tests and 822 Bun tests (60 skipped, zero failures; /tmp/groma-batch-check.log). All six fresh-package no-language-tools checks passed together (42 assertions), and native release assembly checks passed (98 assertions). Final documentation-only updates do not change runtime artifacts. Parent specification and quality reviews pass for the documented experimental scope; per-language qualification limits remain in the task and scanner docs. No live groma files changed, and no commit, PR, merge or publication was made.

Additional independent project qualification exposed a valid-language support defect. Reopened under the user request to fix until confident; previous passing results remain evidence but do not close the new supported-flow failure. Implementer owns the focused language fix; parent integrates on PR117 and current main.

Requalification integration from the isolated implementation task:

Readiness reopened after independent full LocalSend scan at 14f3a87426eedffaa9d87d011132eca5501abeb8 failed server.freezed.dart lines 294/791/1130: final constructor parameters are valid under its selected package SDK ^3.11.0, but parseString defaults analyzer language 3.13. Official rules: https://dart.dev/language/versioning and https://dart.dev/changelog#3.13. Source @dart=3.11 alone proves the repro parses; changing user source is not the fix. Pending parent decision: explicitly select pubspec.yaml parser metadata without putting it in architecture inventory, and supply such selected metadata to normal/historical outlines. Repro and original failure: /tmp/groma-dart-confidence-2/reports/pre-fix-failure.log and /tmp/groma-dart-confidence-2/repro/check-language-version.ts. Earlier qualification remains recorded, but affected AC/DoD verification is reopened.

Parent approved explicit **/pubspec.yaml selection and owns the shared live/historical outline context change. Package fix uses official FeatureSet.fromEnableFlags2 with language major/minor from nearest selected pubspec SDK lower bound; official yaml 3.1.4 and pub_semver 2.2.1 were already locked transitive dependencies and are now explicit direct dependencies. Source @dart overrides remain handled by analyzer. No parent-directory discovery, SDK/project dependency resolution, source mutation or ignored diagnostics. Metadata stays out of inventory/Code/ownership. New packaged regression failed before the fix with the reproduced final-parameter diagnostic, then passed after. Both Dart tests now pass 42 assertions: nested package precedence, caret/range lower bounds, source overrides, unselected metadata exclusion, identical scan/outline language, physical UTF-16/line locations, and all previous caller/library/visibility rules. Build native analysis passed. New artifact /tmp/groma-dart-language-packages/dart; review diff /tmp/groma-dart-language-version.diff. Await cold simplicity review before own final reviews.

Cold simplicity re-review of the language-version delta passed with no material recommendation. Implementer specification review: the approved selected-metadata model fixes valid declared-language syntax while preserving source-only inputs, explicit source membership, concrete parse failures, physical locations, and unchanged OKF/C4 ownership. Shared live/historical outline context is parent-owned and remains an integration dependency. Implementer quality review traced selection → requested source/selected pubspec text → nearest selected package feature set → official parser @dart override → unchanged source evidence. Metadata parsing, transport and syntax extraction each have a clear owner; no SDK/context resolver or hidden filesystem lookup is present. The 45-line language helper and existing adapter are understandable without conversation context. The regression proved the actual wrong result by failing before the fix, covers scan and outline using the same input version, checks metadata exclusion and declaration/call locations, and tolerates harmless prose/refactoring changes. No authority-backed blocker found in package scope. Fresh-checkout no-project-tools test passes 7 assertions. Unchanged LocalSend full default selection passes 375 inputs (369 Dart/6 metadata), 9136 operations and 13019 unresolved invocations; formerly failing generated file gives40 outline declarations and metadata inventory is empty. Focused replay: /tmp/groma-dart-language-localsend.ts. Full repository check continues; final full-context review and independent rerun remain open.

Final local full check for the language-version fix passed: Biome/TypeScript and Node16/16; Bun791 pass,55 skip,0 fail,3028 assertions across846 tests/150 files. Log /tmp/groma-dart-language-check.log. Native worker analyze/compile and packaged focused tests are green. Exact candidate archive /tmp/groma-dart-language-packages/groma-scanner-dart-0.1.0.tgz SHA-256 ac1315ae919ba3ce5ce3947f86fe4bd9fdf65eb38f87e8373bfc0ae7775ec58c. Parent full-context review, shared outline context integration and independent real-project reruns remain required; task stays In Progress. No commit, PR or publication.

Final independent Dart requalification passed on the PR117/current-main integration including TASK-601. Fresh unchanged default selections: LocalSend 14f3a87426eedffaa9d87d011132eca5501abeb8 (369 Dart + 6 metadata), Pub 9df389a76385f82c1165c7cf93b78807b5ea8890 (145 + 2), Pixorama 6a3603ddfd5cc9368ad90ca839b377f33d099d6e (14 + 3). Real live/historical Code outlines retain all40 formerly failing generated declarations; current language changes cannot contaminate historical snapshots. Excluded metadata is not secretly read and never gets inventory/Code/ownership. Across projects10352 operations/18552 calls preserve physical positions and caller boundaries; Pub/Pixorama observations and complete outlines match previous successful output exactly. Repeated full worlds and source hashes remain unchanged; macOS sandbox denied network with no Dart/Flutter tools. Final complexity review passed. Durable pinned scope now in docs/scanners/dart/index.md; full independent report /tmp/groma-dart-confidence-3/reports/report.md. Combined final checks remain before completion; no publication.

Integration verification on 2026-10-15: bun run check passed lint/typecheck, 16 Node tests and 865 Bun tests (62 opt-in skips, zero failures, 3,483 assertions), recorded in /tmp/groma-confidence-pre-cpp-check-20261015.log. This run contains final C, Ada, Dart, MQL5, Mojo and TASK-601 code. C++ confidence corrections are still in progress and are not certified by this run. No live groma changes, commit, push, merge or publication.

The user approved committing and opening task-sized PRs, with Windows/Linux/macOS CI green before release. The CI matrix now builds this scanner package and runs the existing fresh-checkout test with language tools removed from PATH and network access rejected. This reuses the verified package-flow coverage; no new behavior or test abstraction is added. Dart tests reuse the package already built by the job. Cross-platform results will be recorded after CI completes.

Windows CI on PRs #151–#153 failed before scanner tests because dart-lang/setup-dart registered its optional matcher under the path exported by compnerd/gha-setup-swift. The official Dart action supports problem-matcher=false; CI and release builds now use that input. The Dart SDK still installs, and build.ts still requires dart analyze --fatal-infos. This preserves all assertions and avoids adding a wrapper or reordering tool installations. Platform verification is pending.

The Windows setup-action correction passed the complete Windows job in CI run38796648925; Linux also passed. macOS completed Dart package building and its no-language-tools scenario before the unrelated Scala build-inside-test timeout, now corrected in TASK-602. The scanner implementation and all required scanner reviews remain complete. Exact-head whole-stack CI is the release gate and will be recorded in PR151 Checks without changing the tested commit.

Release integration brings TASK-605 from current main into both workflows. Dart setup remains in the toolchain parallel groups with its existing disabled problem matcher; the supplied Dart package remains available to repository checks. Package builds and fresh-checkout checks still precede validation. Worker source, language-version handling, assertions, timeouts and all publication gates are unchanged.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added an experimental source-only Dart scanner using a bundled official analyzer worker. Selected pubspec language metadata and source @dart overrides preserve valid Dart syntax; library parts, privacy, physical positions and unresolved calls follow existing scanner contracts. Independent LocalSend, Pub and Pixorama qualification covers 528 source files and 11 metadata files, with historical and excluded-source controls. Required reviews and focused/native/package checks pass. CI builds and tests packaged artifacts without language tools on Windows, Linux and macOS; the whole PR stack must pass before release. No publication has occurred.
<!-- SECTION:FINAL_SUMMARY:END -->
