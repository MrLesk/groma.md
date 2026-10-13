---
id: TASK-592.8
title: Identify a JavaScript file by the path Groma listed
status: Done
assignee:
  - '@claude'
created_date: '2026-10-11 16:52'
updated_date: '2026-10-13 18:43'
labels: []
dependencies: []
references:
  - plugins/scanners/javascript/src/index.ts
  - plugins/scanners/javascript/src/evidence.ts
modified_files:
  - test-bun/javascript-scanner.test.ts
  - plugins/scanners/javascript/src/sources.ts
  - plugins/scanners/javascript/src/index.ts
  - plugins/scanners/javascript/src/http.ts
  - plugins/scanners/javascript/src/entries.ts
  - plugins/scanners/javascript/src/evidence.ts
parent_task_id: TASK-592
type: bug
ordinal: 665000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The JavaScript scanner names a file by `ts.createSourceFile(...).fileName`, which rewrites a backslash in a file name to a slash. On POSIX systems a file literally named `a\b.js` next to `a/b.js` fails the scan with "duplicate file path: src/a/b.js", and alone it is reported under a path that does not exist. Such names are very rare. The defect is that file identity is derived from the parser instead of from the path Groma handed over.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Every file is reported under exactly the path Groma handed to the scanner, and the two reproduced layouts scan.
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
1. Rule and owner. JavaScriptSource in plugins/scanners/javascript/src/sources.ts pairs the path Groma listed (file) with the file's syntax tree (syntax), and javaScriptSources builds it. A fact names a file by the listed path. The parser's fileName is the parser's own spelling of the path, in which a backslash is a slash, so that name may not exist on disk, or may be another listed file. The rule is written on the two fields. fileName stays only inside fileChecker in http.ts, because the one-file program asks its host for the file by that name.
2. Changes, all inside the JavaScript scanner:
   - sources.ts: javaScriptSources returns each listed path with its syntax tree; parsing moves here from index.ts so one type carries both.
   - index.ts: the file inventory, parse warnings, symbols and operations read the listed path.
   - http.ts: an application's order identity is its listed path.
   - entries.ts: import edges and their targets are listed paths, and the file handed to the shared build-entry reader declares every entry that reader finds.
   - evidence.ts and fileChecker in http.ts: the bare syntax tree parameter is named syntax, so source means a JavaScriptSource. Rename only.
3. No guide change: docs/scanners/javascript/index.md already states that the scanner reports exact JavaScript paths.
4. Outside this task: plugins/scanners/entry-points/source.ts is a shared reader and is not changed. See the follow-up in the notes.
5. Test decision. One test in test-bun/javascript-scanner.test.ts, 'a JavaScript file keeps the path Groma listed where the parser spells it differently', in a temp directory, with the repository's existing test.skipIf(process.platform === 'win32').concurrent form, because Windows reads a backslash as a separator and cannot hold the name. Rule and authority: a file is named by the path Groma listed (the two reproduced layouts in this task). Wrong result caught: a file named a\b.js beside a/b.js fails the scan as a duplicate path, or its symbols, operations, route application or entry membership are reported under a/b.js. Gap: the parser spells every existing fixture name as listed, so no test tells the two paths apart. No fixture is added.
   Sites the test holds, each checked by returning that one site to fileName in a scratch copy: in index.ts the file inventory, the key of the symbols map and the file given to javaScriptEvidence (operation and symbol ids); in http.ts the route application; in entries.ts the importer's directory and the key of an import edge.
   Sites the test does not assert: the parse warning's file in index.ts; the set of listed paths that import targets are matched against in entries.ts; the declaration of a Bun.build entry in entries.ts, which the js-build-entry probe shows instead.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Reproduced with the audit probes (scratchpad/audit-ts): bun run.ts javascript js2 threw 'duplicate file path: src/a/b.js'; js3 reported its only file, src/a\b.js, as src/a/b.js with operation id src/a/b.js#0.

