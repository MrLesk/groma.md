---
id: TASK-592.5
title: Report every function in a Go directory that redeclares names
status: Done
assignee:
  - '@claude'
created_date: '2026-10-11 16:51'
updated_date: '2026-10-13 18:43'
labels: []
dependencies: []
references:
  - plugins/scanners/go/worker/evidence.go
documentation:
  - docs/scanners/go/index.md
modified_files:
  - test-bun/go-scanner.test.ts
  - plugins/scanners/go/worker/evidence.go
  - plugins/scanners/go/worker/endpoints.go
  - plugins/scanners/go/worker/mounts.go
  - docs/scanners/go/index.md
parent_task_id: TASK-592
type: bug
ordinal: 662000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Example and tutorial directories often hold several `package main` files that are run one at a time with `go run file.go`, so each declares its own `main` and helpers. Read as one package that is a redeclaration, and the worker gives a redeclared function no operation (`evidence.go`). Reproduced with two such files: the second `main` and `helper` vanish together with their calls and an `http.Get` request, while the entry point still names the second file.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Every function with a body in such a directory is an operation with its own calls and HTTP requests.
- [x] #2 A call to a name the directory declares more than once is never attributed to a declaration in another file.
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
1. Guide check (docs/scanners/go/index.md): type errors 'never block source inventory. Invalid syntax still fails the scan.' Nothing puts a directory that redeclares names outside the scanner's contract, so the task proceeds.
2. Reproduce on the worker with TASK-592.4 applied: the second file's main and helper have no operation, their calls and http.Get request are missing, and another file's call to helper is attributed to the first file's helper.
3. evidence.go, declarations: every function declaration with a body records an operation. go/types keeps no object for a function whose name its package already declares, so functionName writes that name out in the form go/types gives the first declaration.
4. evidence.go, one index and one lookup: the declarations walk records every top-level declaration (functions and methods with their operation; bodiless functions, types, variables and constants without one) in declarationsByName under declaredName, the qualified name without the receiver's pointer and type parameters. operationOf(user file, function) is the single lookup for calls (evidence.go), route handlers (endpoints.go) and mounts (mounts.go): a name declared once resolves as before; a name declared more than once resolves to the function in the user's own file when that file declares the name exactly once, else to nothing. The position-keyed map and functionKey are deleted.
   Why the own-file rule: go/types binds every use to the first declaration it read, an accident of file order. No valid build holds two declarations of one name, so in every build that contains the using file as written the use binds to that file's own declaration.
5. mounts.go: a mounted builder without an operation silences nothing (no empty key).
6. Limit, stated in the guide: when the first listed file that declares the name declares a type, variable or constant, go/types binds every use to it and no use reaches the lookup.
7. docs/scanners/go/index.md: one paragraph in Source and evidence stating the rule and the limit.
8. Tests (test-bun/go-scanner.test.ts, one concurrent test with its own temp module):
   - Rule: every function with a body is an operation with its own calls, routes and requests, and a use of a name declared more than once is never attributed to another file. Authority: the reproduced failures in this task and in its cold review.
   - Wrong results caught: the second file's functions, calls or request missing; its call to its helper or to its method (declared with another receiver form) attributed to the first file; its route bound to the first file's handler; a call in a file that declares no such function, or declares the name as a variable, attributed to another file.
   - Gap: no other test has two files declaring one name; the older redeclaration line asserts only the file list.
9. Verify: scratch worker build; audit probes go2 to go5 and go4b; reviewer probes p5b, p5d, p5e, p5g; byte comparison of worker output with the reviewed tree on the repository fixtures, the audit projects and large real modules; GROMA_TEST_GO=$(command -v go) bun test --timeout 20000 test-bun/go-scanner.test.ts.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented. Guide check: nothing in docs/scanners/go/index.md excludes directories that redeclare names ('They never block source inventory. Invalid syntax still fails the scan.'), so the task proceeded.
Rule owners in plugins/scanners/go/worker/evidence.go: declarations records an operation for every function declaration with a body; functionName gives a redeclared function the name go/types would (it keeps no object for it); operationOf(user file, function) is the single lookup for calls (evidence.go), route handlers (endpoints.go) and mounts (mounts.go). A name declared once resolves as before; a name declared more than once resolves to the declaration in the using file when that file holds exactly one, else to nothing. Declarations share a name when go/types qualifies them alike.
Test: one new concurrent test ('Go reports every function of a directory that declares names twice, and binds each use within its own file'). Seen failing before the fix in two steps: first the second file's main and helper were missing from the operations; with operations recorded but the old lookup, the second file's calls and a third file's call were attributed to first.go.
Verification (worker built into scratch with the flags of build.ts, go 1.27.1): audit probe go2 now reports tool.go main and helper with their calls and requests y and z, each file's helper call binds to its own file, dup.go's calls to names declared twice are unresolved. Scratch probes: generics and names declared once resolve as before; a use from another package of a name its package declares twice is unresolved. The four repository Go fixtures give byte-identical worker output before and after both tasks. GROMA_TEST_GO=$(command -v go) bun test --timeout 20000 test-bun/go-scanner.test.ts: 13 pass (15 of 16 full runs; one run had the untouched first test time out at 60 s under machine load 8 and it did not recur in 11 further runs with a process watchdog, cause not established). biome lint on the test file clean, bun run typecheck clean, gofmt and go vet clean for the changed Go files.
Found, not handled: (1) mounts.go still writes silenced[""] when a mounted call's function has no operation, but no function with a body reads that key any more, because every one now owns an operation (scratch probe: route /b of a redeclared setup was dropped next to an unrelated interface-method mount before, and is reported after). (2) The entry point still names one file per main package. (3) A function sharing its name with a package-level variable, constant or type in another file, and duplicate methods whose receivers are written differently, keep the go/types binding. (4) The audit's go1 has link.go as a symlink to vars.go, so f and g are declared twice there: vars.go's functions are now operations and uses from other files are unresolved.

