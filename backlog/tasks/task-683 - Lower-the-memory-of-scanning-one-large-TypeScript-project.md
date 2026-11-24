---
id: TASK-683
title: Lower the memory of scanning one large TypeScript project
status: In Progress
assignee:
  - '@claude'
created_date: '2026-11-24T18:48:00Z'
updated_date: '2026-11-24T19:15:00Z'
labels: []
dependencies: []
references:
  - plugins/scanners/typescript/src/source-analysis.ts
  - plugins/scanners/typescript/src/source-operations.ts
modified_files:
  - patches/typescript@7.1.0-beta.patch
  - package.json
  - bun.lock
  - plugins/scanners/typescript/src/compiler.ts
  - plugins/scanners/typescript/src/source-analysis.ts
  - plugins/scanners/typescript/src/structure.ts
  - plugins/scanners/typescript/src/source-operations.ts
  - plugins/scanners/http-checker.ts
  - docs/scanners/typescript/index.md
  - groma/systems/groma-md/containers/cli/components/typescript-src-index.md
priority: high
type: enhancement
ordinal: 718000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
One TypeScript program of 18 MB of source peaks at 2.0 to 2.7 GB in the compiler process and 1.4 to 2.6 GB in the scanner process; one of 36 MB needs about 9 GB in both, so a large single project can run a laptop out of memory. The owner wants the scan to need less memory and does not want a check that refuses large projects. Two causes were measured. The compiler is a Go program, and Go collects garbage only once its heap has doubled since the last collection. The scanner asks the compiler whole-program questions concurrently (every syntax tree, the symbol of every name, every call target, every file's imports); the SDK sends all concurrent questions as one batched message and gathers every page of the answer before handing any over, so both processes hold the whole question and answer at once. Groma runs on Linux, macOS and Windows.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The TypeScript compiler process started by the scanner runs with GOMEMLIMIT set to a quarter of the machine's memory unless GOMEMLIMIT is already set in groma's environment, and no other process groma starts gets that setting.
- [ ] #2 The scanner asks the compiler for syntax trees, symbols, call targets and imports in bounded batches instead of one request for the whole program.
- [ ] #3 Scanning the same sources produces observations byte-identical to main.
- [ ] #4 Peak memory of both processes and scan time are measured before and after on one large program.
- [ ] #5 The repository check passes on Linux, macOS and Windows.
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
1. patches/typescript@7.1.0-beta.patch (bun patch of the pinned SDK) adds an env option to the async API's spawn options and passes it to the compiler's spawn. The SDK has no other way to give the compiler process its own environment, and setting process.env would reach the Go programs other scanners start at the same time. The TypeScript scanner's package bundles the SDK, so the patched code ships with it; a newer SDK without the patch fails the type check because env is no longer a known option.

2. plugins/scanners/typescript/src/compiler.ts: compilerApi(repositoryRoot) is the one place the scanner starts the compiler. It passes the parent's environment plus GOMEMLIMIT at a quarter of os.totalmem(), unless GOMEMLIMIT is already set. source-analysis.ts and structure.ts use it.

3. Bounded requests with the existing inBatches (256 at a time) in source-analysis.ts (fetching the program's syntax trees, reading each file's imports) and source-operations.ts (resolving every call in OperationResolver.prepare), and the symbol request in slices of NAMES_PER_REQUEST (32,768) in OperationResolver.askSymbols. The inBatches comment says why batches stay bounded.

4. Tests: none added. The supported rule is lower peak memory with byte-identical evidence. Existing TypeScript scanner tests cover the evidence; memory cannot be asserted reliably in a test (peaks vary by up to 2x between identical runs). Verification is by measurement and byte comparison, recorded in the notes.

5. docs/scanners/typescript/index.md states the batching and the memory limit. Fold the stand-alone component the scan makes for compiler.ts into typescript-src-index. Run bun run check and the readability review.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
How the approach was chosen, 2026-11-24. The owner asked for lower memory instead of a guard and for feedback from Gemini (gemini-4-carbon-high) and two Codex models (gpt-6.2-sol and gpt-6.2-astra, max). Both Codex models found the cause the others missed: the async SDK sends all concurrent questions as one batchRequests message, gathers every page of the answer before handing any over, and carries syntax trees as base64 text, so a whole-program request is held in full by both processes. Gemini's top proposal (plain-data call resolver, clearing the SDK cache per batch, HTTP readers only on files that mention HTTP) was rejected by both: it breaks node identity and alias following, and a text filter misses defaults set in files without calls.

The compiler setting changed while building. GOGC=25 halved the compiler's peak but cost 65 to 85 percent more CPU on every scan, small repositories included; GOGC=50 cost 20 to 45 percent. A memory limit costs nothing until the heap nears it: GOMEMLIMIT=1GiB on the 18 MB program kept the compiler at 1.05 GB for 8 percent more CPU, and 2GiB on the 36 MB program kept it at 2.14 GB (main 4.87 GB) while running faster than main. Below the compiler's live memory it thrashes: 1GiB on the 36 MB program took 78 s and 448 s of CPU instead of 24 s and 43 s. So the limit scales with the machine (a quarter of its memory), where it only acts when memory is tight, and a project whose compiler needs more than the limit finishes slowly instead of running the machine out of memory.

Measurements, final code against main, alternating runs, TypeScript scanner alone (observation-of.ts), macOS, 32 GB, so a limit of 8 GiB that the programs below never reach. One program of 3,320 files and 18 MB: main compiler 2.38 to 2.49 GB, scanner 2.34 to 2.43 GB, 10.4 to 11.6 s, CPU 19.2 to 21.1 s; this change compiler 1.56 to 1.76 GB, scanner 0.98 to 2.24 GB, 11.3 to 11.7 s, CPU 21.8 to 22.2 s. Ordinary repositories, three runs each: groma 2.0 to 2.3 s and 4.5 to 4.8 s CPU on both; gemini-cli 4.2 to 4.5 s and 10.2 to 10.7 s CPU on both. One program of 6,640 files and 36 MB: main compiler 4.87 GB, scanner 4.93 GB, 30 s; batched requests compiler 3.09 GB, scanner 3.87 GB, 24 s. Peaks of the scanner process vary up to twofold between identical runs because the runtime collects lazily; it keeps every syntax tree of a program until the program ends, which this change does not address.

Verification. The compiler process gets GOMEMLIMIT=8192MiB on this machine and the scan process has none (read with ps from both processes during a scan); with GOMEMLIMIT=3GiB set for groma the compiler gets 3GiB. Observations are byte-identical to main on this repository (8.3 MB), Backlog.md (5.3 MB), gemini-cli (13.3 MB), the 18 MB program and the 36 MB program. Type check, lint and the TypeScript scanner tests pass.
<!-- SECTION:NOTES:END -->
