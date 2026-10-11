---
id: TASK-578
title: Add an experimental Kotlin scanner
status: Done
assignee:
  - '@codex'
created_date: '2026-10-09 15:00'
updated_date: '2026-10-11 09:25'
labels: []
dependencies: []
references:
  - modules-discovery
  - kotlin-src-index
  - plugins/scanners/kotlin/worker/md/groma/scanner/Visibility.kt
documentation:
  - docs/scanners/creating-a-plugin.md
  - docs/scanners/evidence.md
  - docs/scanners/scala/index.md
modified_files:
  - backlog/tasks/task-576 - Add-an-experimental-Kotlin-scanner.md
  - plugins/scanners/kotlin/worker/md/groma/scanner/Parse.kt
  - plugins/scanners/kotlin/worker/md/groma/scanner/Declarations.kt
  - plugins/scanners/kotlin/worker/md/groma/scanner/Symbols.kt
  - plugins/scanners/kotlin/worker/md/groma/scanner/Operations.kt
  - plugins/scanners/kotlin/worker/md/groma/scanner/Calls.kt
  - plugins/scanners/kotlin/worker/md/groma/scanner/Outline.kt
  - plugins/scanners/kotlin/worker/md/groma/scanner/Json.kt
  - plugins/scanners/kotlin/worker/md/groma/scanner/Scan.kt
  - plugins/scanners/kotlin/worker/md/groma/scanner/Main.kt
  - plugins/scanners/kotlin/package.json
  - plugins/scanners/kotlin/.gitignore
  - plugins/scanners/kotlin/src/index.ts
  - plugins/scanners/kotlin/src/adapter.ts
  - plugins/scanners/kotlin/THIRD-PARTY-NOTICES.txt
  - plugins/scanners/kotlin/build.ts
  - test/fixtures/kotlin-source/src/main/kotlin/shop/Orders.kt
  - test/fixtures/kotlin-source/src/test/kotlin/shop/Broken.kt
  - bun.lock
  - test-bun/kotlin-scanner.test.ts
  - src/scanner/modules/official-catalog.ts
  - scripts/scanner-release.ts
  - test-bun/scanner-release.test.ts
  - test-bun/scanner-fresh-checkout.test.ts
  - docs/scanners/kotlin/index.md
  - docs/scanners/index.md
  - docs/scanners/discovery.md
  - README.md
  - docs/scanners/creating-a-plugin.md
  - groma/systems/groma-md/containers/cli/components/kotlin-src-index.md
  - plugins/scanners/jvm-worker.ts
  - plugins/scanners/scala/src/adapter.ts
  - plugins/scanners/jvm-package.ts
  - plugins/scanners/scala/build.ts
  - plugins/scanners/java/build.ts
  - groma/scanners.json
  - groma/systems/groma-md/containers/cli/components/scala-src-index.md
  - backlog/tasks/task-578 - Add-an-experimental-Kotlin-scanner.md
  - test/fixtures/kotlin-source/scopes/Calls.kt
  - test/fixtures/kotlin-source/scopes/Visibility.kt
  - plugins/scanners/kotlin/worker/md/groma/scanner/Visibility.kt
  - test/fixtures/kotlin-source/scopes/Base.kt
  - docs/scanners/kotlin/validation.md
