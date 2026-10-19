---
id: TASK-595
title: Add an experimental Ada scanner
status: Done
assignee:
  - '@scanner-ada'
created_date: '2026-10-14 19:38'
updated_date: '2026-10-15 19:29'
labels: []
dependencies: []
references:
  - 'https://github.com/MrLesk/groma.md/issues/133'
  - plugins/scanners/ada/src/index.ts
  - src/scanner/modules/official-catalog.ts
documentation:
  - docs/scanners/creating-a-plugin.md
  - docs/scanners/evidence.md
modified_files:
  - plugins/scanners/ada/package.json
  - bun.lock
  - plugins/scanners/ada/assets/tree-sitter-ada.wasm
  - plugins/scanners/ada/src/syntax.ts
  - plugins/scanners/ada/src/declarations.ts
  - plugins/scanners/ada/src/evidence.ts
  - plugins/scanners/ada/src/index.ts
  - plugins/scanners/ada/build.ts
  - plugins/scanners/ada/THIRD-PARTY-NOTICES.txt
  - docs/scanners/ada/index.md
  - test/fixtures/ada-source/interface.ads.fixture
  - test/fixtures/ada-source/implementation.adb.fixture
  - test/fixtures/ada-source/main.adb.fixture
  - test-bun/scanner-ada.test.ts
  - src/scanner/modules/official-catalog.ts
  - scripts/scanner-release.ts
  - test-bun/scanner-fresh-checkout.test.ts
  - README.md
  - docs/scanners/index.md
  - docs/scanners/creating-a-plugin.md
  - plugins/scanners/ada/assets/gnat-fixed-lower-bound.patch
  - .github/workflows/ci.yml
type: feature
ordinal: 673000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
GitHub issue #133 requests Ada support so a developer can inspect that source in Groma without installing its project dependencies or development toolchain. The user requested an implementation agent for each scanner, a cold simplicity review, then independent adversarial validation on 3-5 public repositories. Existing scanner contracts own evidence; core owns C4 boundaries and OKF output. Publication and merging are separate from preparing and qualifying these scanners.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A packaged Ada scanner reads only Groma-selected inputs and works without separately installed language tools, project dependency installation, build execution, or scan-time downloads.
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
1. Bundle pinned tree-sitter-ada a45fd9c65a791cbe7d146e85a53fbe43a6d52a61, the documented GNAT fixed-lower-bound array rule, and web-tree-sitter 0.27.1. Read only selected .ads/.adb inputs; consumers need no Ada tools, project dependencies, build execution or downloads.
2. Keep parsing, declaration/visibility lookup and operation ownership in scanner-owned modules. Use all selected package specifications, including nested packages and generic subprogram declarations, to establish outline visibility. Associate source units only for a unique library package specification/body pair by declared identity. Core owns C4 boundaries and ordinary OKF Markdown.
3. Preserve physical names, lines and UTF-16 offsets, unresolved procedure calls and caller boundaries. Omit function-expression targets, main-program inference and separate-subunit outlines. Report unsupported syntax explicitly. Root-anchored cache/output exclusions must not hide nested source packages with the same directory names.
4. Verify scanner contracts through minimal semantic fixtures. Existing coverage lacked the reproduced failures: nested package Work missing from its body outline; valid src/alire and src/obj files excluded; GNAT array bounds rejected; generic Run omitted or marked private while formal Step leaked. The corresponding focused regressions must detect those wrong results while preserving physical positions and unchanged input. Existing tests cover selected-input isolation, ambiguous package pairing and nested caller ownership.
5. Qualify the packaged scanner through actual plugin installation, selected-source scans, core ownership and Code outlines on the pinned independent projects. Keep whole-project failures involving invalid Ada separate from successful declared selections. Run upstream corpus, focused and isolated no-tools/network checks, preserve review evidence, and finish with the parent combined repository check. Document macOS execution evidence and unverified Windows/Linux execution separately.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented a small portable Ada parser using MIT tree-sitter-ada a45fd9c65a791cbe7d146e85a53fbe43a6d52a61 (327 KiB WASM, SHA-256 32e087f94e68bda3470950f1f8ccfd1c062f28c7b7d6be6d90123b1de5d52705) and web-tree-sitter 0.27.1. Libadalang was evaluated against its official build guide: GNAT, GNATcoll, Langkit and AdaSAT are unnecessary for the initial bounded syntax scope. Package specification/body claims use declared unit identity, never filenames. Calls remain unresolved and expression ambiguity is omitted. Private parts map to internal per Ada RM 7.1; unmatched body visibility remains unknown and is omitted from outlines.
Focused checks currently pass: 4 tests / 17 assertions; standalone package no-tools/no-network fresh-checkout test passes 7 assertions. The first packaged test exposed relative WASM loading from the consumer cwd; fixed it by resolving asset URLs relative to the bundled module. Local scanner add and scan succeeded in /tmp/groma-ada-consumer; interface.ads and implementation.adb share the same component owner. Packed archive is about 171 KiB, unpacked 0.71 MB. Full check and static-export smoke are in progress. No npm publication, PR or merge performed.

