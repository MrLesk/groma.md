---
id: TASK-598
title: Add an experimental Mojo scanner
status: Done
assignee:
  - '@scanner-mojo'
created_date: '2026-10-14 19:38'
updated_date: '2026-10-15 19:29'
labels: []
dependencies: []
references:
  - 'https://github.com/MrLesk/groma.md/issues/143'
  - plugins/scanners/mojo/src/index.ts
  - src/scanner/modules/official-catalog.ts
documentation:
  - docs/scanners/creating-a-plugin.md
  - docs/scanners/evidence.md
modified_files:
  - plugins/scanners/mojo/package.json
  - bun.lock
  - plugins/scanners/mojo/src/parser.ts
  - plugins/scanners/mojo/src/source.ts
  - plugins/scanners/mojo/src/index.ts
  - plugins/scanners/mojo/build.ts
  - plugins/scanners/mojo/THIRD-PARTY-NOTICES.txt
  - test/fixtures/mojo-source/main.mojo
  - "test/fixtures/mojo-source/library.\U0001F525"
  - test/fixtures/mojo-source/tests/broken.mojo
  - test-bun/mojo-scanner.test.ts
  - src/scanner/modules/official-catalog.ts
  - scripts/scanner-release.ts
  - README.md
  - docs/scanners/index.md
  - docs/scanners/creating-a-plugin.md
  - docs/scanners/evidence.md
  - test-bun/scanner-fresh-checkout.test.ts
  - docs/scanners/mojo/index.md
  - test/fixtures/mojo-source/modern.mojo
  - plugins/scanners/mojo/grammar/tree-sitter-mojo.wasm
  - plugins/scanners/mojo/grammar/grammar.patch
  - plugins/scanners/mojo/grammar/README.md
  - plugins/scanners/mojo/.gitignore
  - .github/workflows/ci.yml
type: feature
ordinal: 676000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
GitHub issue #143 requests Mojo support so a developer can inspect that source in Groma without installing its project dependencies or development toolchain. The user requested an implementation agent for each scanner, a cold simplicity review, then independent adversarial validation on 3-5 public repositories. Existing scanner contracts own evidence; core owns C4 boundaries and OKF output. Publication and merging are separate from preparing and qualifying these scanners.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A packaged Mojo scanner reads only Groma-selected inputs and works without separately installed language tools, project dependency installation, build execution, or scan-time downloads.
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
1. Bundle the MIT Mojo-specific lsh/tree-sitter-mojo e5905c480b9ebbeb4195032805781a5e535547f7 grammar, its documented source-backed patch and web-tree-sitter 0.27.1. Normal builds copy checked-in assets and licenses. Only maintainers regenerate the grammar; scans need no Mojo tools, builds, dependencies or network.
2. Parse only selected .mojo/.🔥 files and reject syntax recovery. Keep top-level declarations, directly declared members, named executable bodies and unresolved calls at exact physical positions. Legacy fn syntax is outside the declared modern scope. Imports, folders and names do not invent C4 boundaries, targets or generated methods; core retains OKF/C4 ownership.
3. Give nested executable scopes their own callers. Declaration headers, decorators, defaults and compile-time bracket arguments contribute no enclosing runtime calls. Both subscript and parameter-list forms of brackets are omitted because syntax cannot prove generic versus runtime indexing; ordinary base and argument calls remain.
4. Test current scanner contracts with the existing small fixtures: wrong ownership would leak closure/decorator/default/comptime calls; wrong outline extraction would include nested declarations or shift UTF-16/name locations. The source-backed syntax fixtures cover escaped imported names, adjacent literal calls, empty generic brackets, if-case, capturing declarations, where-else diagnostics and keyword-named methods. The bracket regression covers one/multiple/named compile-time values while retaining ordinary runtime arguments. Keep before-fail evidence in notes rather than test implementation text.
5. Integrate the package through the existing catalog, release build and experimental docs. Verify isolated fresh consumption, source immutability, repeatability, real Groma scans/outlines, upstream corpus and focused/full checks. Preserve cold simplicity, implementer and final complexity reviews plus independent pinned-project comparisons. Distinguish full successful selections, explicitly unsupported old syntax and confirmed invalid source; do not replace failed selections with successful subsets.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Parser feasibility verified: dmitry-salin/tree-sitter-mojo v1.0.5 released WASM (MIT) loads under web-tree-sitter 0.27.1. Current official Mojo docs version 1.1.0 describe def; older fn syntax is not accepted by the selected grammar. Source evidence remains temporary; Groma core retains OKF Markdown and C4 ownership/relationship meaning.

