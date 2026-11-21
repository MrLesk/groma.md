---
id: TASK-674
title: Keep JavaScript evidence when one file exhausts the compiler's call stack
status: Done
assignee:
  - '@claude'
created_date: '2026-11-21T00:12:00Z'
updated_date: '2026-11-21T00:27:00Z'
labels: []
dependencies: []
references:
  - plugins/scanners/javascript/src/http.ts
  - plugins/scanners/javascript/src/index.ts
  - test-bun/javascript-scanner.test.ts
  - docs/scanners/javascript/index.md
modified_files:
  - test-bun/javascript-scanner.test.ts
  - plugins/scanners/javascript/src/http.ts
  - plugins/scanners/javascript/src/index.ts
  - docs/scanners/javascript/index.md
  - plugins/scanners/javascript/package.json
  - bun.lock
type: bug
ordinal: 711000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
On 2026-11-21 Alex had ten well-known open source projects scanned with the development version and said: "if scanning a repo makes groma crash, delegate to an agent to fix asap". On Dify the JavaScript scanner fails, so none of the repository's JavaScript evidence reaches the map.

Reproduction: clone https://github.com/langgenius/dify at 296abf4e27f9d95ff8847eb6c55b043a2a71fba3 (156 JavaScript sources among about 16,000 files). Build the scanner with `bun plugins/scanners/javascript/build.ts`. In the clone run `bun <groma>/src/cli.ts init "Dify" --directory groma`, `bun <groma>/src/cli.ts plugin add <groma>/plugins/scanners/javascript` and `bun <groma>/src/cli.ts scan`. The scan prints `javascript: Maximum call stack size exceeded. (saved scanner data kept)`.

