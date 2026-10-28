---
id: TASK-629
title: Read HTTP requests through a fetch wrapper and a URL helper
status: Done
assignee:
  - '@codex'
created_date: '2026-10-25 11:00'
updated_date: '2026-10-28T21:50:00Z'
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
  - test/fixtures/javascript-http/client/fetch.mjs
  - plugins/scanners/typescript/package.json
  - plugins/scanners/react/package.json
  - plugins/scanners/vue/package.json
  - plugins/scanners/javascript/package.json
  - plugins/scanners/angular/package.json
  - bun.lock
  - groma/systems/groma-md/containers/cli/components/http-forwarding.md
  - groma/systems/groma-md/containers/cli/components/scanners-http-routes.md
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
1. Keep the approved issue #182 flow: a caller supplies a URL through a single-expression helper and an unchanged fetch wrapper; core derives the backend relationship. HTTP facts remain temporary Groma inference evidence, not new OKF fields or C4 elements. The existing HTTP source analysis component owns the new reader; ordinary Markdown readers see the same source links and relationship rows.
2. Reuse the binding reader to reject changed options.method and reassigned function declarations. Count only fetch calls executed in the wrapper body; exclude nested function bodies and generator wrappers. Keep server route readers unchanged and avoid adding support for other wrapper forms.
3. Extend existing regression coverage before fixing: the evidence contract requires unchanged URL/method forwarding. Existing wrapper cases miss a method written on the options object and requests deferred in callbacks/generators; extend the wrapper fixture and its current TypeScript test so those callers report no concrete requests. JavaScript source-value coverage misses reassigned function declarations; extend its existing fixture/assertion to keep the replaced URL unknown and the replaced wrapper unresolved. Verify these assertions fail on the current code.
4. Preserve the accepted frontend-to-backend example through core inference, use existing TypeScript/React/Vue/JavaScript/Angular HTTP coverage, update supported-form documentation, bump every affected scanner package version, and regenerate only the lockfile changes needed by those versions.
5. Record the new source under the existing HTTP source analysis component through the Groma CLI. Run focused checks, a cold simplicity review, my specification/quality reviews, the final full-context complexity review, and bun run check. Update the task, commit and push only PR work to its head branch, shorten the PR description, and verify CI.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Codex took over PR #183 at e76a2d08 after Alex requested merge preparation, and merged current main into its feature branch. Review reproduced false requests when a wrapper changes init.method, only creates a callback or generator, or resolves a JavaScript function that was later reassigned. The existing TypeScript and JavaScript regression tests failed on those exact facts before the fixes (12 passed, 2 failed).

The fixes reuse the existing binding reader: options.method must stay unchanged, function declarations must not be reassigned, and wrapper discovery stays within the invoked function body and excludes generators. URL-helper resolution remains request-only. The configured-base example from issue #182 still reports PUT configured:/billing/plan; a manual scan and core-inference probe derives only the intended PUT /v1/billing/plan relationship. Replaced URL helpers remain unknown, and the false wrapper caller facts disappear.

All 24 affected TypeScript, React, Vue, JavaScript and Angular HTTP tests pass. The complete bun run check passes: 26 Node tests and 942 Bun tests, with 64 skipped optional/platform tests. Local runtimes were Bun 1.4.3 and Node 24.11.1; the repository CI uses its pinned supported runtimes. TypeScript 7.1.0-beta type checking passes, and lint adds no complexity warning. No source/test file changed by this PR exceeds 500 lines.

The cold simplicity review, my specification and quality reviews, and the final full-context complexity review passed. The cold review's task-plan wording and unrelated Ruby lockfile change were corrected. The final lockfile contains only five scanner version updates: TypeScript 0.2.5, React 0.2.5, Vue 0.2.7, JavaScript 0.2.4 and Angular 0.2.6. Angular's version changes because it bundles the shared reader; its supported HttpClient behavior is unchanged. These exact versions were unpublished when checked against npm.

Groma scan and edit combined http-forwarding into the existing HTTP source analysis component, scanners-http-routes. A repeat scan retained that owner. The scans surfaced 29 untracked records for unrelated pre-existing source; only those newly generated outputs were discarded, and their accidentally added task trace entries were corrected. Native C#/Go/Java/Rust workers were unavailable during this repository scan, so their saved data was preserved. The only retained architecture diff is the new source reference under its existing component. HTTP facts remain temporary evidence: no new OKF field, C4 element or relationship rule is introduced.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Client requests now resolve simple local URL helpers and unchanged fetch wrappers at their call sites. The reader rejects the reproduced mutable and deferred cases instead of creating false backend relationships. Supported forms are documented, affected scanner packages are versioned, and the new file is owned by HTTP source analysis. Existing regression tests fail before the fixes and pass after them; the full repository check and both required independent reviews pass.
<!-- SECTION:FINAL_SUMMARY:END -->
