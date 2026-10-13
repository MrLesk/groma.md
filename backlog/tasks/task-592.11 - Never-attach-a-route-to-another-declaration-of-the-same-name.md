---
id: TASK-592.11
title: Never attach a route to another declaration of the same name
status: Done
assignee:
  - '@claude'
created_date: '2026-10-11 16:52'
updated_date: '2026-10-13 18:43'
labels: []
dependencies: []
references:
  - plugins/scanners/python/worker/sources.py
  - plugins/scanners/python/worker/routes.py
  - plugins/scanners/php/src/http.ts
documentation:
  - docs/scanners/python/index.md
  - docs/scanners/php/index.md
modified_files:
  - test-bun/python-scanner.test.ts
  - plugins/scanners/python/worker/sources.py
  - docs/scanners/python/index.md
  - test-bun/php-http.test.ts
  - plugins/scanners/php/src/http.ts
  - docs/scanners/php/index.md
parent_task_id: TASK-592
type: bug
ordinal: 668000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Python and PHP let one file declare a name more than once. Both scanners resolve a route handler that is registered by reference through a per-file map that keeps the last declaration, so the route can land on the wrong one. Python (`definitions` in `sources.py`, read by `resolve_name`): `def view` / `app.add_url_rule("/a", view_func=view)` / `def view` / `app.add_url_rule("/b", view_func=view)` reports both routes on the second `view`, while `/a` serves the first at runtime. PHP (`parents` in `http.ts`): `if (...) { class C extends A {} } else { class C extends B {} }` plus `$app->get("/c", [C::class, "show"])` reports the route on `B::show`. The PHP merge across files already abstains when a class name is declared twice; the path inside one file does not.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Python: a route registered by reference to a name the module declares more than once with `def` or `class` is attached to no declaration. The reproduced `/a` is not attached to the second `view`.
- [x] #2 PHP: a route through a class name the file declares more than once is treated the way the scanner already treats a class name declared in two files, not attached to the last declaration.
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
1. What an unresolved handler reference produces today (probes in scratchpad fixes/python-php, run before any change).
   - Python (routes.py: call_endpoints, entry_endpoints, route_facts): a Flask add_url_rule whose view_func does not resolve reports no endpoint; a FastAPI or Starlette add_api_route/add_route and a Django path() report a blocker on the file (module) operation, the literal prefix then a constrained optional catch-all.
   - PHP (http.ts: served): a handler that names no declared operation is a blocker on the registering operation, (module) for top-level code. A class two files declare with a parent each already ends there.
   The fix must land on exactly these results and add no new one.
2. Python, in worker/sources.py: read_module counts the def and class statements of the module scope with scope_nodes(tree), so a second declaration inside a module-level if or try counts and a method or nested function of the same name does not, and records the names declared more than once as module["redeclared"]. resolve_name returns nothing for a name in that set, before it reads definitions, values or imports. The maps stay complete, so local_app_values, which enumerates top-level functions and resolves no name, is unaffected. No nearest-preceding-definition or flow analysis. Scope: names declared more than once with def or class; a def beside an import of the same name, and two imports of one name, are not handled.
3. PHP, one owner: phpHttpFacts lists every declaration of a named type with the parent it extends (declaredTypes, a list of { type, parent } records, so a Map cannot be built from it by accident). resolveEndpoints builds the one type to parent map in parentsByType beside operationsByName: a type name declared more than once, in one file or in several, has no parent. A declaration without extends counts as a declaration.
4. Guides: one paragraph in docs/scanners/python/index.md (HTTP facts) and one sentence in docs/scanners/php/index.md (Endpoints).
5. Test decisions. Authority for both: the reproduced failures in this task and the decided rule that a name declared more than once names no single declaration.
   - Python, extend the existing test "Python recognizes a Flask route registered with a view function" (its /hello route is the control, and a method named hello beside it fails a count that includes methods). Wrong result caught: /a and /b attached to the second def view, /c attached to the top-level def page when an if branch declares page again, any of them attached to the import that shares the name view, and /hello lost when methods are counted. Gap: no test registers a route by reference to a name declared twice.
   - PHP, extend the existing test "Slim routes to an inherited invokable handler in another file" (its /items route is the control). Wrong result caught: a route through a class declared in both branches of an if in one file attached to the parent of the last declaration, and a route through a class that two files declare, one with extends and one without, attached to that one parent. Gap: before this task no test or fixture declared a class name twice, in one file or across files; the extended test covers both paths through parentsByType.
   - No other tests: unresolved handlers are already covered by the php-http and python-http fixtures.
6. Verify: see each extended test fail before the fix; then bun test on test-bun/python-scanner.test.ts, test-bun/php-http.test.ts, test-bun/php-scanner.test.ts; bunx biome lint on changed TypeScript; bun run typecheck; rerun the audit probes.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented in both scanners; task left In Progress for the orchestrator review.

Python: read_module (plugins/scanners/python/worker/sources.py) counts the def and class statements of the module scope and removes a name declared more than once from definitions, and from imports so resolve_name cannot fall through to an import of the same name. Result is the existing abstention: Flask add_url_rule reports no endpoint; FastAPI, Starlette and Django report the (module) blocker.
PHP: phpHttpFacts lists every named type declaration with its parent (declaredTypes); parentsByType in plugins/scanners/php/src/http.ts builds the only type to parent map and gives a type name declared more than once, in one file or several, no parent. A declaration without extends counts, so class C extends A plus class C in two files is a blocker too (was A::show).