Cold review round. The own-file rule was accepted; two cross-file attributions were reproduced and fixed, and four non-blocking points applied.
B1 (fixed): a method counts as one name however its receiver is written. declaredName drops the receiver's pointer and type parameters from the qualified name that decides 'declared more than once'; the operation's display name is unchanged. The review named the pointer form (probe p5d); the same defect reproduced with type parameter names (job[T] in one file, job[E] in the other), so the one function covers both. p5d: all three calls bind to their own file.
B2 (fixed in the declarations walk): every top-level declaration counts, so types, variables, constants and bodiless functions are recorded without an operation (through the existing source.specSymbols). p5e: 01_func.go binds its own add, 02_value.go is unresolved. Limit kept, stated in the guide and in the operationOf comment: when go/types binds the name to a type, variable or constant (the first listed file declares it so), no use reaches the lookup, so the function's own file is unresolved too (p5e with 02_value.go read first: both unresolved, no cross-file attribution). Lifting it needs the three use sites (call, handlerOperation, mountRouter) to pass package-level objects of any kind and a name for them, about a dozen lines outside the walk; not built.
3 (adopted): one index. operationOf looks up declarationsByName by declaredName(function.Origin().FullName()); functionByPosition, functionKey, the name field and the bound lookup are gone. Worker output is byte-identical to the tree the review read on the four repository Go fixtures, audit go1 to go5, go4 and go4b, golang.org/x/tools v0.49.0 (537 files, 24771 invocations, 10016 resolved), the standard library (1681 files, 79191 invocations) and cmd (988 files, 175905 invocations, 148967 resolved), and byte-identical to a two-index scratch variant with the same naming rule on every probe that repeats names.
4 (applied): the test program registers a route on a repeated handler name and asserts each file's endpoint; seen failing ('first.go /second') with the handler lookup temporarily reverted to the direct map read.
5 (applied): mounts.go skips the silenced write when the builder has no operation; a worker that still writes the empty key gives byte-identical output on every fixture, probe and large module, so nothing depended on it.
Test: the round-1 test was extended, no new test. Seen failing on the round-1 worker source: 'second.go -> first.go' for the pointer-receiver method and 'fourth.go -> third.go' for the variable; the type-parameter form was seen failing with the same sources on a scratch worker built with a pointer-only declaredName.
Verification: go-scanner.test.ts 13 pass; execution-evidence-native 'Go main packages' 1 pass; scanner-source-listing 14 pass; go vet clean; gofmt clean for the changed files; biome lint and typecheck clean; audit go2, go3, go4b, go5 and reviewer p5b, p5d, p5e, p5g as expected. The earlier 60 s timeouts were traced by the reviewer to a go build child whose exit Bun did not deliver under load, before any worker code ran.
Follow-ups outside this task, no code: (a) a builder declared in two files and mounted only from a third reports both builders' routes without the mount prefix (probe p5f2; HEAD did this for one of them). (b) a package-level router variable repeated across example files still follows the go/types binding, so the second file's route is reported under the first file's router prefix (probe p5v; same as HEAD). (c) duplicate methods declared through a receiver alias are not seen as one name.

Verified on the combined working tree with every TASK-592 change and TASK-580 present: `bun run check` exits 0 (Node 16 pass; Bun 785 pass, 53 skip, 0 fail), no file under `groma/` changed, no changed source or test file exceeds 500 lines. Go suite with the toolchain: `GROMA_TEST_GO=$(command -v go) bun test --timeout 20000 test-bun/go-scanner.test.ts`, 13 pass.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
In a directory whose files redeclare names (script style examples run one file at a time), every function with a body is now an operation with its calls and requests. `operationOf` in `evidence.go` is the single lookup for calls, route handlers and mounts: a name the package declares once resolves as before; a name declared more than once, counting every top-level declaration and ignoring how a receiver is written, means the declaration in the using file when that file holds exactly one function of that name, otherwise nothing. Verified by a test covering functions, pointer and generic receivers, a variable of the same name and a route handler, by the audit and review probes, and by byte-identical output on the standard library, `cmd` and golang.org/x/tools against the reviewed version. Limits stated in the guide and the comment: when a variable and a function share a name across files, the call in the function file can stay unresolved depending on file order. Follow-ups outside this task: a builder declared in two files and mounted from a third, a repeated package-level router variable, and duplicate methods declared through a receiver alias.
<!-- SECTION:FINAL_SUMMARY:END -->
