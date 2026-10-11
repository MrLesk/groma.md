---
id: TASK-592.13
title: Scan declarative Java HTTP clients whose annotated methods have a body
status: Done
assignee:
  - '@claude'
created_date: '2026-10-11 16:59'
updated_date: '2026-10-11 20:43'
labels: []
dependencies: []
references:
  - plugins/scanners/java/java/md/groma/scanner/Declarations.java
  - plugins/scanners/java/java/md/groma/scanner/Http.java
  - plugins/scanners/java/java/md/groma/scanner/RetrofitRequests.java
documentation:
  - docs/scanners/java/index.md
modified_files:
  - test-bun/java-http.test.ts
  - plugins/scanners/java/java/md/groma/scanner/Declarations.java
  - plugins/scanners/java/java/md/groma/scanner/Http.java
  - plugins/scanners/java/java/md/groma/scanner/RetrofitRequests.java
  - docs/scanners/java/index.md
parent_task_id: TASK-592
type: bug
ordinal: 670000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Found while fixing TASK-592.1. A declarative HTTP client interface method that carries a request annotation and also has a body (a `default` method) becomes an operation twice under one id: once in `Declarations.visitMethod` because it has a body, and once in `Declarations.declareOperation`, which the client readers call for every annotated method on the assumption that it has no body. The host rejects the whole Java scan. Reproduced with a Feign client ("duplicate operation id: src/main/java/demo/FeignDefault.java@278") and a Retrofit interface ("RetrofitDefault.java@122"). Spring HTTP interfaces and MicroProfile REST clients go through the same call (`Http.clientRequestsOf`, `Http.microprofileRequestsOf`, `RetrofitRequests.add`) and were not run; a `static` annotated method is expected to behave the same. Whether such a method sends a request depends on the framework: some run a default method as ordinary code and ignore its annotation.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 An interface method that carries a request annotation and has a body scans and is one operation.
- [x] #2 No request is reported for a method that its client framework runs as ordinary code instead of sending a request.
- [x] #3 The Java guide states what the scanner reports for annotated client methods that have a body.
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
1. Reproduce every shape: a default and a static annotated method in a Feign client, a Spring HTTP interface, a MicroProfile REST client and a Retrofit interface. Each one is an operation in `Declarations.visitMethod` (it has a body) and again in `Declarations.declareOperation`, under one id, so the host rejects the scan.

2. What each client does with an annotated method that has a body, read from its own source (default branch on 2026-10-11):
- Feign (OpenFeign/feign master 0c8d2c0c14, core/src/main/java/feign/Contract.java, `BaseContract.parseAndValidateMetadata(Class)`): static and default methods are skipped, and `ReflectiveFeign.ParseHandlersByName.apply` gives a default method a `DefaultMethodHandler` that runs its body. Spring Cloud OpenFeign's `SpringMvcContract` (main f5b8311bdb) extends `Contract.BaseContract` and keeps that loop. Result: no request.
- Retrofit (square/retrofit trunk 50b452440d, retrofit/src/main/java/retrofit2/Retrofit.java, `create`): the proxy handler calls `invokeDefaultMethod` for a default method instead of loading a service method, and `validateServiceInterface` skips default and static methods. Result: no request.
- Spring HTTP interface (spring-projects/spring-framework main c5ed46fce9, spring-web/.../web/service/invoker/HttpServiceProxyFactory.java): `createClient` selects every method that carries `@HttpExchange`, and `HttpServiceMethodInterceptor.invoke` looks the method up among those first and runs a default method only when it is not one of them. Result: an annotated default method sends its request.
- MicroProfile REST Client (eclipse/microprofile-rest-client main 90f4af87b0, spec/src/main/asciidoc/clientexamples.asciidoc): the specification names default methods only as `@ClientHeaderParam` compute methods and no TCK interface annotates one. Implementations differ: Jersey (eclipse-ee4j/jersey 4.x 4730655635, `RestClientModel.parseMethodModels`) skips default and static methods and runs a default method, while CXF (apache/cxf main cca9715fb0, `ResourceUtils.evaluateResourceClass` and `ClientProxyImpl.invoke`) makes every annotated method a resource operation and invokes a default method only when it has none. Result: not established, so the scanner abstains and reports no request.
- A static interface method, for every client: no proxy receives the call. Checked with a java.lang.reflect.Proxy experiment (the handler never sees it), and javac rejects a call through an instance.

3. Owner of "a client method with a body is not declared a second time": `Declarations.declareOperation`, the one call every client reader makes. It returns the operation the method already is and declares only a method without a body. A reader added later cannot register a second operation.

4. `identity` in Declarations.java becomes the single place that turns a tree into an id: it takes the compilation unit, and `declareOperation` uses it instead of building `file@offset` by hand.

5. Each reader decides whether a method with a body sends a request, for its own framework:
- `Http.clientRequestsOf` (Feign and Spring HTTP interface) skips a method its client runs as ordinary code through one predicate, `runsAsCode`: every method with a body for Feign, every body except a default method's for an HTTP interface. The default method's request joins its existing operation through `declareOperation`.
- `Http.microprofileRequestsOf` and `RetrofitRequests.visitClass` skip every method with a body.

6. Guide: docs/scanners/java/index.md states, after the list of clients, what is reported for an annotated client method with a body. The sentence that such a method has no body moves there from the first bullet.

7. Verify: the probes for every shape, bun test --timeout 20000 on the five test-bun/java-*.test.ts files, bunx biome lint test-bun/java-http.test.ts, bun run typecheck.