Implemented plugins/scanners/mojo with a 194-line source adapter/parser/analyzer and a 37-line maintainer build. The parser is MIT-licensed; the build verifies the released WASM SHA-256 and bundles web-tree-sitter 0.27.1. The npm archive has 6 files, 201.20 KB compressed and 1.1 MB unpacked, without install scripts or runtime npm dependencies.
Focused package checks pass (1 test, 27 assertions); the shared fresh-checkout check passes (1 test, 7 assertions) with network disabled and no language tools on PATH, stable repeated observations and unchanged source. TypeScript and focused Biome checks pass. A real temporary Groma project installed /tmp/groma-mojo-packages/mojo through scanner add, scanned both selected source files, and the standard readCodeStructure viewer path returned all expected declarations. No live repository groma/ files were changed.
Scope is modern def syntax accepted by tree-sitter-mojo 1.0.5; legacy fn fails clearly. Calls remain unresolved. Only main() own-file entry membership is emitted. Named nested bodies own their calls; lambda/generator bodies, declaration headers/defaults/decorators and explicit comptime statements do not contribute enclosing-operation calls. The full repository check is still running; cold simplicity and independent repository validation remain pending.

Cold simplicity review found decorator calls leaking into the enclosing operation for a nested decorated function. Extended the existing fixture: the focused test failed with unwanted wrapper and make_decorator calls before the fix. Added decorated_declaration to skipped invocation subtrees while independent operation traversal still finds the nested body. Focused package test passes again (27 assertions); fresh-checkout check passes again (7 assertions). No broader consolidation or architecture change requested.

Implementer specification review after cold fix: AC1-5 are represented by selected-input listing/reading, bundled parser/runtime, strict syntax failures, modern declarations/outlines, unresolved calls, own-file main entry evidence, catalog/release entries and experimental docs. Focused packaged tests and a real Groma CLI install/scan/outline provide current local evidence. AC6 and final completion remain pending independent 3-5 repository validation; task stays In Progress.
Implementer quality review: traced selected paths through index.ts -> parser.ts -> source.ts -> createScanObservation/readCodeStructure. index.ts owns selection and file reads, parser.ts owns package assets, syntax failure and tree lifetime, source.ts owns declaration scopes and uncertain call facts. No project config execution, source writes, name-based target guesses, new C4/OKF concepts or extra analyzer abstraction. The three source files stay below 110 lines each. The focused assertions would reject the observed nested-decorator leak, omitted nested ownership, incorrect UTF-16 offsets, an imported-file main membership guess, fabricated provider certainty and lost physical name lines. They check protocol values and semantic results rather than documentation prose. No remaining blocker found in the implemented supported flow. Full repository check and independent repository validation are still pending.

Final required bun run check after nested-decorator fix passed: 790 Bun tests passed, 55 skipped, 0 failed, 3001 assertions across 149 files; lint/typecheck/Node tests also completed successfully. Log: /tmp/groma-mojo-check-final.log.
Independent qualification is not complete. Parent reports early current-repository syntax failures in adjacent string literals with a method call, empty generic brackets on a member and if-case syntax, plus possible compile-time generic argument call attribution. Waiting for minimized source-backed reproductions before changing parser or analysis; task remains In Progress and is not release-ready.