type: feature
ordinal: 653000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Groma has official scanners for Java and Scala but none for Kotlin, so a Kotlin repository scans to an empty map and its files are reported as read by no enabled scanner. An external contributor requested a Kotlin scanner with the same evidence surface as the experimental Scala scanner: source inventory, declarations, the Code outline, and bounded call evidence. The contributor chose the Kotlin compiler PSI (kotlin-compiler-embeddable) in a bundled JVM worker, following the Scala and Java scanner delivery, and a small authored fixture under test/fixtures as the approved example. HTTP endpoint and request extraction, Gradle or Maven module discovery, Kotlin scripts (.kts) and Kotlin Multiplatform source-set semantics are out of scope for this task.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The installed Kotlin scanner inventories the selected `.kt` files and reports their top-level declarations as symbols, without a project build, dependency installation, scan-time download, or a separately installed JDK, Kotlin compiler, Gradle or Maven.
- [x] #2 Functions, methods, secondary constructors and extension functions are reported as operations with original UTF-16 positions; call expressions inside them are reported with call-site positions and stay unresolved because syntax alone does not prove a target.
- [x] #3 The source outline lists top-level types, objects and functions with their members and Kotlin visibility (public by default, protected, internal, private) as the source-outline contract defines, and marks entries named by Code links.
- [x] #4 A parse or read failure of a selected file rejects the whole observation and names that file; no partial observation is returned.
- [x] #5 Discovery, the official catalog, scanner release assembly, source listing and scanner documentation agree on the supported Kotlin scope and use the existing scanner delivery flow.
- [x] #6 The isolated-package scanner test, the shared fresh-checkout and release tests, and `bun run check` pass.
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
1. Keep the source-only packaged scanner: selected .kt files enter the bundled Kotlin parser; Groma core owns architecture boundaries. No project builds, dependencies, installed language tools or new OKF/C4 concepts are introduced.
2. Keep call ownership inside the current executable body. Skip deferred nested functions, lambdas, local classes, object methods and property accessors; retain root function values, parameter defaults and immediate anonymous-object initialization.
3. Resolve outline visibility from explicit modifiers and selected source. Constructors default to protected in sealed classes and private in enums. Follow base types through supplied context, qualified/same-package names and explicit imports. Omit only unmodified override members whose inherited access cannot be proved. Keep their scan evidence; do not extend the shared visibility contract.
4. Extend the existing isolated-package test and authored scopes fixture. Authority: reproduced failures against the invocation ownership and source-outline contracts. Detect falsely attributed deferred calls, wrongly public constructors/overrides, and lost immediate initialization. Existing coverage had no deferred body or inherited-visibility cases. Check intermediate/cross-file bases and unresolved/ambiguous overrides, including retained evidence and requested-files-only outline output. Regression probes must fail before the relevant fix.
5. Qualify five pinned open-source Kotlin checkouts with normal selection and the relocated package, empty HOME and no language tools on PATH. Verify exact inventory, repeat scans, source positions, outlines and unchanged checkout state without running project builds.
6. Document the final behavior, limits and qualification evidence. Run focused Kotlin/Scala/release/fresh-checkout checks and bun run check. Apply the cold simplicity review, perform own specification/quality review, then complete the full-context complexity review. Push fixes to PR #124 and verify CI.

Full-context review regression for AC 3: Root has public choose(String), intermediate Base has protected choose(Int), and Leaf overrides choose(String). The current same-arity match stops at Base and incorrectly reports protected. Existing ambiguity coverage has overloads only in one base. Add this case to the same fixture/assertion group; collect inherited candidates too, omitting access when plausible declarations disagree. No compiler/classpath overload resolution is introduced.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Feasibility spike outside the repository (JDK 21, kotlin-compiler-embeddable 2.4.21): a Kotlin worker compiled by the embeddable compiler itself parses source through KotlinCoreEnvironment + KtPsiFactory in about 0.3 s, reports syntax errors as PsiErrorElement, and needs opt-ins CoreEnvironmentDeprecation, CompilerConfiguration.Internals and ExperimentalCompilerApi (extension storage must be registered). Runtime classpath needs the compiler, kotlin-stdlib and kotlinx-coroutines-core-jvm. The IntelliJ core references javax.swing.Icon, so the jlinked runtime needs java.desktop: 77 MB (23.6 MB gzip) per host versus 44 MB (13.1 MB gzip) for the Scala-sized runtime; the jars add about 57 MB gzip. A stub javax.swing.Icon on the small runtime also parsed correctly but is not adopted without maintainer approval.

Implemented as planned. Cold simplicity review (separate agent, no conversation history) found no blockers; accepted: single carriage-return replacement, helpers moved beside their only users, dropped the type-name guard on member entries, the top-level-companion guard, the -Werror build flag and the headless flag (class-load trace shows only the javax.swing.Icon interface is loaded, no AWT toolkit), and one doc example the fixture does not exhibit. Kept the `src/*Test/` default exclusion: the user approved the listed defaults.

Verification on macOS arm64 with Bun 1.4.2 and JDK 25 (Temurin): test-bun/kotlin-scanner.test.ts passes (14 assertions: selection, symbols, operation positions after KDoc and a non-BMP character, unresolved calls, repeat equality, atomic failure naming Broken.kt, outline visibility/constructors/companion/entries, default exclusion of src/test, CRLF). Shared fresh-checkout test passes for kotlin with an empty home and only git on PATH (7 assertions); release-assembly test passes including kotlin (86 assertions). bun run check: lint has only the existing findings, typecheck passes, Node 16/16, Bun 771 pass, 52 skip, 6 fail. All 6 failures are Swift scanner tests failing at `swiftc` with "no such module SwiftParser" on this machine (Command Line Tools without swift-syntax); none involves Kotlin. The machine default Bun 1.3.14 is below the declared 1.4.1 minimum and fails unrelated tests, so the declared version was used. Package size: worker.jar 36 KB, dist/lib 59 MB, runtime 78 MB per host.

