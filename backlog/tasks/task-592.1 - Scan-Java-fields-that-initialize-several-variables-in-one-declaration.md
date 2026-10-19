---
id: TASK-592.1
title: Scan Java fields that initialize several variables in one declaration
status: Done
assignee:
  - '@claude'
created_date: '2026-10-11 16:51'
updated_date: '2026-10-11 20:43'
labels: []
dependencies: []
references:
  - 'https://github.com/MrLesk/groma.md/issues/127'
  - plugins/scanners/java/java/md/groma/scanner/Declarations.java
documentation:
  - docs/scanners/java/index.md
modified_files:
  - test-bun/java-scanner.test.ts
  - plugins/scanners/java/java/md/groma/scanner/Declarations.java
parent_task_id: TASK-592
type: bug
ordinal: 658000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
GitHub issue 127: `groma scan` fails with "java: duplicate operation id: <file>@<offset>" on any class-level declaration that initializes two or more variables, such as `private int a = 1, b = 2;` or `static final int A = f(1), B = f(2);`. The worker builds an operation id as the file plus the start offset of the syntax tree (`identity` in `Declarations.java`), and javac gives every variable of one declaration the start offset of the whole declaration. Each initialized field is an operation, so the ids collide and the host rejects the whole Java scan. A probe with 42 operations showed 9 collisions, all of this shape: plain, static final, interface constant, record static, annotated and array fields, and fields in anonymous and local classes. Methods, lambdas, initializer blocks and enum constants were unique. TASK-417 recorded this on 2026-09-19 as an out-of-scope follow-up and no task was created.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A class-level declaration that initializes two or more variables scans, and each initializer is its own operation with its own id.
- [x] #2 A call inside one initializer is attributed to the operation of that variable, not to a sibling of the same declaration.
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
1. Reproduce: compile the worker sources to scratch and run the audit probe (Probe.java). Expect 42 operations with 33 unique ids, all 9 collisions being class-level declarations that initialize several variables.
2. Fix in one place, `identity` in plugins/scanners/java/java/md/groma/scanner/Declarations.java, the only function that turns an operation's tree into an id. javac starts every variable of one declaration at the declaration, so the source position alone cannot tell them apart. A variable therefore adds its name to the id (`file@offset#name`). Names within one declaration are distinct, and operation ids stay opaque strings (docs/scanners/evidence.md), so no consumer changes. The initializer's own offset is not used: a lambda initializer is its own operation at that offset.
3. No change to `Uses`: it attributes a call through `operationAt`, an identity map from tree to id, so once the ids differ a call inside one initializer already belongs to that variable's operation. Verify with the test and the probe.
4. Check `declareOperation`: every caller passes a method path, and methods never share a start offset, so it cannot meet this situation. Report anything else found there without changing it.
5. Docs: docs/scanners/java/index.md does not describe ids and its statement that field initializers are initializer code stays true, so no documentation change.
6. Verify: bun test --timeout 20000 on the five test-bun/java-*.test.ts files, bunx biome lint test-bun/java-scanner.test.ts, bun run typecheck, and the probe again (42 unique of 42).

Test decision (one new test, no fixture change):
- Rule and authority: each initialized variable of one class-level declaration is its own operation, and a call inside an initializer belongs to that variable's operation. Authority: the reproduced failure in this task (GitHub issue 127), acceptance criteria 1 and 2.
- Wrong result it catches: the worker reports two operations under one id, so parsing the observation throws `duplicate operation id` and the Java scan yields nothing; or a call in the second initializer is reported under the first variable.
- Coverage gap: no Java test declares several initialized variables in one field declaration, and no assertion names a field initializer as a caller. Smallest test: one `test.concurrent` in test-bun/java-scanner.test.ts that writes `static int first = low(), second = high();` over its temporary copy of the java-maven fixture, as the neighbouring tests do, and checks that each call's caller is its own variable's operation. The shared fixture stays unchanged because tests outside this lane also read it. The existing overload test is not extended: its claim is call resolution, not operation identity.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Reproduced: the worker compiled from the repository sources reported 42 operations with 33 unique ids for the audit probe; all 9 collisions were class-level declarations that initialize several variables. The new test failed before the fix with `duplicate operation id: src/main/java/Caller.java@122`.

Changed: `identity` in plugins/scanners/java/java/md/groma/scanner/Declarations.java appends `#` and the variable name when the tree is a variable, with a comment stating that javac starts every variable of one declaration at the declaration. `Uses`, `Http` and `OkHttpRequests` are unchanged: they look operations up by tree identity, so a call inside one initializer belongs to that variable's operation once the ids differ.

Verified: probe after the fix has 42 unique ids of 42, with `f(1)` under `<initialize A>` and `f(2)` under `<initialize B>`, and every fact other than the ids is unchanged. The packaged plugin (buildPackage into scratch, then the plugin's scan) scans the repro project of issue 127. `bun test --timeout 20000` on the five test-bun/java-*.test.ts files: 23 pass. `bunx biome lint test-bun/java-scanner.test.ts` and `bun run typecheck` are clean. No documentation change: the Java guide does not describe ids.

Found, not changed (outside this task): `declareOperation` cannot meet the shared start offset, because every caller passes a method. It has a different collision: a Feign, Spring HTTP interface, MicroProfile or Retrofit interface method that carries a request annotation and also has a body (`default` or `static`) becomes an operation in `visitMethod` and again in `declareOperation` under the same id, and the host rejects the scan with `duplicate operation id`. Reproduced with a `@FeignClient` interface and a Retrofit interface whose `default` method is annotated.

Not covered: source javac itself rejects, such as `int a = 1, a = 2;`, still yields one id twice, as it did before.

Review outcomes (cold review, no blocking findings): the comment above `identity` now also says why the initializer's start cannot stand in for the name (a lambda initializer is itself an operation that starts there), and the test is titled "each variable of one Java field declaration is its own operation and caller" so it names both criteria. `bun test --timeout 20000 test-bun/java-scanner.test.ts`: 8 pass. The modified-file list is unchanged.

Verified on the combined working tree with every TASK-592 change and TASK-580 present: `bun run check` exits 0 (Node 16 pass; Bun 785 pass, 53 skip, 0 fail), no file under `groma/` changed, no changed source or test file exceeds 500 lines.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Fixes GitHub issue 127. `identity` in `Declarations.java` builds an operation id from where a tree starts; javac starts every variable of one declaration at the declaration, so a variable now also carries its name (`file@offset#name`). A class-level declaration that initializes several variables scans, each initializer is its own operation, and a call inside one belongs to that variable. Verified by a regression test that throws "duplicate operation id" on the old worker, by a 42-operation probe (33 unique ids before, 42 after), by the issue repro through the packaged plugin, and by a cold review that ran 25 variations. Ids of single-variable fields also gain `#name`; ids are opaque and nothing parses them. Not included: a release of the Java scanner package.
<!-- SECTION:FINAL_SUMMARY:END -->
