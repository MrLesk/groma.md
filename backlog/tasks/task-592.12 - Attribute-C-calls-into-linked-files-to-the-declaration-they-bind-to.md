---
id: TASK-592.12
title: Attribute C# calls into linked files to the declaration they bind to
status: Done
assignee:
  - '@claude'
created_date: '2026-10-11 16:52'
updated_date: '2026-10-13 18:43'
labels: []
dependencies: []
references:
  - plugins/scanners/csharp/dotnet/OperationEvidence.cs
  - plugins/scanners/csharp/dotnet/ProjectGraph.cs
documentation:
  - docs/scanners/dotnet-csharp/index.md
modified_files:
  - plugins/scanners/csharp/dotnet/test/CoverageTests.cs
  - plugins/scanners/csharp/dotnet/OperationId.cs
  - plugins/scanners/csharp/dotnet/OperationEvidence.cs
  - docs/scanners/dotnet-csharp/index.md
  - test/fixtures/csharp-linked-file/First/First.csproj
  - test/fixtures/csharp-linked-file/Second/Second.csproj
  - test/fixtures/csharp-linked-file/Second/Use.cs
  - test/fixtures/csharp-linked-file/Shared/Linked.cs
parent_task_id: TASK-592
type: bug
ordinal: 669000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
A source file linked into several projects is declared once, from the first project that compiles it (`ProjectGraph.cs`), but calls from the other projects find their target by source position. When the projects define different `DefineConstants` and the file has `#if` branches, one position can hold different declarations. Reproduced: with `#if` around a method name, the call `Shared.Cond.F()` from the second project was attached to the operation named `Shared.Cond.G()`, and a call to a method that exists only under the constants of the second project was dropped without a trace.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A call into a linked file is attached only to the operation of the declaration it binds to.
- [x] #2 A call whose target the declaring compilation does not contain is reported as unresolved, not dropped and not attached to another declaration.
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
Findings before the change
- Reproduced with the audit probe cs3: the call Shared.Cond.F() from project B is attached to operation:Shared/Cond.cs:49:8875, named Shared.Cond.G(), and the call Shared.Cond.OnlyFlag() is missing from the invocations.
- Cause: OperationEvidence.Invocations looked a call's target up by operation id alone. An id is file + start position + syntax kind. A file that several projects compile is analyzed once, by the first project, so the id of a declaration as another project parses the file can name another declaration in the analyzed file, or none.
- What an unresolved call looks like in this scanner: a ScanInvocation row with unresolved true, emitted for interface and virtual calls, so far always with one target. Calls with type errors and calls that reach no repository operation are not emitted. The evidence contract (packages/scanner and the worker's own ScanObservation.Create) allows a row without targets only when it is unresolved; the Go, PHP and JavaScript scanners emit that row. A call whose target the analyzed file does not declare therefore becomes: targets empty, unresolved true, same line and member.

Approach (the rule has one owner: OperationEvidence.Invocations)
1. Identity of a declaration (OperationId.Identity): its id, which is where it starts and what kind of node it is, and the name written in the declaration (the identifier of a method, constructor or local function; none for other operations, which no call names). Both parts are read from the declaration's own syntax. Nothing a compilation resolves is part of it, so two projects that parse a declaration alike agree on it whatever each can bind. Parameters and bodies are left out on purpose: overloads start at different positions, and a member whose parameters or body differ between projects is still the one member written at that position.
2. OperationEvidence keys its operations by that identity. Extract builds the key from each operation's own node.
3. Call side (Extract): OperationId.DeclarationOf gives the target's own declaration and its id, as the project that declares the target parses the file; null outside repository source. IsExecutable, the syntactic rule ExecutableMethod also uses, tells whether that declaration is an operation at all, so a target without a body stays unreported as before. The call records the identity of that declaration. No second semantic binding takes place.
4. OperationEvidence.Invocations: a call names its target only when an operation with that identity exists. Otherwise the row carries no target and is unresolved.
5. OperationId.OfMethod stays a position-only id for the HTTP handler lookup and says so.
6. Guide docs/scanners/dotnet-csharp/index.md: one paragraph in Evidence.

Not changed: no per-project analysis of a linked file, no new id format, no worker protocol change. The HTTP handler lookup (HttpEndpoints.Handler) keeps its position-only id; recorded as a follow-up in the notes.

Test decisions
- Rule: a call into a file that several projects compile names a target only when the analyzed file holds the declaration the call binds to; otherwise it is reported unresolved without a target. The identity of a declaration does not depend on what a project can bind. Authority: the reproduced failure in this task (AC 1 and 2) and the regression the cold review reproduced (probe v2c).
- Wrong results the test detects: (a) a call bound to the method under FLAG is attached to the operation of the other method at that position; (b) a call to a method only the calling project declares is absent from the invocations; (c) a call to a method both projects read alike loses its target because only one of them can bind its parameter type, or because the fix abstains for every linked file.
- Coverage gap: CoverageTests.ALinkedFileKeepsEveryProjectAndIsAnalyzedOnce checks roots and single analysis with identical constants and has no call into the linked file; no test compiled a linked file under different constants or usings.
- Smallest test: one xunit Fact, CoverageTests.ACallIntoALinkedFileNamesOnlyTheDeclarationItBindsTo, over a fixture of its own, test/fixtures/csharp-linked-file: two projects, one linked file, three calls. The fixture holds nothing else.
- No Bun test: test-bun/csharp-*.test.ts run only against a staged package (GROMA_TEST_CSHARP_PACKAGE) and cover adapter and core integration; the rule lives in the worker, whose rules the xunit tests cover.

Verification
- dotnet test for the worker; the new test seen failing against the unchanged source and against the first, rejected identity.
- Rebuild the local worker with bun scripts/package-csharp-scanner.ts, rerun the Bun C# tests against the staged package and the audit harness on cs1, cs2 and cs3.
- Diff complete worker output against HEAD on cs1 to cs4, the reviewer's v1 to v6, the C# fixtures, the worker's own source and a large local C# repository: only the defect cases may differ.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implementation (2026-10-11)
- plugins/scanners/csharp/dotnet/OperationEvidence.cs: Invocations emits every pending call. It names the target only when the operation at the target's id has the name of the method the call binds to; otherwise the row has no target and is unresolved. TargetOperation computes that id and name on the call side with ExecutableMethod on the target's own declaration, in the compilation that holds it. Name is the one place that formats an operation's method name. The comment on calls with type errors now says they are not reported.
- plugins/scanners/csharp/dotnet/OperationId.cs: NodeOfMethod split out of OfMethod; null for a file outside the repository.
- plugins/scanners/csharp/dotnet/test/CoverageTests.cs: one new Fact.
- docs/scanners/dotnet-csharp/index.md: one paragraph in Evidence.

Design note
- A first idea, comparing the display name of the call's own target symbol, was dropped before any code: a static-form call of a C# 14 extension block member (Ext.Len("a")) binds to the implementation method Shared.Ext.Len(string), while the operation is named Shared.Ext.extension(string).Len(). That call attaches today and would have lost its target. Naming the target through its declaration, the way Extract names an operation, keeps it.

Verification
- Red before the change: dotnet test --filter ACallIntoALinkedFileNamesOnlyTheDeclarationItBindsTo failed at Assert.True(Call("Flagged").Unresolved): the call was attached, resolved, to the operation named G.Linked.Plain(). In a scratch copy of the unchanged source with the two members swapped, Assert.Single failed for Extra: no such invocation.
- Green after: dotnet test plugins/scanners/csharp/dotnet/test/Groma.CSharpScanner.Tests.csproj, 31 passed, 0 failed.
- Local worker rebuilt with: bun scripts/package-csharp-scanner.ts <scratch>/fixes/csharp/package (rewrites the ignored plugins/scanners/csharp/dist and plugins/scanners/csharp/node_modules/@groma/scanner-csharp-darwin-arm64).
- Audit harness (bun run.ts csharp cs3 --ops --inv): B.UseFlag.Go() -> [] member=F unresolved=true and -> [] member=OnlyFlag unresolved=true; the calls from project A to G and OnlyPlain keep their targets. cs1 stays at 104 operations and 15 invocations, cs2 at 19 and 7.
- Complete worker output before and after, byte for byte: identical for cs1, cs2, the fixtures csharp-operations, csharp-http, csharp-duplicates and csharp-tokens, the worker's own source, an identical-constants linked-file probe (interface and abstract calls, primary constructors, generics, both extension forms, partial methods, a caller that reaches the linked file through a project reference), a graph with two projects of one assembly name, and /Users/alex/projects/MassTransit (22254 operations, 16830 invocations, 4414 files; about 20 s before and after). Only cs3 and the test's own world differ, in the two calls each.
- GROMA_TEST_CSHARP_PACKAGE=<scratch>/fixes/csharp/package bun test --timeout 20000 test-bun/csharp-*.test.ts: 9 passed. Without the variable: 2 passed, 7 skipped.
- No TypeScript changed, so no Biome or typecheck run. bun run check not run, as the lane rules say.

Open for the orchestrator
- This scanner had no row without targets before. The guide said calls that reach no repository operation are not reported; AC 2 asks for a report, so the guide now states the exception.
- Follow-up, not changed: HttpEndpoints.Handler resolves a method group handler through the same position-only id. Probe: with FLAG in project B, app.MapGet("/flag", Shared.Cond.F) is reported as an endpoint of operation:Shared/Cond.cs:49:8875, named Shared.Cond.G(). An endpoint has no unresolved form, so the choice there is to report none.

Cold review (2026-10-11), one round, and the changes it caused
- Blocking 1, accepted: the first identity compared the operation's display name, which holds parameter types as each project binds them. A call into a linked file lost a correct target whenever only one of the projects could bind a parameter type (reviewer probes v2, v2b, v2c, v2d; v2c builds with the SDK and uses no #if). Replaced by a syntactic identity, OperationId.Identity: the id plus the name written in the declaration. Operations are keyed by it and the call side reads it from the target's own declaration node. v2, v2b, v2c and v2d are byte-identical to HEAD again.
- Blocking 2, gone: the call side no longer rebinds the target's declaration, so no hidden step protects a result. The static form of a C# 14 extension block member keeps its target because the member and its static form share one declaration node, and the identity is read from that node (probe cs4, byte-identical to HEAD).
- 3: OperationId.OfMethod now says it is a position only. The handler stays as it is, see the follow-up below.
- 4: gone with the helper. The call side needs no compilation, so a target whose assembly Roslyn hands out as a non-source symbol is no longer skipped. Probe v5 (two projects with one assembly name) is byte-identical to HEAD again; the first fix had dropped two calls there.
- 5: the helper TargetOperation is gone. Extract builds the pending call with named arguments.
- 6: the guide paragraph names the cause as projects parsing the file differently, with DefineConstants as the example, and scopes the unresolved row to a call into a method the calling project declares with a body.
- 7: the test uses a fixture of its own, test/fixtures/csharp-linked-file, with nothing else in it. Its method Same is the control for the regression: only the calling project has the usings that bind its parameter type, and the call keeps its target.
- 8: the id of a method's declaration is built in one place, OperationId.DeclarationOf.
- Also changed for the new call side: ExecutableMethod now takes its syntactic rule from IsExecutable, which the call side uses too, so the rule for what holds code has one owner. Output is byte-identical on every probe that does not hold the defect.

Final identity
- OperationId.Identity = (id, written name): the id is file + start position + syntax kind of the declaration node, the written name is the identifier of a method, constructor or local function declaration.
- It cannot split one declaration between projects that parse it alike, because every part is read from the file's text and nothing bound is consulted. When #if changes the first token of a declaration (an attribute or the first modifier), the declaration starts elsewhere for that project, the ids differ, and the call is reported unresolved (probe v1, Attr and Mod; HEAD dropped these calls).
- It cannot merge two declarations: within one parse two nodes of one kind never start at the same position, and across two parses of one file the same start, kind and written name is the one member written there. Only its parameters, body or enclosing type name can vary under #if, and those do not make it another source declaration.

Verification after the review
- dotnet test plugins/scanners/csharp/dotnet/test/Groma.CSharpScanner.Tests.csproj: 31 passed, 0 failed.
- The new test fails against the unchanged source (Assert.True(Call("Flagged").Unresolved): attached to Shared.Linked.Plain()) and against the first identity (Assert.False(Call("Same").Unresolved)); both run in a scratch copy.
- Mutations of the final source in a scratch copy, each failing at least one xunit test: position-only lookup, a missing declaration dropped instead of reported, another name reported but an empty position dropped, abstain for every call (all four: the new test), the bound symbol's name instead of the written name and no IsExecutable check (both: OperationTests.NestedProjectPreservesCanonicalCallsWithoutClaimingRuntimeDispatch), no repository check (CoverageTests.DependencySourcesOutsideRepositoryRemainCompilationContext).
- Worker rebuilt and restaged: bun scripts/package-csharp-scanner.ts <scratch>/fixes/csharp/package. GROMA_TEST_CSHARP_PACKAGE=<that package> bun test --timeout 20000 test-bun/csharp-*.test.ts: 9 passed.
- Complete worker output against HEAD, byte for byte, with the rebuilt worker. Identical: cs1 (104 operations, 15 invocations), cs2 (19, 7), cs4, the reviewer's v2, v2b, v2c, v2d, v4 and v5, the fixtures csharp-operations, csharp-http, csharp-duplicates and csharp-tokens, the worker's own source, and /Users/alex/projects/MassTransit (22254 operations, 16830 invocations, 4414 files). Different only in the defect cases: cs3 (F and OnlyFlag from B unresolved, A's calls keep their targets), v3 and v6 (the same through a project reference and with a repeated call), v1 (OnlyFlag, Attr and Mod unresolved; Body, Parse, Ret, both Over, Echo, Ext, CallHook, Half, the constructor and Get keep their targets), and the new fixture.
- Audit harness through the adapter and the contract parse: cs1 104 and 15, cs2 19 and 7, cs3 29 operations and 5 invocations with F and OnlyFlag unresolved.

Follow-up, not part of this task
- HttpEndpoints.Handler resolves a method group handler through OperationId.OfMethod, which is a position only. Probe v4: with FLAG in project B, app.MapGet("/flag", Shared.Cond.F) is reported as an endpoint of the operation named Shared.Cond.G(). Reviewer's estimate: about 15 lines in four files; report no endpoint when the declarations disagree, because an endpoint has no unresolved form.

Verified on the combined working tree with every TASK-592 change and TASK-580 present: `bun run check` exits 0 (Node 16 pass; Bun 785 pass, 53 skip, 0 fail), no file under `groma/` changed, no changed source or test file exceeds 500 lines. C# suites: `dotnet test plugins/scanners/csharp/dotnet/test/Groma.CSharpScanner.Tests.csproj`, 31 passed; the seven `test-bun/csharp-*.test.ts` files against the staged package, 9 pass.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
A file linked into several projects is analyzed once, and a call from another project found its target by position only. `OperationId.Identity` now identifies a declaration by its id (file, start, syntax kind) plus the name written in the declaration, all read from syntax, and a call names its target only when the analyzed file holds that declaration; otherwise the call is reported unresolved without a target instead of being attached to another member or dropped. Nothing a compilation resolves is part of the identity, so projects that bind a parameter type differently still agree. Verified by a test on its own fixture `test/fixtures/csharp-linked-file` with a control for that case, eight mutations, and worker output byte-identical to HEAD on the fixtures, the worker source and a large public codebase (22254 operations) except in the defect cases. Follow-up outside this task: `HttpEndpoints.Handler` still looks an endpoint handler up by position only (about 15 lines in four files; report no endpoint when the declarations disagree). The xunit suite is not part of `bun run check`.
<!-- SECTION:FINAL_SUMMARY:END -->
