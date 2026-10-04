---
id: TASK-536
title: Complete the first Keycloak scan in under ten seconds
status: Done
assignee:
  - '@codex'
created_date: '2026-10-03 22:28'
updated_date: '2026-10-04 16:27'
labels: []
dependencies: []
references:
  - java-src-index
  - scene
  - src-architecture-findings
  - relationships
  - scanner-src-index
  - src-scanner
modified_files:
  - test-bun/java-scanner.test.ts
  - plugins/scanners/java/java/md/groma/scanner/Main.java
  - plugins/scanners/java/src/adapter.ts
  - plugins/scanners/java/src/index.ts
  - plugins/scanners/java/src/process.ts
  - src/sheet/pack-forces.ts
  - src/architecture-findings.ts
  - src/sheet/route/graph.ts
  - packages/scanner/src/index.ts
  - test-bun/architecture-findings.test.ts
  - plugins/scanners/java/src/missing-types.ts
  - src/architecture-findings-worker.ts
  - src/scan-reconciler.ts
  - scripts/build.ts
  - >-
    groma/systems/groma-md/containers/cli/components/architecture-findings-worker.md
  - >-
    groma/systems/groma-md/containers/cli/components/src-architecture-findings.md
  - plugins/scanners/java/src/worker.ts
  - plugins/scanners/java/build.ts
  - groma/systems/groma-md/containers/cli/components/java-src-index.md
  - groma/systems/groma-md/containers/cli/components/worker.md
  - docs/scanners/java/index.md
  - docs/architecture-findings.md
priority: high
type: enhancement
ordinal: 621000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
A fresh Groma web setup on the local Keycloak checkout takes minutes before the architecture map is available. Measure the full supported first scan, remove the measured bottlenecks, and inspect the resulting map on localhost:4806, keeping the existing demo on port 4805.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A fresh architecture scan of the complete selected Keycloak sources finishes in less than ten seconds on this development machine, with the timing boundary and source revision recorded.
- [x] #2 The scan preserves supported source coverage, ownership, compiler evidence, and architecture output; no source exclusions or reduced analysis are used to meet the target.
- [x] #3 The recreated test-keycloak checkout is initialized and its resulting architecture map is inspected through groma web on port 4806.
- [x] #4 The repository check passes after the performance changes.
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
1. Measure the complete supported first scan on the recreated local Keycloak checkout. Start timing before scanner-registry loading and stop after all selected compiler observations, architecture Markdown, relationships and duplicate findings are complete. Start every measurement with no generated systems or relationships and a fresh compiler JVM; preserve project configuration. Measure map preparation separately and compare complete observations, Markdown, world and scene with the captured original.

2. Remove measured costs in their existing owners. The Java adapter runs in one host worker and reads one compiler process with the native synchronous reader. Four compiler threads start larger source sets first, keep private javac tasks, and reuse a standard file manager only sequentially within the same thread and encoding; each task resets its locations and retains its release and diagnostics. Keep complete output, a bounded 2 GiB heap and original project output order. The scanner SDK retains sort keys and checks token arrays without copying them; Java normalizes only the diagnostics it changes. Core compares identical-body groups with local numeric token counts and unchanged thresholds, partitions comparison between two workers while reconciliation writes Markdown, and joins complete groups with final ownership. Reconciliation reserves the same IDs before entry-point placement and writes new components once at their final paths. Existing curated records retain the validated placement operation. Map placement visits only nearby body pairs in the original order; routing sorts immutable obstacle views once and reuses free strips.

3. Preserve meaning across projects and languages. Java source sets and compiler facts remain temporary evidence. Entry-point inference and existing components continue to own architecture meaning. Threads, token indexes and calculation caches are supporting implementation details, not new OKF metadata or C4 elements. Ordinary Markdown readers see exactly the same documents and source links. No source exclusions, reduced analysis, repository build, compatibility layer, retry or new model concept is required.

4. Test decisions: the documented Java project-local release and encoding contract requires reused workers to match independent compiler processes. Existing single-process coverage did not reuse a manager, so extend one isolation test to six projects, including equal type names, a later Java 21 task and UTF-16LE sources; leaked locations, language options or diagnostics must break observation equality. The documented duplicate-body rule counts an independent copy even when its equal peer is nested; extend the existing nesting test to detect a group representative hiding that copy. Parallel comparison must preserve transitive groups and final owners; extend the existing transitive test through the asynchronous job so a cross-partition bridge must join all four instances. Existing SDK, reconciliation, entry-point, lifecycle, layout and routing checks already cover their supported rules; use them and complete real-output equality instead of adding implementation-shaped tests.