Final full-context complexity review (separate agent): no simpler approach; one blocking defect fixed: a file that is not valid UTF-8 failed without naming itself (AC 4), now reported with its path and covered by one assertion. Also applied: default exclusions written as `**/src/test/` and `**/src/*Test/` because an inner-slash pattern is anchored at the repository root and would have scanned tests in every Gradle module (verified with the selection helper on a nested module); two doc clarifications about nested-type operations and constructor delegation. Re-verified: Kotlin test 15 assertions pass, fresh-checkout kotlin passes, bun run check unchanged (Node 16/16, Bun 771 pass, 52 skip, 6 Swift toolchain failures unrelated to this task). AC 6 stays unchecked on this machine because of those 6 Swift failures; CI has the Swift toolchain. Third-party notices copy the Kotlin NOTICE, the Apache 2.0 text and the upstream third-party list; the individual third-party license texts are referenced by URL at the v2.4.21 tag, not copied.

Third-party notices now carry the full texts: all 30 license files that the Kotlin v2.4.21 third-party list names are copied from the tagged upstream sources into plugins/scanners/kotlin/THIRD-PARTY-NOTICES.txt after the list, with identical texts printed once under the paths that share them (22 distinct texts). This replaces the earlier note that they were only linked.

Review fixes after the PR #124 code review, one commit each: leading byte order mark accepted; outline names without backticks; 512 MB worker stack with a named failure beyond it; package folders named build kept under src/<set>/kotlin and src/<set>/java; variant test source sets excluded; no fixed limit on worker output; calls in function parameter defaults reported; only a val lambda is a function; SHA-256 of downloaded jars verified; worker runner, outline mapping and package assembly shared with the Scala scanner (plugins/scanners/jvm-worker.ts, folded into component scala-src-index) and notices and JDK tool lookup shared with the Java build (plugins/scanners/jvm-package.ts, excluded from the architecture scan like the other build scripts). The shared runner also removes the Scala adapter's 64 MB output limit. bun run check with a JDK on PATH: 771 pass, 6 Swift failures from the missing Swift toolchain.

Maintainer review 2026-10-11: renamed the Kotlin task from TASK-576 to TASK-578 by manually changing its filename and frontmatter, as Alex requested. TASK-576 already belongs to the private-repository FAQ task in the main checkout; TASK-577 is also occupied. TASK-578 was unused across local and fetched Git history and all available worktree Backlog records. Scanner contract review and validation are in progress.

Maintainer specification and quality review, 2026-10-11: two reproducible blockers remain against the shared scanner contract. (1) Outline.kt:57-61 treats missing visibility as public. In an isolated source file, both constructors of sealed class Message(val text: String) are reported public rather than protected; Derived overrides of locally declared protected/internal Base methods are also reported public. The source-outline contract requires the language default, not merely the written modifier (docs/scanners/creating-a-plugin.md:208-211); the Kotlin documentation confirms sealed-constructor and inherited-override rules. (2) Calls.kt:14-21 visits nested function, lambda and object-method bodies using the enclosing operation ID. In fun outer() { fun neverCalled() { hidden() }; val later = { delayed() }; now() }, the scanner claims outer invokes hidden, delayed and now, although the first two bodies are not executed by outer. The invocation contract requires the caller operation that makes the call (docs/scanners/creating-a-plugin.md:492-495). These probes were run against the built, isolated package in /tmp/groma-pr124-packages/kotlin. AC 2 and 3 remain open; no scanner implementation was changed during this review.

Verified during this review: Kotlin, affected Scala and release assembly tests pass (5 tests, 137 assertions); Kotlin fresh-checkout test passes with empty HOME and no language tools on PATH (7 assertions). CI run 38126617775 was approved for commit 537e3299 and is running on Windows, Linux and macOS. The task filename/frontmatter correction is pushed and the PR description now references TASK-578. The PR already contains current main 7b9f3c09. The ordinary OKF Code links remain readable, source roots stay temporary evidence, and Kotlin introduces no C4 boundary or durable metadata. Parser execution uses only selected sources and the packaged runtime; no Gradle/Maven or project dependencies are loaded.

Local full check completed successfully: bun run check, Bun 1.4.2, JDK 25.0.1, Node 16/16 and Bun 777 pass / 52 skip / 0 fail. Lint and TypeScript checks pass; skipped native-package suites retain their existing environment gates. This passes AC 6 locally but does not resolve the two semantic defects above. Only task metadata changed during the maintainer review; scanner source remains exactly as reviewed in d4d7faf9. CI remains in progress for 537e3299 with that same scanner source.

Takeover implementation in progress (2026-10-11). Added regression fixtures: the original package fails the deferred-call ownership assertions; after the call/constructor fixes, constructor and call assertions pass and the original inherited-visibility assertions fail as expected. The new source-only Visibility helper compiles and a temporary JVM probe verifies sealed/enum constructors, inherited protected/internal/public members, traversal through an intermediate class, and an imported alias to a base in another supplied source file. Outline integration is waiting for Alex to choose how to represent unresolvable inherited access: omit only those members (recommended) or add unknown visibility across the shared contract/viewers. The existing contract provides no unknown value; no decision has been assumed.

