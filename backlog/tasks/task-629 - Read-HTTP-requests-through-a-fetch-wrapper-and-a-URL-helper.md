---
id: TASK-629
title: Read HTTP requests through a fetch wrapper and a URL helper
status: Done
assignee: []
created_date: '2026-10-25 11:00'
updated_date: '2026-10-25 14:14'
labels: []
dependencies: []
references:
  - plugins/scanners/http-values.ts
  - plugins/scanners/http-clients.ts
  - docs/scanners/typescript/index.md
modified_files:
  - plugins/scanners/http-values.ts
  - plugins/scanners/http-forwarding.ts
  - plugins/scanners/http-clients.ts
  - plugins/scanners/http-syntax.ts
  - plugins/scanners/http-uses.ts
  - plugins/scanners/http-routers.ts
  - plugins/scanners/http-routes.ts
  - test/fixtures/typescript-http-wrapper/api.ts.fixture
  - test/fixtures/typescript-http-wrapper/client.ts.fixture
  - test-bun/typescript-http.test.ts
  - test-bun/react-http.test.ts
  - test-bun/javascript-http.test.ts
  - docs/scanners/typescript/index.md
  - docs/scanners/react/index.md
  - docs/scanners/vue/index.md
  - docs/scanners/javascript/index.md
ordinal: 699000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
GitHub issue #182. A frontend that sends requests through a local forwarding wrapper around fetch and builds URLs with a local helper reports no usable request, so no frontend to backend relationship is derived.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A call to a local function whose parameter flows unchanged into the runtime fetch URL, and whose options parameter is spread into fetch options, reports the request at that call, with the method read from the caller's options
- [x] #2 A local function that returns a template or concatenation of its parameters and readable values is read as that URL at its call
- [x] #3 A configured value with a literal fallback, such as import.meta.env.X ?? '/api', is a configured base
- [x] #4 The TypeScript scanner documentation states the supported helper forms and what remains unsupported
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
1. urlParts (http-values.ts) inlines a call to a local single-expression function, substituting its arguments for its parameters, and reads 'configured ?? literal' as configured.
2. New http-forwarding.ts: a call to a local function whose parameter reaches the one runtime fetch call's URL reports that request at the call; fetchRequest uses it.
3. Extend typescript-http fixture/test; update docs/scanners/typescript/index.md decision 4.
Tests: the incorrect result is an unknown leading segment / no request at the call site; existing tests cover direct fetch only.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Helper inlining and the ?? fallback are opt-in (RequestScope) so server route and mount reading keep treating helper calls as computed. Wrapper forwarding applies to fetch only; ofetch/axios wrappers are not followed. A wrapper is called by name or as a member of an imported module; what it forwards is cached per UrlContext. A parameter with a default is not forwarded, and an async or generator helper is a computed value. Call is declared once in http-syntax.ts. Verified: biome, typecheck, test:node and the TypeScript/React/JavaScript HTTP tests pass. 32 test-bun failures (Java, Swift, Kotlin, Scala, COBOL, npm packaging) are identical on the baseline commit and come from missing toolchains.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Shared HTTP client readers follow a local single-expression URL helper (apiUrl) and report a fetch wrapper's request at each call, by name or as a member of an imported module, reading 'configured ?? literal' as configured. A wrapper parameter with a default is not forwarded, and an async or generator helper is a computed value. Affects the TypeScript, React, Vue and JavaScript scanners; docs updated. Verified by the typescript-http-wrapper test and the React/JavaScript expectations; biome, typecheck and test:node pass, and the 32 test-bun failures are the same on the baseline (missing Java/Swift/Kotlin/Scala/COBOL/npm toolchains).
<!-- SECTION:FINAL_SUMMARY:END -->