Cold simplicity review passed with no material blocker. Applied both small recommendations: removed the completion flag duplicated by absent visibility, and made outline requests parse declarations without extracting unused operation evidence. Focused checks after simplification: Ada 4/4 tests, 17 assertions; package fresh-checkout 1/1, 7 assertions; repository typecheck and focused Biome lint pass with no new complexity warnings.
Implementer specification review: current implementation supplies source-only portable installation, selected inventory and outlines, explicit package associations, bounded unresolved procedure-call evidence, catalog/release integration and experimental limits. Packaged installation/scan/export succeeded and source bytes remained unchanged. Independent 3-5 repository validation and final complexity gate are still pending, so the task stays In Progress.
Implementer quality review: traced index.ts selected paths through syntax.ts parser lifetime into declarations.ts and evidence.ts, then the standard observation/core ownership and exported Code outlines. Responsibilities are explicit and files remain small. Tests detect ignored-file reads, false spec/body pairing, nested-call attribution, incorrect visibility/entry matching, UTF-16 position errors, ambiguous build-variant selection and suppressed syntax/preprocessor failure. No unsupported targets or C4 boundaries are invented. No authority-backed defect remains in this supported fixture flow. Full repository suite is still running; no failure reported so far.

Final complexity review reproduced a missing nested package-body outline. Added the minimal Outer.Inner.Work regression and confirmed it failed before the fix (no outline returned). Parsed package declarations now retain their library flag: visibility can consult every selected package specification, while sourceUnits still filters to library packages. Regression now passes; 5 focused tests /18 assertions and standalone package test /7 assertions pass. Targeted specification/quality review confirms Work inherits public visibility without broadening associations or call targets.
Also fixed the concrete Windows asset path issue identified by the MQL5 scanner work: absolute host paths go directly to readFile, and only bundled relative paths use a URL relative to this module. Existing source and packaged tests exercise both path forms on each host. Local typecheck and focused lint pass after both fixes. First full check passed Node 16/16 and Bun793pass55skip0fail (2991 assertions). The first post-review rerun lacked permission to create fixture locks outside writable roots; the same full check is now running with worktree write permission.

Final full check after the nested-package and Windows-path fixes passes: Node 16/16; Bun 794 pass, 55 skip, 0 fail, 2992 assertions across 149 files (183 seconds). Typecheck and lint pass; no new Ada complexity warning. Final runnable package is /tmp/groma-ada-package/ada and refreshed archive /tmp/groma-ada-scanner-0.1.0.tgz (171.40 KB compressed). No live groma/ files changed. Implementation is paused at the parent-coordinated targeted final complexity re-review and independent 3-5 repository validation gate; no acceptance checkbox or terminal task status was set.

Independent Alire test exposed the unanchored alire/ default hiding 312 legitimate sources under src/alire/. Reviewed obj/: the same unanchored directory-name match can hide a source package. Defaults now use /alire/ and /obj/, leaving nested source namespaces selected. The new scannerFiles regression used real Git listing and manifest selection, failed before the fix (both nested sources absent), and passes afterward while root cache/output files remain excluded. Focused Ada6/6,20assertions; rebuilt package no-tools/no-network test passes7assertions. Targeted spec/quality review confirms only default file selection changed; parser limits and consumer-selected template handling are unchanged. Parent and independent tester notified to use the rebuilt package/fresh defaults. Full repository check is running.