Initial real-project qualification passed with the packaged scanner after the call/constructor fixes: Coil 8efac6f9 (347 selected files), Koin dc86ef8d (357), Arrow 3373cce8 (253), Now in Android a49ed253 (253), Ktor 4717dd5f (2,432), total 3,642 files. The harness runs with empty HOME and PATH=/nonexistent, checks exact selected-file inventory, repeat equality, operation/call positions, unresolved targets, outlines and unchanged Git status. No project builds or dependencies were installed. Ktor uses custom jvm/test and similar folders, so default selection includes those tests; counts describe all selected .kt files, not production-only source. Re-run final qualification after inherited-visibility outline integration. Temporary logs and results are /tmp/groma578-corpus.log and /tmp/groma578-corpus-results.json.

Alex did not choose a Kotlin-specific representation and asked for technical guidance. The agent chose the recommended omission within the source-only fix; this is an implementation decision, not an assertion that Alex explicitly approved a new shared API.

Final five-project qualification passed after inherited visibility and immediate object initialization fixes: 3,642 files, 19,204 operations and 47,437 unresolved calls. Exact commits, counts, checks and limits are recorded in docs/scanners/kotlin/validation.md. Isolated Kotlin regression passes (27 assertions); relocated fresh-checkout Kotlin package passes (7 assertions). Regression assertions failed before the relevant fixes. Cold simplicity and final reviews follow.

Cold simplicity review of the takeover fixes passed in a separate agent with no conversation history. It found no unnecessary layer or material code/test reduction. Own inspection and reviewer both caught deferred object accessors; the smallest fix skips KtPropertyAccessor while retaining object initialization. The focused Kotlin test passes with getters/setters in the existing fixture (27 assertions). Plan now describes the final omission rule, removing the stale decision-pending sentence.

Implementer specification and quality reviews pass for the takeover changes. AC 2: call ownership fixture preserves direct/default/root-function-value calls and object initialization while excluding uncalled nested functions, lambdas, local classes, object methods and accessors. AC 3: exact protected/internal/public results, sealed/enum constructors, intermediate/imported base context, unresolved member omission and unchanged evidence are asserted. Regression probes failed before fixes; assertions compare domain results, not prose or source text. Entry flow is selected paths -> bundled worker -> operations/calls or Visibility/Outline -> shared contracts, with requested-file filtering in the adapter. Kotlin rules remain within the Kotlin worker; no shared visibility API or architecture boundary changes. Source/test files remain below 500 lines. Five-project rerun after accessor fix passes: 3,642 files, 19,204 operations, 47,410 calls (27 fewer deferred getter calls in Arrow/Ktor). Fresh-checkout test passes, all checkouts unchanged. Full local check passed (Node 16/16; Bun 777 pass, 52 skip), and is rerunning after the final correction. Latest local Bun is 1.4.3, within declared >=1.4.1; CI uses pinned 1.4.2.

Full-context complexity review found and reproduced one AC 3 blocker: an intermediate same-arity overload hid an inherited overload with different access. The new regression fails before the fix (choose wrongly protected) and passes after retaining inherited candidates. Targeted re-review accepted that fix but found repeated recursive work. Applied its simpler algorithm: collect explicit access or default-public non-overrides, and use one ancestor walk for unmodified overrides; retain only the class-cycle guard. No new API or scope added. Final focused/full/corpus checks will verify this simplification.

Final verification after all review fixes: bun run check passes (Node 16/16; Bun 777 pass, 52 skipped, 0 failures; 2,941 assertions). Focused Kotlin test: 28 assertions. Relocated Kotlin fresh-checkout: 7 assertions. Final five-project run passes with unchanged pinned checkouts and the documented totals. Targeted implementer re-review confirms the inherited-overload fix collects local and ancestor evidence in a single traversal and no longer repeats recursive override resolution. Specification, quality, cold simplicity and full-context complexity findings are resolved. git diff --check passes; no uncommitted groma/ changes were produced. Prior CI on 537e3299 passed Kotlin on all three hosts but the Windows repository suite failed an unrelated scanner-settings lifecycle assertion; that failure could not be reproduced locally and no speculative session change was made. The pushed source revision will receive a fresh CI run.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added the experimental, self-contained Kotlin scanner through the existing plugin/catalog/release flow. Corrected deferred call ownership, sealed/enum constructor visibility, and source-only inherited override access; omit unproved members from outlines while keeping scan evidence. TASK-578 is unique and matches its filename/frontmatter. Documentation and regression fixtures describe the supported scope and limits. All local repository checks and five pinned open-source project checks pass (3,642 selected files). Required reviews are complete; PR #124 is ready for CI and maintainer merge review.
<!-- SECTION:FINAL_SUMMARY:END -->