Implemented as planned. The new test was first run against the unchanged scanner and failed with 'duplicate file path: a/b.js'. In a scratch copy of the scanner (scratchpad/fixes/ts-js/mirror-js, repository untouched) the final test fails at HEAD and under each single return to fileName: inventory (duplicate file path), evidence (operation file is a/b.js), route application (a/b.js#app), import edges (the entry loses a\b.js).

Verification after the change:
- bun run.ts javascript js2: OK, files src/a/b.js and src/a\b.js, operations src/a/b.js#0 and src/a\b.js#0. js3: OK, file and operation under src/a\b.js.
- scratchpad/fixes/ts-js/js-identity (a route, a fetch, an import and a file that does not parse, all in backslash names): symbols, operations, invocation sources, endpoint operation and application, request operation, entry members and the parse warning all carry the listed path.
- bun test --timeout 20000 test-bun/javascript-scanner.test.ts test-bun/javascript-http.test.ts: 18 pass, 0 fail. test-bun/execution-evidence.test.ts and test-bun/scanner-source-listing.test.ts, which also import this scanner: 21 pass, 0 fail.
- bunx biome lint on the five changed files: no findings. bun run typecheck: exit 0.
- Tests import the scanner from src, and the packaged tests build it into a temp directory, so nothing under dist was rebuilt.

Left unchanged and still wrong, because the code is a shared reader outside this lane: plugins/scanners/entry-points/source.ts line 60 names the file that declares a Bun.build entry from the parser's fileName. Probe scratchpad/fixes/ts-js/js-build-entry: a build script named tools\build.js is reported as declaration tools/build.js. Line 43 resolves a new URL(path, import.meta.url) entry against the directory of the same name.

No file under groma/ changed.

Cold review of TASK-592.8, applied:
- B1, test only. main.js imported './a\\b.js', a specifier Node ESM, Bun ESM and Bun CommonJS resolve to a/b.js, so the entry assertion froze an edge the runtimes do not follow. The backslash-named file is the importer instead: a\b.js imports './c.js', the manifest's bin names a\b.js, and the entry must be { file: a\b.js, files: [a\b.js, c.js] }.
- B2. entries.ts sets the declaration of every entry the shared build-entry reader returns to the listed path of the one file it was handed. Probe js-build-entry: declaration is tools\build.js (was tools/build.js).
- The rule sits on the two fields of JavaScriptSource; the fileChecker comment says why the parser's name is compared there; the test is retitled; the bare syntax tree parameter of javaScriptEvidence and fileChecker is named syntax.
- The plan lists exactly which sites the test holds.

This supersedes the earlier note that the Bun.build declaration was left wrong.

Verification after the review changes:
- bun test --timeout 20000 test-bun/javascript-scanner.test.ts test-bun/javascript-http.test.ts: 18 pass, 0 fail.
- bun test --timeout 20000 test-bun/execution-evidence.test.ts test-bun/scanner-source-listing.test.ts: 21 pass, 0 fail.
- bunx biome lint on the six changed files: no findings. bun run typecheck: exit 0.
- Probes js2 and js3: both scan, every file and operation under its listed path. js-build-entry: declaration tools\build.js.
- Scratch copy (scratchpad/fixes/ts-js/mirror-js): the test fails at HEAD with 'duplicate file path: a/b.js' and fails when any one of these returns to fileName: the inventory, the symbols key, the evidence file, the route application, the importer's directory, the import edge key. It still passes when the parse warning's file, the set of listed import targets, or the build entry declaration returns to fileName.

Follow-up outside this task: plugins/scanners/entry-points/source.ts line 43 resolves a new URL(path, import.meta.url) entry against the parser's spelling of the directory, so a build script with a backslash in its path gets no such entry. The reader is shared by the TypeScript-family scanners and was not changed here.

Not renamed, because the review named two places only: declarations.ts (topLevelDeclarations) and outline.ts (usesRequire, statesModuleBoundary, publishedNames and a local) also call a bare syntax tree source.

Verified on the combined working tree with every TASK-592 change and TASK-580 present: `bun run check` exits 0 (Node 16 pass; Bun 785 pass, 53 skip, 0 fail), no file under `groma/` changed, no changed source or test file exceeds 500 lines.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
A JavaScript file is identified by the path Groma listed. `JavaScriptSource` in `sources.ts` pairs that path with its syntax tree, and the inventory, symbols, operations, HTTP facts, import edges and build entry declarations all use it; the parser name, which rewrites a backslash to a slash, remains only where the one-file compiler program asks its host for the file. The two reproduced layouts scan. Verified by one test (skipped on Windows, which cannot hold the file name) that fails when identity returns to the parser name in six of the sites, and by a cold review. Follow-up outside this task: the shared build entry reader in `plugins/scanners/entry-points/source.ts` resolves a `new URL(path, import.meta.url)` entry against the parser spelling of the directory.
<!-- SECTION:FINAL_SUMMARY:END -->