Current-source defects reproduced and corrected: the new modern fixture failed first under the released parser at adjacent_strings modern.mojo:6:20. Pinned lsh grammar accepts the original adjacent-string, empty-parameter, if-case and capturing witnesses; the four-hunk grammar patch accepts escaped imports, where-else diagnostics and the from method in the actual current sources. Parser asset SHA-256: 2e68572a0c0beed3d76322c146fdf5702f5c525d5c50e3bad54d3fd1eb3908b2. Rebuild uses Tree-sitter CLI0.26.3 and WASI SDK29.0; regular package builds copy the checked-in asset and need no grammar toolchain or download. The patch and exact provenance are checked in under plugins/scanners/mojo/grammar. Maintaining three narrow syntax corrections is an explicit parser-update cost, not a new language analysis layer.
Adapted source.ts to the new grammar fields and retained nested decorated-body ownership. Per the approved conservative rule, traversal visits a subscript base but omits bracket contents; this avoids inventing runtime calls from compile-time parameters and also omits calls used only as computed runtime indices. Ordinary argument and base calls remain. The modern fixture verifies consume[config()](argument()) plus make_items()[another_index()] and fails if a compile-time/index call leaks or an ordinary runtime call disappears.
Focused package test passes33 assertions; fresh-checkout test passes7 with tools and network unavailable. Full selected scanner and outline calls now complete for NuMojo85/85 files (1535 operations,6604 invocations), BlazeSeq63/63 (693,3239), and official Mojo297/297 (4566,14036). All original minimized current-syntax repros scan; compile_time_call contains print and consume calls but no config runtime call. These are implementer checks; independent architecture qualification is being repeated. Package archive contains6 files,0.51MB compressed/8.31MB unpacked. The larger generated parser is portable WASM with no platform-specific package or runtime dependency. Full repository check after these changes is running; task remains In Progress.

Required bun run check after the current-grammar replacement and bracket-call correction passed: 790 Bun tests passed, 55 skipped, 0 failed, 3007 assertions across149 files; lint, typecheck and Node suite also passed. Log: /tmp/groma-mojo-check-current-grammar.log. A second grammar build reproduced the exact checked-in SHA-256. A fresh temporary Groma project completed init, local scanner installation, scan and source view with network blocked and language tools absent; the normal Code outline path returned modern.mojo declarations and exact physical name lines. No live groma/ files changed. Targeted external re-review and independent public-repository requalification remain pending.

Targeted retest found the original compile-time ownership issue persisted for multiple bracket values: the pinned grammar uses parameter_list for those values, while one value can be subscript. Extended the existing parameter_caller fixture with multiple positional values and the actual named MLIR form. Before the fix, the focused assertion failed with two unwanted config calls plus __mlir_attr and _get_kgen_string. Invocation traversal now stops at parameter_list as well as skipping subscript contents. The upstream rule defines parameter_list exclusively with square brackets; runtime argument_list uses parentheses and remains traversed. No grammar changes.
After the correction, focused33 assertions and fresh-checkout7 assertions pass; focused Biome, TypeScript and diff checks pass. Rebuilt package and archive at /tmp/groma-mojo-packages. Original multiple_bracket_call now reports print and consume only; mlir_bracket_call reports pop.fence only. Scanning actual BlazeSeq examples/example_parser.mojo reports zero ParserConfig calls, including the original line75/115 witnesses. Full-suite rerun is intentionally deferred until independent confirmation of this same finding.
Targeted specification/quality review: AC3 now has one clear runtime boundary for each bracket AST form. The two-line guard and explanation remain in source.ts where invocation traversal owns this rule; index/parser responsibilities are unchanged. Existing exact semantic assertion rejects all four observed false calls while retaining consume/consume_pair, ordinary argument calls, pop.fence and make_items. No wording or implementation-text assertions, extra abstraction, recovery, guessed targets or model changes were added. Task remains In Progress for independent confirmation and final required check.

Independent repository qualification is complete for the documented experimental scope. The tester chose the following four public repositories before inspecting scan output and kept their revisions fixed. No extra exclusions were added to obtain passing modern-source scans; the scanner's normal test/build exclusions apply.