Verification:
- Before the fix, the extended Python test failed with /a and /b on the second def view and /c on the top-level def page; the extended PHP test failed with /drafts and /plain attached to base.php handlers.
- bun test --timeout 20000 test-bun/python-scanner.test.ts: 16 pass. bun test --timeout 20000 test-bun/php-http.test.ts test-bun/php-scanner.test.ts: 18 pass.
- bunx biome lint on http.ts and both test files: clean. bun run typecheck: clean.
- Audit probes: python/merge reports no endpoint (was /a and /b on the second view); php/merge reports GET /c as the (module) blocker (was B::show), the same as the two-file case.
- No worker rebuild needed: both test files build the plugin into a temp directory from source.

Found and not changed (different rule or different owner):
- Python imports map keeps the last of two from-imports of one name with different sources.
- Python resolve_name prefers a module def over an import of the same name whatever their order.
- Python local_app_values iterates definitions: of two top-level functions with one name it read only the last; it reads neither after this change, so decorator routes on an app local to such a function are not reported.
- PHP collectImports lets use function or use const replace a class alias of the same name, which attaches a route to the wrong class.
- PHP: a method declared by one of two declarations of a class still resolves to it, in one file as in two.
- PHP per-file Laravel global patterns keep the last Route::pattern of a name (parameter constraints, not handler resolution).

Criterion 1 narrowed by the orchestrating session after the cold review: the first wording ("attached to the declaration that reference means, or to none") was broader than the decided rule. Two shapes stay as they were and are not part of this task: a `def` followed by an import of the same name, and two imports of one name.

Cold review applied (one blocking Python finding, five accepted points). This supersedes the first three bullets under "Found and not changed" and the Python line above.

1. Python, blocking: removing a twice-declared name from definitions also hid that function from local_app_values, which enumerates top-level functions, so a correct decorator route on an app local to it was lost. read_module records module["redeclared"] and resolve_name returns nothing for a name in it; definitions and imports are complete again. The reviewer factory probes report their routes (factory-seq GET /second, factory-branch GET /a), and all 14 reviewer Python probes give the same output as the reviewer variant worker-alt.
2. Python comments (sources.py rule, test): both reasons are stated. Two defs in sequence depend on where the reference stands, which the scanner does not follow; a def in a branch depends on the code that runs.
3. Python test: the control file has a class with a method named hello. Checked with a worker copy that counts module["bindings"]: /hello disappears, so the test fails for a count that includes methods.
4. Python test: comment beside the import says it names an operation only because service.py of the shared python-project fixture declares dispatch.
5. PHP test: class PlainAction {} moved into base.php, so the test covers the merge across files and the extends-plus-plain shape; expected output unchanged. Plan sentence corrected.
6. PHP: declaredTypes entries are { type, parent } records. Checked: new Map(files.flatMap(file => file.declaredTypes)) fails to compile (TS2769).
Not done, as directed: a def beside an import of the same name, and two imports of one name.
Python guide paragraph: adds that the rule concerns references only and decorator routes are unaffected, including those on an application assigned in the body of a function declared twice.

Verification after the review changes:
- bun test --timeout 20000 test-bun/python-scanner.test.ts: 16 pass.
- bun test --timeout 20000 test-bun/php-http.test.ts test-bun/php-scanner.test.ts: 18 pass. php-http.test.ts alone: 10 pass in 4 of 4 runs.
- bunx biome lint plugins/scanners/php/src/http.ts test-bun/php-http.test.ts test-bun/python-scanner.test.ts: clean. bun run typecheck: clean.
- Audit probes: python/merge reports no endpoint; php/merge reports GET /c as the (module) blocker and GET /a on A::show.
- Observed, not changed: php-scanner.test.ts, which this task does not modify, timed out one test at 20 s in 4 of 8 early runs on the loaded machine (load average 13 to 16, eleven other bun processes), a different test each time; it then passed 20 of 20 runs. Each test passes alone. Not compared against HEAD.

Correction to the count above: the php-scanner.test.ts timeouts were in 5 of the first 11 runs that included the whole file, then 0 of 20 (10 of those 20 ran the file without its two tests that use the async rejects matcher).

Verified on the combined working tree with every TASK-592 change and TASK-580 present: `bun run check` exits 0 (Node 16 pass; Bun 785 pass, 53 skip, 0 fail), no file under `groma/` changed, no changed source or test file exceeds 500 lines.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
A name that one file declares more than once names no single declaration, so a route registered by reference to it resolves to nothing, the way each scanner already treats an unresolved reference. Python: `read_module` in `sources.py` records the redeclared names and `resolve_name` abstains for them; the maps of definitions and imports stay complete, so decorator routes of an application local to a function declared twice are still reported. PHP: `parentsByType` in `http.ts` builds the only type to parent map from every declaration, with or without `extends`, in one file or several, and a type declared twice has no parent. Verified by one extended test per scanner with controls for a same-named method and for the merge across files, the audit probes, and a cold review whose blocking finding (lost factory routes) is fixed. Unchanged and outside this task: a `def` beside an import of the same name, two imports of one name, and a PHP `use function` that replaces a class alias.
<!-- SECTION:FINAL_SUMMARY:END -->