5. Update the two responsibility documents and generated worker ownership through Groma. Run focused checks, one cold simplicity review, the implementer specification and quality reviews and the full-context complexity review required by AGENTS.md. Run bun run check after final code changes and exercise the compiled CLI with its embedded comparison worker. Record revision, runtime, machine, measurement boundary and fresh timings. Start groma web on port 4806, inspect the Keycloak results, preserve the existing demo on port 4805 and finalize only proven acceptance criteria.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
The two-project worker isolation regression fails before batching and passes after it. The first large batch exceeded the old per-process 64 MiB output buffer; the worker now returns all supported observations without that artificial cap. No sources or diagnostics are removed.

The Java worker now executes up to four independent compiler tasks concurrently inside one JVM and writes observations in project order. Each task still creates its own compiler and file manager. This applies Alexs multi-thread suggestion within the existing Java worker, without a generic worker framework.

The complete baseline reached opening-map at 208.615 seconds on the startup monitor: Java 62.907 seconds, reconciliation 8.834 seconds, architecture load 0.737 seconds, and map layout 129.029 seconds. Java-only duplicate comparison takes 5.702 seconds. A reduced map CPU profile spends 68% in gapBetween, mainly force pair checks. The baseline contains 7,400 elements and 169 relationships.

A complete fresh scan with parallel Java and findings currently takes 13.36 seconds; its map is ready at 21.71 seconds, compared with the original 208.615-second startup. All 7,400 elements, 169 relationships and the full scene remain exactly equal. The ten-second complete-scan goal remains open. Pure Java worker timing writes to /dev/null, so it excludes transferring roughly 78 MiB of observations to the host; measure that transport before relying on the worker-only number.

Reusing the spatial index between force rounds did not improve the full map measurement (7.76 seconds versus 7.41 seconds). Removed that reuse and its extra parameters; retained only the measured local-pair optimization. The ordered scene still matches the original.

The bundled scanner and host worker are JavaScript artifacts. Their extension follows the scanner module (.ts in source, .js in the package), so both current development and packaged entry points locate the same worker without an adapter file. Naming the generated bundle .ts caused TypeScript to check transpiled third-party code; restored the normal .js package output.

The current four local packages preserve every observation field except Java scanner.engineVersion: the original package carries 25.0.4.1+1-LTS, while the installed maintainer JDK builds 25.0.1+8-LTS-27. Restore the original bundled compiler runtime in the local benchmark artifact so both evidence comparison and timing hold the runtime constant. The new JAR and scanner code remain current; the packaged runtime and its license files are copied together. This is benchmark setup, not a runtime selection feature or a compatibility path.

Final measurement after reusing Java file managers: complete fresh scans take 9.715825 s and 9.943169 s. The full maps are ready at 17.653064 s and 18.210108 s. Both runs create all 7,400 architecture elements, 169 relationships and 1,823 findings. Every scanner observation field is equal to the original, including Java runtime metadata; all 7,403 Markdown files have equal paths and SHA-256 hashes, and the entire ordered world and scene are equal. No source coverage is reduced. Boundary is registry loading through collection and complete reconciliation/finding results, matching scanRepository; map loading and placement/routing are reported separately. Revision dd4ae31d1b67c91a7f85f7c60df5c9718b111f0a, Apple M5 with 10 logical CPUs and 32 GiB, Darwin arm64, Bun 1.4.2, Java 25.0.4.1+1-LTS. Evidence: /private/tmp/groma-keycloak-fresh-reused-managers.log and /private/tmp/groma-keycloak-fresh-reused-managers-repeat.log. Focused validation: 86 tests pass across 12 affected Java, findings, reconciliation, lifecycle, placement and routing files.

Correction history: trial pool sizes above four, separate JVMs, runtime warm-up/JIT tuning, a different JSON encoder, streamed parsing, gzip transport, more comparison workers and smaller comparison payloads did not give sufficient full-flow benefit. Keep four compiler threads, two comparison workers and the existing observation format. The per-project runtime module check is absent from scanning; the explicit readiness check still owns it. Shared file managers replace the earlier task-private file-manager plan only within one thread and encoding, after independent-process parity and the six-project regression pass. The final plan above describes the shipped approach.