Test decision (one new test in test-bun/java-http.test.ts, no fixture change):
- Rule and authority: an annotated client method with a body is one operation, and it reports a request only where its client sends one, on that operation. Authority: the reproduced failure in this task and acceptance criteria 1 and 2.
- Wrong result it catches: the scan throws `duplicate operation id`; a request row for a default or static method of a Feign, MicroProfile or Retrofit client or for a static method of an HTTP interface; or the HTTP interface default method's request missing or on another operation.
- Coverage gap: no Java test has an annotated client method with a body. Smallest test: one inline source with the four clients, each with a method without a body, a default one and a static one, asserting which operation each reported request belongs to. The existing MicroProfile and Retrofit tests state other rules (configured base, Retrofit is not JAX-RS), and the fixture test names a request's owner only by file, so it cannot show which operation a request joins.

8. `declareOperation` registers a method it declares in `operationAt`, so that one map answers whether a method already is an operation, and the separate set of declared ids is gone. Its parameter is named `method`, because the check works only on the method's own tree.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Reproduced with the worker built from the repository sources: a default and a static annotated method each gave `duplicate operation id` in a Feign client, a Spring HTTP interface, a MicroProfile REST client and a Retrofit interface (FeignDefault.java@278, FeignStatic.java@277, ExchangeDefault.java@252, MicroProfileDefault.java@248, RetrofitDefault.java@122, RetrofitStatic.java@121).

The new test was seen failing twice: before any change with `duplicate operation id: src/main/java/Clients.java@69`, and with only the `declareOperation` change in place with seven request rows too many (the default and static methods of the Feign, MicroProfile and Retrofit clients and the static method of the HTTP interface). With the readers changed it passes. In a scratch copy without the `declareOperation` guard the HTTP interface's default method is a duplicate again, so the test also holds the owner.

Changed: `Declarations.declareOperation` returns the operation a method with a body already is, and builds the id of a method without a body through `identity`, which takes the compilation unit and is the only place that turns a tree into an id. `Http.clientRequestsOf` skips methods its client runs as code (`runsAsCode`), `Http.microprofileRequestsOf` and `RetrofitRequests.visitClass` skip every method with a body, and the guide states the rule after the list of clients.

Verified: after the change every probe scans, each method with a body is one operation, and the only request on such a method is the HTTP interface's default method, on its existing operation. A method without a body that declares four requests is still declared once. The worker's output for test/fixtures/java-http and for the TASK-592.1 field probe is byte-identical to the output before this task. `bun test --timeout 20000` on the five test-bun/java-*.test.ts files: 24 pass. `bunx biome lint test-bun/java-http.test.ts` and `bun run typecheck` are clean.

Declarations.java also carries TASK-592.1's change. Its text after TASK-592.1 alone is kept in the session scratch directory as fixes/java/Declarations.after-592.1.java, because the two tasks are committed separately.

Not changed: in an HTTP interface a `@GetMapping` on a method, and in a Feign client a `@GetExchange`, are still read as that client's request, as they were for methods without a body. Which annotation family each client honours is outside this task.

Review outcomes (cold review, no blocking findings; the reviewer re-read the Feign, Spring, Retrofit, Jersey and CXF sources and the four framework claims hold):
- test-bun/java-http.test.ts: the title and the comment say only Spring is known to send the request of an annotated default method and MicroProfile is not established, instead of claiming that only Spring sends it. The default method in the test source is named `defaulted`, not `coded`, because one of them is in the expected list of sent requests.
- `declareOperation` states the caller's duty: the reader decides, for its framework, whether a method with a body sends a request before it asks for the operation.
- `declareOperation` registers the method it declares in `operationAt` and the `declared` set is deleted, so one map and one check answer whether a method already is an operation. Checked every reader of `operationAt`: `Declarations.visitMethod` and `Uses.scan` finish before any client reader runs (Main scans declarations, then uses, then the HTTP readers); `Http.endpointsOf` and `Http.springEndpoints` look up members of classes only, while `declareOperation` is called for members of other types only; `Http.operation` and `OkHttpRequests.operation` walk up from a client call, and a method without a body can enclose a call only in an annotation argument, which Java does not allow. Nothing changes for them.
- The parameter of `declareOperation` is named `method`: an annotation starts at the same offset as its method, so only the method's own tree may be passed.

Verified after these changes: the nine client probes, the test/fixtures/java-http scan and the 42-operation field probe give byte-identical worker output to before the review changes. `bun test --timeout 20000` on the five test-bun/java-*.test.ts files: 24 pass. `bunx biome lint test-bun/java-http.test.ts` and `bun run typecheck` are clean. The modified-file list is unchanged.

Verified on the combined working tree with every TASK-592 change and TASK-580 present: `bun run check` exits 0 (Node 16 pass; Bun 785 pass, 53 skip, 0 fail), no file under `groma/` changed, no changed source or test file exceeds 500 lines.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
A declarative client interface method with a request annotation and a body (`default` or `static`) was registered as an operation twice and failed the whole Java scan. `Declarations.declareOperation` now returns the operation a method with a body already is, one map answers whether a method is an operation, and `identity` is the only id builder. Each client reader reports a request for such a method only where its framework sends one, established from the framework sources: none for Feign, Retrofit and MicroProfile (implementations disagree there, so the scanner abstains), kept for a Spring HTTP interface `default` method on its own operation, none for any `static` method. The guide states this. Verified by one test that fails on the duplicate and on seven false or lost request rows, nine probes, byte-identical output on the existing HTTP fixture, and a cold review that re-read the upstream sources. Follow-up outside this task: which annotation family each client honours (`@GetMapping` in an HTTP interface) is unchanged.
<!-- SECTION:FINAL_SUMMARY:END -->