Full repository check after the default-exclusion fix passes: Node 16/16; Bun795 pass,55skip,0fail,2994assertions (104 seconds). No new lint/type errors and git diff --check passes. Updated package and archive are ready for independent Alire revalidation; task remains open.

Independent repository qualification completed on 2026-10-14 after the cache-selection fix. The tester chose all projects independently and recorded source-backed expectations before scanning.

| Repository | Pinned revision | Analyzed files | Library spec/body pairs | Components |
| --- | --- | ---: | ---: | ---: |
| [Alire](https://github.com/alire-project/alire) | 338896abcdeb948835553fec79b473599931e90f | 447 | 176 | 271 |
| [Ada Web Server](https://github.com/AdaCore/aws) | 8c2cbbce0f78f05786bb1b5891f098615daade51 | 1230 | 287 | 943 |
| [GNATcoll Core](https://github.com/AdaCore/gnatcoll-core) | 77e30af6d8266424df2b408d028b517211ca6c1f | 260 | 81 | 179 |

Expected versus observed ownership:
- Alire: src/alr/alr-commands-show.ads/.adb share alr-commands-show, while src/alire/alire-cache.ads/.adb share the separate alire-cache owner. After the fixed root-only exclusions all 312 legitimate src/alire sources return to selection. Command Execute/Long_Description/Setup_Switches are public, private-part Validate is internal, and body helpers Find_Target_Release/Report are private. alr.gpr names a main, but the scanner correctly makes no build-entry claim.
- AWS: aws-server, aws-dispatchers and aws-net keep separate owners, each with its specification/body pair. In src/core/aws-server.adb, nested Accept_Error owns AWS.Log.Write at line 109 and Force_Clean at line 114; Set_CLOSEXEC owns Net.Set_Close_On_Exec at line 125; enclosing Accept_Socket_Serialized owns HTTP_Acceptors.Get at line 133. Nested helpers do not appear as top-level Code declarations.
- GNATcoll: GNATCOLL.JSON, GNATCOLL.VFS and GNATCOLL.Traces each retain one owner for their specification/body pair. Sampled public overloads and VFS operator spellings remain correct. Nested Parse_Number in core/src/gnatcoll-json.adb owns Set_Window_Offset calls at lines 246 and 249 and is omitted from the top-level outline. Library-project names do not become executable containers.

Across 1,937 successful files the scanner returned 9,554 operations and 19,264 unresolved procedure-call facts, with no invented providers. Every reported call line agreed with its UTF-16 offset. 762 declarations sampled through the actual viewer outline had their name on the reported physical line; representative visibility was checked semantically, not every declaration manually. Repeat observations/loaded architecture were equal and selected source hashes stayed unchanged. Registry scans and outlines also passed with only Git/Bun on PATH and fetch disabled, without GNAT, Alire, GPRbuild, application dependencies, project execution or network use. A supplemental renamed AWS package with an emoji prefix preserved declaration-based association, visibility and exact UTF-16 shifts; an unselected invalid neighboring file was not read.

Caveats: Alire defaults select 449 files; templates/crate_lib/src/name.ads and templates/crate_bin/src/name.adb contain intentional placeholders and produce explicit physical syntax errors. Only those two exact paths were excluded for the successful 447-file comparison; no parser workaround or silent omission was added. All three maps have zero inferred containers and zero derived relationships because execution-entry and provider resolution are unsupported, so these are source/package maps requiring architecture curation. Separate subunits remain separate owners and have no Code outline, although operation evidence exists; AWS src/core/aws-server-protocol_handler.adb and GNATcoll OS subunits demonstrate this now-explicit documentation limit. Build/platform variants remain selected unless configured otherwise, and ambiguous duplicate package declarations do not establish associations. Independent execution occurred on macOS; Windows/Linux portability was not independently run in this exercise.

The audit used fresh clones at the above revisions, initializeGroma/addScanner, scannerFiles/loadScannerRegistry/scanRepository, core loadAnnotatedArchitecture, viewer readCodeStructure, and CLI source-owner lookups. Full report and reproduction scripts: /tmp/groma-ada-adversarial/report.md, expectations.md, setup-fixed.ts, probe.ts, offline.ts, utf16-selection.ts, subunit.ts; final Alire reports use alire-fixed-* prefixes. The essential durable revisions, expectations, results and caveats are preserved in this task even if temporary artifacts are removed.

Qualification evidence for AC 1-6 and DoD 1-5: 6 focused tests with 20 assertions; standalone package test with 7 assertions; real installation/scan/static export; complete check Node 16/16 and Bun: 795 passed, 55 skipped, 0 failed, 2994 assertions; cold simplicity and implementer reviews passed; final complexity targeted re-review passed after the nested-package fix; independent three-project qualification found no remaining supported-flow blocker after the selection fix. This final change adds only the separate-subunit outline limitation and task evidence, so no full-suite repeat is required. Parent integration/delivery remains pending; no commit, PR, merge or publication occurred.

Parent integration review: combined all six scanner implementations in codex/scanner-batch. Package-owned code matches the reviewed language branches byte for byte; shared changes only combine catalog registrations, existing release builders, Dart native build setup, documentation and existing package-test fixtures. The flow remains selected source files -> bundled language parser -> shared outlines/evidence -> existing Groma core. Core still owns C4 boundaries and portable OKF Markdown. No new architecture metadata or shared parser framework was added. Full combined bun run check passed lint, typecheck, 16 Node tests and 822 Bun tests (60 skipped, zero failures; /tmp/groma-batch-check.log). All six fresh-package no-language-tools checks passed together (42 assertions), and native release assembly checks passed (98 assertions). Final documentation-only updates do not change runtime artifacts. Parent specification and quality reviews pass for the documented experimental scope; per-language qualification limits remain in the task and scanner docs. No live groma files changed, and no commit, PR, merge or publication was made.

Additional independent project qualification exposed a valid-language support defect. Reopened under the user request to fix until confident; previous passing results remain evidence but do not close the new supported-flow failure. Implementer owns the focused language fix; parent integrates on PR117 and current main.

Requalification integration from the isolated implementation task:

Readiness reopened by the user for more full-project testing. The previous three-project evidence remains valid, but the newly reproduced GNAT extension failure must be fixed before renewed readiness. Official syntax authority: https://gcc.gnu.org/onlinedocs/gnat_rm/Fixed-lower-bounds-for-array-types-and-subtypes.html. Scope is Ada-owned grammar/assets/tests/docs; shared integration is now owned by the parent on the current main integration checkout.

The fixed-lower-bound regression fails before the grammar change at radio.ads:4:31. This confirms the test detects the supported Drivers Library syntax failure rather than merely comparing an unchanged fixture.

Reopened fixes: GNAT fixed lower bounds add one optional expression before the box in index_subtype_definition; the checked-in patch is applied to the pinned upstream source before ABI 14 generation. Runtime continues to parse original source directly. Patched WASM: 330829 bytes, SHA-256 d0f65a56fe8679b59b0c8ea21804d09544fdd550491ccf43fdbbf300412fad4d. The scanner reports engine revision +groma.1. Generic subprogram declarations now use the existing subprogram path directly; their formal parameter subtree stays omitted. Both new regressions failed before their fixes: GNAT syntax error and missing public Run with private body. Focused Ada tests now pass 8/8 with 24 assertions; standalone no-tools/no-network package passes 7 assertions; typecheck and focused Biome lint pass. Package is /tmp/groma-ada-requalified/ada. Cold simplicity and renewed qualification are pending.

Cold simplicity review of reopened plan items 7-8 passed with no blocker or simplification. Own specification review: the actual Drivers declaration parses from the standalone package and TX_RX_Data is public at physical line 298; the generic Run declaration and body both retain public visibility while formal Step is omitted. Original text goes directly to Tree-sitter, offsets use unchanged UTF-16 input, no source mutation or exclusions were added, and C4/OKF ownership remains in core. Own quality review traced selected input through syntax.ts, the existing declaration classification/profile matching and output. The grammar patch changes only array index syntax; upstream grammar corpus passes 130/130. Generic handling adds one existing-node classification and removes its obsolete traversal entry, with no new layer. Both regression tests failed for the claimed defects before their fixes and pass afterward; inventory symbol position assertions do not depend on core normalization order, while outline assertions verify physical source order and name lines. All changed source/test files remain below 500 lines and focused lint/type checks pass. Parent final complexity and independent full-project retest remain pending. Full repository check is still running.

Full repository check after both reopened fixes passes: Node 16/16; Bun 797 passed, 55 skipped, 0 failed, 2998 assertions across 149 files (94.21 seconds). git diff --check passes and no live groma/ files changed. Source remains frozen for independent Drivers Library/HAC/GNATcoll rerun and parent final complexity review.

Renewed independent qualification completed after the two fixes, using core 80db40cf2985c997f2b20743981f2ca83019a63e and PR117's groma plugin add / groma/config.json flow. Exact final runtime bundle SHA-256: a6e961a23d5a0d5b2cbf52c1d2492d651c0a4b7463e766b9a89366cf745aa3e7. Grammar revision a45fd9c65a791cbe7d146e85a53fbe43a6d52a61+groma.1 and WASM SHA-256 d0f65a56fe8679b59b0c8ea21804d09544fdd550491ccf43fdbbf300412fad4d.

| Repository | Pinned revision | Qualified selection | Library spec/body units | Components |
| --- | --- | --- | ---: | ---: |
| [Ada Drivers Library](https://github.com/AdaCore/Ada_Drivers_Library) | d331ed4f6d6a5edca2e9bcfd01f13d608d9d1537 | All 1,014 default-selected Ada files, unchanged | 209 | 805 |
| [HAC Ada Compiler](https://github.com/zertovitch/hac) | 8710a2c2608fed51e409f954838b82e0b6107e0c | All 99 implementation .ads/.adb files under src/, selection declared before scanning | 43 | 56 |
| [GNATcoll Core](https://github.com/AdaCore/gnatcoll-core) | 77e30af6d8266424df2b408d028b517211ca6c1f | All 260 default-selected Ada files | 81 | 179 |

The full Drivers Library selection now succeeds without excluding or rewriting the fixed-lower-bound declaration. The actual new-core viewer lists TX_RX_Data as public at line 298; its specification and body share nrf24l01p. HAL.I2C remains the bus abstraction. BBQ10KBD owns its specification/body separately; Set_Backlight is public, Read/Write are internal and own This.Port.Mem_Read:47 / This.Port.Mem_Write:67. Filesystem.FAT keeps its own pair and inspected public/internal declarations. All 18 STM32.Board build-variant files remain ambiguous rather than being guessed into a unique pair.
HAC keeps separate builder/compiler/parser/interpreter owners. Compile_Unit owns Parser.Modularity.Context_Clause:427 and Parser.Block:510; nested Check_No_Extra_Symbol owns Scanner.In_Symbol:378 and Error:379. Build_Main_Inner owns Compiler.Init_for_new_Build:248 and Compiler.Compile_Unit:257, rather than the enclosing Build_Main. Generic Show_Trace_Back is public at specification line 37/body line 931; Interpret is public at specification line 141/body line 20. Get, Put, Feedback and End_Of_File generic formals remain absent from the outline. GNATcoll JSON/VFS/Traces ownership remains correct and Gen_Map_JSON_Object now appears public in specification/body.
Across the three successful selections: 1,373 files, 6,575 operations, 11,230 unresolved procedure calls, all operation/invocation physical positions validated, and 791 sampled viewer declaration name lines checked. Repeat observations/worlds matched; every selected source hash stayed unchanged. Registry scans and sampled outlines matched with only Git/Bun on PATH and fetch disabled. Real CLI source lookups resolve radio, interpreter and JSON ownership. Together with the prior Alire and AWS qualification this covers five distinct independently chosen public projects.

Scope caveat: HAC's full 396-file default selection still explicitly fails on exm/not_working/din_sm.adb, din_ws.adb, dinersmo.adb and newrace.adb. This is not claimed as a successful full-default scan, and no claim is made that every failed example is invalid standard Ada. Its successful 99-file implementation selection was recorded before scanner results, not made by dropping failures. This distinction is now in scanner docs. All successful maps retain zero inferred executable containers/derived relationships; semantic provider resolution, build-entry inference and separate-subunit outlines remain unsupported. Qualification ran on macOS; Windows/Linux execution was not part of this review.

Exact passed gates: both new regressions failed before their fixes, then Ada focused tests 8/8 with 24 assertions; standalone no-tools/no-network package 1/1 with 7 assertions; upstream grammar corpus 130/130; complete check Node 16/16 and Bun 797 passed, 55 skipped, 0 failed, 2998 assertions; cold simplicity review, own specification/quality review and final full-context complexity review all passed without remaining findings; independent full intended-project rerun passed. Report/reproduction artifacts: /tmp/groma-ada-confidence/report.md, expectations.md, findings.md, reports/*-fixed-*, reports/tested-package-sha256.json. Durable revisions and source-backed expectations are recorded here.
Only docs and task evidence changed after the tested runtime froze. Docs now use groma plugin add and preserve the parent's current config.json integration. Prepared package: /tmp/groma-ada-requalified/ada; frozen archive /tmp/groma-ada-scanner-requalified-0.1.0.tgz, 171.65 KB, SHA-256 731bbb19739c0bc5017382f807ef8562dc176a31d145c012c0a5a3005481768c. Runtime bundle/WASM hashes remain identical to independent qualification. No additional full suite needed for this documentation-only final step. Task stays In Progress for parent integration; no commit, PR, merge or publication.

Independent final classification closes the four HAC whole-default failures without relaxing the parser: din_sm.adb51, din_ws.adb69 and dinersmo.adb195 use colon-format actual arguments such as PUT(x:2), which Ada RM6.4 does not admit; newrace.adb104-105 has an empty statement sequence, contrary to RM6.3/11.2/5.1. Packaged-parser controls reject these forms and accept comma-separated arguments / null statements. Pinned input bytes remain unchanged. Full intended compiler implementation qualifies; default invalid examples remain explicit errors. No additional scanner fix is justified by these failures.

Updated Ada documentation to distinguish the four independently confirmed invalid HAC examples from a parser support gap. No runtime or source selection change. Classification and negative/positive controls: /tmp/groma-ada-confidence/hac-classification.md.

Integration verification on 2026-10-15: bun run check passed lint/typecheck, 16 Node tests and 865 Bun tests (62 opt-in skips, zero failures, 3,483 assertions), recorded in /tmp/groma-confidence-pre-cpp-check-20261015.log. This run contains final C, Ada, Dart, MQL5, Mojo and TASK-601 code. C++ confidence corrections are still in progress and are not certified by this run. No live groma changes, commit, push, merge or publication.

The user approved committing and opening task-sized PRs, with Windows/Linux/macOS CI green before release. The CI matrix now builds this scanner package and runs the existing fresh-checkout test with language tools removed from PATH and network access rejected. This reuses the verified package-flow coverage; no new behavior or test abstraction is added. Dart tests reuse the package already built by the job. Cross-platform results will be recorded after CI completes.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added an experimental Ada scanner with a bundled parser, selected-source package specification/body context, physical Code outlines, named operations and unresolved procedure calls. Unique declared package identity supports source-unit association; no build, dependency resolution, language tools or scan-time network is needed. Core retains architecture boundaries and ordinary OKF Markdown.

Fixed the independently reproduced nested-package visibility, nested cache-like source paths, GNAT fixed-lower-bound arrays and generic subprogram outline defects. Drivers Library, HAC src and GNATcoll qualification covers 1,373 selected files, 6,575 operations and 11,230 calls with actual plugin/core/Code flows and unchanged sources. HAC's whole-tree failure on four confirmed invalid Ada examples remains documented separately. All review gates, 130 upstream grammar cases, focused assertions and the fresh package passed.

The integrated package passes the combined check: 16 Node tests, 865 Bun tests, 62 opt-in skips and no failures. Prepared locally on codex/scanner-confidence above the plugin changes. Windows/Linux execution and publication remain outside this local qualification.
<!-- SECTION:FINAL_SUMMARY:END -->