The compiled CLI build revealed that the browser bundle validates every named import in the shared findings module, even when its worker orchestration is unused there. Bun's node:os browser polyfill lacks availableParallelism. Use its existing cpus export for the same bounded two-worker choice; calculation and browser behavior are unchanged. Verify the actual compiled executable after rebuilding.

The required cold simplicity review passes with no material blocker. Applied its single small deletion: Java readiness no longer returns an unused command/JAR object, and checks the existing worker directly. The reviewer confirmed clear responsibility ownership, unchanged OKF/C4 meaning and no generic worker framework. The compiled CLI now builds and scans the existing duplicated-logic fixture successfully: created 7, findings 1, exit 0; its embedded comparison workers execute.

Implementer specification review: AC1 is proven by two genuinely fresh complete scans at 9.716 s and 9.943 s with revision, runtime, machine and registry-through-reconciliation boundary recorded. AC2 is proven by equality of all four complete observations, all 7,403 Markdown path/hash pairs, the full world (7,400 elements, 169 relationships, 1,823 findings) and ordered scene. AC3: the requested local clone is initialized and groma web runs on 4806; the browser shows Keycloak and its 1,823 review groups. Its Plugins panel lists all four selected scanners, and the live scanner-settings endpoint reports java, javascript, react and typescript ready with a neutral notice. The live world and scene also equal the original. The demo on 4805 is preserved. AC4: bun run check exits 0; 751 Bun tests pass, 48 environment-dependent tests skip, no failures; type checking and Node tests pass. Changed TypeScript files also have no Biome diagnostics. All changed source/test files are at or below 500 lines.

Implementer quality review: traced scanRepository through the registry, Java host worker and compiler pool, observation normalization, reconciliation/entry placement, comparison partitions/final ownership and map geometry. State is owned by the existing scanner, findings, reconciliation and sheet responsibilities. Compiler contexts and diagnostics stay project-local; file managers stay within their thread and encoding and close after executor completion. Comparison joins complete connected groups before reports, and workers close through the existing finally handoffs. Delayed writes reserve IDs in the old order and retain validated placement for curated records. Nearby pair visits and route views preserve original order and geometry. The isolation regression detects compiler-context leakage, including release-dependent fixture diagnostics and UTF-16LE reading; the nesting regression detects an independent copy hidden by its nested equal peer; the asynchronous bridge regression detects an incomplete partition merge or lost final owner. No implementation-shaped tests or new model concepts were added. No authority-backed blocking defect remains.

The first full check under the restricted sandbox failed only when local listening, FSEvents watchers and ps were denied. Repeating the same required command with those facilities available passed; no test assertions, timeouts or retry behavior were changed. Evidence: /private/tmp/groma-task536-check-unrestricted.log, /private/tmp/groma-task536-review-focused.log, /private/tmp/groma-task536-cli-fixture-scan.log and /private/tmp/groma-keycloak-live-final.json.

The required final full-context complexity review passes with no blocking defect or material simplification recommendation. It confirms that compiler threads, finding workers, reconciliation and map calculations remain grouped under their existing responsibilities and that a junior developer can follow the final flow. The browser is left on http://localhost:4806/ with the completed map fitted to its view; screenshot evidence is /private/tmp/groma-keycloak-final.jpg. The 4806 Groma server remains running. Full-map timing remains separate from the under-ten-second saved-scan result.

Automatic approval review rejected changing TASK-536 to Done because Alex has not confirmed completion. Implementation, verification and required reviews are complete; leave the task In Progress pending that final confirmation. No commit has been made.

Cross-repository regression audit requested by Alex after the original verification. Before this request, validation used Keycloak and the full test suite, not other real repositories. The audit uses isolated local clones under /private/tmp/groma-regression536, with the same target source revision and selection on each side. The before core and scanner SDK come from Groma commit b78c3687fe5074aa94463dd6e19a7954bf474c5c; the after side uses this task's current changes. Both scanner sets are freshly packaged against the same installed dependencies. Both Java packages use the same bundled compiler runtime 25.0.4.1+1-LTS. No application dependencies are installed in the target clones, matching an initial scan of a clean checkout. Original repositories and both existing web servers are untouched.