Cause: `web/public/vs/language/typescript/tsWorker.js` is a 5.7 MB vendored bundle of the TypeScript compiler (71,011 calls, 21,449 operations). The HTTP reader asks the bundled compiler which function a member call such as `host.send(url)` names (`forwardedFetch` in `plugins/scanners/http-forwarding.ts`, through `symbolsAt` in `plugins/scanners/http-checker.ts`). To answer, the compiler infers the type of the receiver, and in JavaScript that means inferring each function's return type from its body, which calls the next function. On this file the inference nests 619 functions deep (21,624 stack frames) and the runtime throws a RangeError. The recursion is inside the compiler, not in a scanner walk. The scan fails only when the file is scanned with the rest of the repository; alone it stays just under the limit.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Scanning Dify at 296abf4e with the JavaScript scanner completes and reports the evidence of its other JavaScript files instead of failing with Maximum call stack size exceeded
- [x] #2 A JavaScript file whose names the compiler cannot resolve within the call stack keeps its inventory entry, contributes no declarations, operations, calls or HTTP facts, and gets one warning that names the file, while every other file keeps its evidence
- [x] #3 A regression test builds such a file from a generated chain of functions, fails with the unfixed scanner and passes with the fix
- [x] #4 The JavaScript scanner guide states the rule and the scanner package carries a new version
- [x] #5 The task records whether the scanners that share the HTTP readers (TypeScript, React, Vue, Angular) have the same weakness
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
1. `plugins/scanners/javascript/src/http.ts`: `javaScriptHttpFacts` answers `'too-deep'` for a file when the runtime runs out of call stack while the compiler answers about it. `stackExhausted` recognizes that error: a RangeError whose message starts with `Maximum call stack size exceeded`, as Bun and Node word it; any other error stays a scan failure. Each file has its own checker, and a checker interrupted in the middle of an answer is in an unknown state, so everything it answered for the file is dropped with it. Creating the checker stays outside the guard: it binds the file, and the binder keeps its working state in the compiler, shared by every file, so an interrupted bind would leave that state behind for the next file.
2. `plugins/scanners/javascript/src/index.ts`: `scanSource` reads one file and returns what it contributes or the warning that says why it contributes nothing: `JAVASCRIPT_SOURCE_INVALID` (existing, parse error) or `JAVASCRIPT_SOURCE_TOO_DEEP` (new). A file with a warning keeps its inventory entry and contributes nothing, as the guide already states for a file that does not parse, and the entry reader gets only the files that were read.
3. `docs/scanners/javascript/index.md`: state the rule next to the parse-error rule and name the test in Validation. Bump `@groma/scanner-javascript` 0.2.4 to 0.2.5 in its `package.json` and in `bun.lock` (Releases section of CLAUDE.md; the guide ships as the package README).
4. Test decision. Rule and authority: one file the compiler cannot answer about must not cost the repository's JavaScript evidence (Alex's request above, the reproduced `groma scan` failure on Dify). Wrong result the test detects: `scan` rejects with `RangeError: Maximum call stack size exceeded` and returns no observation. Gap: `test-bun/javascript-scanner.test.ts` covers a file that does not parse (fixture `javascript-invalid`), nothing covers a file that parses and then exhausts the compiler. Smallest test: one concurrent test in that file writes `app.js` and a generated `bundle.js` (a member call whose receiver comes from a chain of 50,000 functions, each returning the next one's result; 2,000 links still fit on macOS and 5,000 do not), and asserts that the scan resolves, `app.js` keeps its operation, `bundle.js` has no symbols and no operations, and one warning with the new code names `bundle.js`. The member call stands first in the file so the scan stops at the second call it asks about.
5. Verify: the test fails on the unfixed scanner and passes after; `groma scan` on the Dify clone; `bun run check`. Check the sibling scanners that share the readers and record the result.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Choices made in this task without a decision from Alex:
- A file too deep to read contributes nothing, like a file that does not parse, instead of keeping its operations and calls without HTTP facts. A file read in part would look read on the map.
- Only the compiler's answers are guarded, not the creation of the checker. Checked by experiment: after a bind interrupted by a stack exhaustion (one call chain of 5,000 links), the next file bound gets a node of the previous file as its `parent`, because the binder resets its working state only when a bind ends.
- The guard matches a RangeError whose message starts with `Maximum call stack size exceeded`, the wording of Bun and Node, so any other range error still fails the scan.

Guide correction made with the new paragraph: `docs/scanners/javascript/index.md` said the scanner creates no compiler program. It creates one per file with `noLib` since it reads HTTP facts, so the sentence now says the compiler resolves each file's names without the declaration libraries. The comment at `plugins/scanners/framework-package.ts` lines 6-7 says the same and is unchanged.

Sibling scanners (acceptance criterion 5), checked by adding a generated source with the 50,000-link chain to each scanner's HTTP fixture and scanning from source:
- TypeScript: scan completes, the native compiler does not exhaust the stack; 11 s instead of 0.2 s.
- React (chain in a component file), Vue and Angular: the whole scan fails with `RangeError: Maximum call stack size exceeded`. They ask the same bundled compiler through the same shared readers, but one checker serves a whole project, so dropping one file is not enough there. Not changed in this task.

Other limits seen, not changed: a file whose syntax itself is too deep (one call chain `x.a().a()...` of 5,000 links) still fails the JavaScript scan in `visit` of `plugins/scanners/javascript/src/evidence.ts` or in the compiler's binder; no scanned repository has shown one. On Dify the scanner spends about 10 s on `web/public/vs/editor/editor.main.js` and 4 s on `tsWorker.js` before dropping it; both are vendored Monaco bundles a curator can exclude in `config.json`.

Verification:
- The new test in `test-bun/javascript-scanner.test.ts` fails on the unfixed scanner sources with `RangeError: Maximum call stack size exceeded` out of `scan`, and passes with the fix. The generated chain exhausts the stack in the same compiler question as Dify (`getSymbolAtLocation` reached from `forwardedFetch`).
- Dify at 296abf4e, fresh `groma` folder, JavaScript scanner added by path from the rebuilt package: `groma scan` prints `created 165, refreshed 0, matched 0, findings 1476` and `javascript · warning · JAVASCRIPT_SOURCE_TOO_DEEP ×1: web/public/vs/language/typescript/tsWorker.js`. The observation holds 156 files, 29,186 operations, 85,323 calls and 6 HTTP requests; before the fix it held nothing.
- Generated files that reach the deep inference through the other reader paths (a batch of names the bindings reader resolves, a URL argument the reader asks the type of, an axios instance member) also end in the warning with the other file's evidence kept, and leave no rejected promise unhandled.
- `bun run check` exits 0: Biome reports the two warnings and two infos that other files already had, TypeScript is clean, Node 26 pass, Bun 959 pass, 67 skip, 0 fail.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
The JavaScript scanner no longer loses a repository's evidence to one file. When the bundled compiler runs out of call stack while resolving a file's names, as on Dify's vendored 5.7 MB `tsWorker.js`, that file keeps its inventory entry, contributes no evidence and gets a `JAVASCRIPT_SOURCE_TOO_DEEP` warning, like a file that does not parse; every other file keeps its evidence. Dify at 296abf4e now scans to 165 elements. A generated regression test fails without the fix, the guide states the rule, and the package is 0.2.5.

Follow-ups that need a decision, not started: React, Vue and Angular fail the same way when a project source nests that deep, and a file whose syntax itself is too deep still fails the JavaScript scan. The notes hold the evidence for both.
<!-- SECTION:FINAL_SUMMARY:END -->