- [NuMojo](https://github.com/Mojo-Numerics-and-Algorithms-group/NuMojo/tree/515fb2856f0ecf3d2740a34d958fe168183e1129), commit 515fb2856f0ecf3d2740a34d958fe168183e1129: all 85 selected files scan. Expected array representation, storage ownership and creation routines to remain separate source responsibilities, with overloaded declarations and nested callbacks preserved. Observed exact owners for numojo/core/ndarray.mojo, core/memory/data_container.mojo and routines/creation.mojo; NDArray at line110 has196 direct members and DataContainer has19. Nested callbacks own their calls. examples/quickstart.mojo has only its own file in its execution entry, without absorbing imported library files.
- [BlazeSeq](https://github.com/MoSafi2/BlazeSeq/tree/b96f7b13d5b175563995eb7a6ad12e2c87cb7bcb), commit b96f7b13d5b175563995eb7a6ad12e2c87cb7bcb: all 63 selected files scan. Expected FastqParser implementation, Reader requirements, FileReader/GZFile byte input and record/batch representations to retain their source owners; compile-time ParserConfig must not become runtime work. Observed Reader at readers.mojo:38 with two outlined requirements and no executable operations, FileReader at line73 with three direct members, GZFile at line275 with five, and parser/library files outside the example entry container. Original ParserConfig witnesses in examples/example_parser.mojo:75 and115 emit no runtime calls after the final fix. A real Groma consumer refreshed all63 files using the final package and retained the exact-file owner.
- [Modular / Mojo](https://github.com/modular/modular/tree/9211931f64da60717dc77886ad99496f52720517), commit 9211931f64da60717dc77886ad99496f52720517: all 297 selected files in the sparse Mojo standard-library/examples checkout scan; this is not the whole mixed-language monorepo. Expected List/Dict lifecycle and iteration responsibilities to preserve declarations, overloads and direct members without invented executable/library containment. Observed List at Mojo/stdlib/std/collections/list.mojo:157 with66 direct members; iterator structs retain their own members. Standard-library files remain outside example/benchmark entries. The final atomic/atomic.mojo:206-207 witness no longer reports __mlir_attr or _get_kgen_string from compile-time MLIR parameters.
- [Lightbug HTTP](https://github.com/Lightbug-HQ/lightbug_http/tree/04d303e6515ee6f35ca36643b8e1a879f54738cb), commit 04d303e6515ee6f35ca36643b8e1a879f54738cb: 43 files selected as an intentional archived-language control. Its source describes Server, HTTPService and handler collaboration, but old fn syntax is outside the declared boundary. Observed a concrete syntax failure, with no supposedly complete partial server map. This is an expected limit, not a passing modern-source scan.

The three modern projects total445 selected files. Their Groma init, local package selection, scan/repeat scan, source-owner lookup and actual viewer Code outline flows passed. All378 files accepted by the previous grammar retained identical outlines and named operations after replacement. Reversed selected-input order gave the same observations. Physical operation/invocation locations and direct-member ownership were checked, including non-ASCII official source. Input-source hashes stayed unchanged; fetch was blocked and PATH contained Git only. No Mojo/Python/Pixi/compiler, project dependency installation, build or public project code execution was used.

Final independent semantic checks: single- and multiple-value generic repros emit print/consume only; named MLIR parameters emit pop.fence only; the mixed boundary repro emits consume, argument, consume, argument, make_items. This proves ordinary runtime argument and base calls survive while compile-time/index bracket contents do not. The tester reports no remaining authority-backed blocker. Detailed local evidence is in /tmp/groma-mojo-adversarial/reports/report.md and reports-final/; the repository URLs, revisions and outcomes above preserve the result when temporary artifacts are removed.

Limits: evidence supports source inventory, Code outlines and conservative execution entry placement, not complete C4 architecture. Every call target remains unresolved, so the scanner does not create collaboration arrows from names or imports. Entry membership is own-file only. Computed runtime-index calls are omitted with compile-time bracket calls because syntax cannot distinguish them. Declaration headers/decorators, lambdas/generators and explicit compile-time statements remain excluded from enclosing runtime calls. Legacy fn is unsupported; syntax recovery fails rather than silently dropping evidence. The package uses portable WASM; native Windows and Linux execution was not independently exercised in this local qualification.

Final targeted implementer specification/quality review: rechecked the original parser and caller-ownership findings and their regressions against AC1-6 and DoD. The flow remains index.ts (selected file reads) -> parser.ts (bundled grammar, strict errors, tree lifetime) -> source.ts (declarations, scopes and uncertain call evidence), with core owning OKF Markdown and C4 meaning. Both bracket node forms have explicit boundaries beside the invocation walk; runtime arguments remain traversed. The regression failed before the fix with the exact four false calls and passes after it, while preserving runtime arguments/base calls. No new framework, recovery, guessed target or model concept was added. All source/test files remain below500 lines, and changed functions pass the complexity lint. Parent confirms cold simplicity, targeted rereview and final full-context complexity review passed. Final required full repository check is running; the task stays In Progress for combined integration, with no commit, PR or publication.

Integration preparation: added plugins/scanners/mojo/.gitignore for /dist/ so local build outputs cannot be mistaken for source assets, and clarified that the existing build command populates those assets before workspace use. The pinned grammar asset remains under grammar/; no parser behavior changed. No additional test was needed for this ignore/documentation correction.

Final bun run check after the parameter_list fix passed: 790 Bun tests passed, 55 skipped, 0 failed, 3007 assertions across149 files; lint, typecheck and Node tests passed. Log: /tmp/groma-mojo-check-final-qualified.log. The later ignore/documentation correction changes no runtime behavior; git check-ignore confirms both generated dist assets are excluded, and git diff --check passes. Finalization guidance was read. AC1-6 and DoD1-5 now have the evidence recorded above and are checked. Task deliberately remains In Progress pending combined integration, as requested; no commit, PR or publication.

Parent integration review: combined all six scanner implementations in codex/scanner-batch. Package-owned code matches the reviewed language branches byte for byte; shared changes only combine catalog registrations, existing release builders, Dart native build setup, documentation and existing package-test fixtures. The flow remains selected source files -> bundled language parser -> shared outlines/evidence -> existing Groma core. Core still owns C4 boundaries and portable OKF Markdown. No new architecture metadata or shared parser framework was added. Full combined bun run check passed lint, typecheck, 16 Node tests and 822 Bun tests (60 skipped, zero failures; /tmp/groma-batch-check.log). All six fresh-package no-language-tools checks passed together (42 assertions), and native release assembly checks passed (98 assertions). Final documentation-only updates do not change runtime artifacts. Parent specification and quality reviews pass for the documented experimental scope; per-language qualification limits remain in the task and scanner docs. No live groma files changed, and no commit, PR, merge or publication was made.

Additional independent qualification on PR117/current-main plugin flow: BlazeSeq b96f7b13d5b175563995eb7a6ad12e2c87cb7bcb full63 and new EmberJson e7feca8ebbdf2a338f586fed737bf8d01e6cad05 full46 pass plugin add/config.json, CLI scan/owner and viewer outline flows. EmberJson source witnesses cover Value, Document, Parser, serializer, nested explicit-capture caller ownership and omission of compile-time specialization expressions. Across successful inputs1499 operations7297 invocation positions match physical UTF-16 source, repeated evidence is identical, and hashes remain unchanged with no language tools and fetch disabled. New Floki087dd7ee193ebd990df7444abd96f1bf292fa9d3 full31 is explicitly not qualified: two unescaped def as declarations conflict with current documented reserved-keyword rules; escaped controls pass and its green release workflow supplies no compiler evidence. No parser relaxation is justified by present evidence. Pinned source links and detailed expected-versus-observed report: /tmp/groma-mojo-confidence-2/reports/report.md. Current Mojo runtime/WASM unchanged.

Integration verification on 2026-10-15: bun run check passed lint/typecheck, 16 Node tests and 865 Bun tests (62 opt-in skips, zero failures, 3,483 assertions), recorded in /tmp/groma-confidence-pre-cpp-check-20261015.log. This run contains final C, Ada, Dart, MQL5, Mojo and TASK-601 code. C++ confidence corrections are still in progress and are not certified by this run. No live groma changes, commit, push, merge or publication.

The user approved committing and opening task-sized PRs, with Windows/Linux/macOS CI green before release. The CI matrix now builds this scanner package and runs the existing fresh-checkout test with language tools removed from PATH and network access rejected. This reuses the verified package-flow coverage; no new behavior or test abstraction is added. Dart tests reuse the package already built by the job. Cross-platform results will be recorded after CI completes.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added an experimental modern Mojo scanner with a bundled parser, deterministic selected-source inventory, physical Code outlines, named operations, unresolved calls and own-file main entries. Named nested bodies own their calls; declaration headers, decorators, defaults and compile-time brackets do not leak into runtime evidence. Strict syntax failures remain visible. Core owns existing C4 boundaries and OKF Markdown.

Independent trials cover NuMojo, official Mojo, BlazeSeq, EmberJson and Floki. The supported modern selections pass; archived Lightbug legacy fn syntax and two confirmed invalid unescaped reserved identifiers in Floki remain explicit whole-selection failures rather than hidden exclusions. Original selections and failed evidence are preserved. Parser and caller defects were fixed, with focused regressions, upstream corpus, no-tools fresh consumption, repeatability, unchanged source and completed review gates.

Integrated on codex/scanner-confidence above the plugin changes. The current combined check passes 16 Node and 865 Bun tests, with 62 opt-in skips and no failures. Prepared locally; neither publication nor Windows/Linux execution is claimed.
<!-- SECTION:FINAL_SUMMARY:END -->