Targets: Backlog.md 69e7b15362337d6712783d9a685f6e4bb693fa9d (TypeScript and React); Call for Papers 55587399548fbd4e4cae8b07f6dd686a0a3c5412 (Java, Angular, TypeScript, PHP and JavaScript); Gemini CLI 83a634444ab9fd27507f704a1026928fe0428068 (TypeScript, React and JavaScript); Groma b78c3687fe5074aa94463dd6e19a7954bf474c5c (existing curated architecture, with the configured TypeScript and React selection and original global exclusions). Groma's other scanner integrations are not included in this manual comparison. The first three targets start with a fresh architecture; their existing Groma prototype state is reset only inside the disposable clones. Call for Papers' old scanner configuration does not declare include lists, so both comparison sides are initialized with identical current package defaults. The audit does not migrate or change that original repository.

Every complete observation, scan summary, ordered annotated world, finding, and Markdown path/SHA-256 pair matches on all four targets. The targets have respectively 218/26/90, 1230/118/281, 822/21/98 and 121/60/37 elements/relationships/findings. All 2409 resulting Markdown documents match. Full ordered scenes match on Backlog.md, Gemini CLI and Groma. Call for Papers' fresh map fails the existing routing safety check in both versions, with exactly the same crossings: relationship:5, relationship:28, relationship:34, relationship:35, relationship:54, relationship:85 and relationship:93; shared=0. Its complete placement is also identical. That is an existing failure in this fresh map, not a new regression; no successful complete scene is claimed for it.

Observed complete scan seconds before -> after: Backlog.md 1.552 -> 1.439; Call for Papers 4.307 -> 3.634; Gemini CLI 3.049 -> 2.678; Groma 1.408 -> 1.243. These are single fresh runs, not a statistical speed guarantee. A small Groma map timing increase was checked with 30 warmed alternating before/after calculations after two warm-up rounds. Every serialized scene remains equal. Median total map calculation is 57.540 ms before and 59.010 ms after; placement is 2.088 -> 4.379 ms and routing 55.361 -> 54.400 ms. Record this small performance cost of the nearby-pair index rather than claiming no timing regression. The complete initial scan and map still improve together. No new implementation was added for this audit.

Evidence: /private/tmp/groma-regression536/results.json (complete comparison summary), /private/tmp/groma-regression536/groma3-map-repeats.json (all 30 paired measurements), the per-target before/after JSON and logs, and the temporary audit scripts in the same directory. Source diff checks confirm zero changed application source files in all target clones. The earlier repository check remains 16 Node passes and 751 Bun passes, 48 environment-dependent skips, zero failures. Native Go, Rust and C# real-repository scans were not exercised by this audit.

Alex confirmed delivery by explicitly requesting commit and push on 2026-10-04. The earlier automatic-approval block on terminal status is resolved by that confirmation. Both generated worker components were already combined into their existing owners: Java scanner and Architecture findings. git status --short groma/ shows only those two owner records, and both include the new worker source paths. The final combined repository check after TASK-537 passes with 16 Node tests and 752 Bun tests, 48 skips and zero failures. The pre-existing fresh CFP map failure discovered in the regression audit is fixed and verified separately by TASK-537. Stage only this task's source, tests, documentation, architecture owners and task record; preserve unrelated assets and TASK-532.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Complete fresh Keycloak scans finish in 9.716 s and 9.943 s on the recorded Apple M5 machine. Four isolated Java compiler tasks share one JVM and reuse per-thread, per-encoding file managers. Two comparison workers run while reconciliation writes new architecture records once at their final paths. Normalization, placement and routing avoid measured repeated work.

All complete compiler observations, all 7,403 Markdown files, the 7,400-element world with 169 relationships and 1,823 findings, and the ordered scene match the original. Full maps are ready separately at 17.65–18.21 s, compared with the original 208.615 s. Real repository scans also preserve exact observations and architecture in Backlog.md, CFP, Gemini CLI and Groma; the small recorded Groma map timing cost is documented. The existing CFP routing error was fixed separately in TASK-537.

The local Keycloak clone and four ready scanners were inspected on port 4806; the demo on 4805 remains. Documentation and worker ownership are current, the compiled CLI works, and all required reviews passed. The final combined repository check passes (16 Node and 752 Bun passes, 48 environment-dependent skips, zero failures). Alex approved delivery and requested commit and push on 2026-10-04.
<!-- SECTION:FINAL_SUMMARY:END -->
