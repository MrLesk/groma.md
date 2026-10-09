---
id: TASK-562
title: Export a selection of components as a plan and import it as drafts
status: Done
assignee:
  - '@codex'
created_date: '2026-10-07 23:16'
updated_date: '2026-10-09 13:19'
labels:
  - senior
dependencies: []
references:
  - src-architecture-model
  - src-authoring
  - src-architecture-reader
  - src-cli
  - organisms-details
  - create
  - web-export
  - relationship-markdown
  - docs/component-markdown.md
  - docs/product-model.md
  - src/plan.ts
  - src/relation.ts
  - src/relationship-storage.ts
  - test-bun/plan.test.ts
  - src/http-relationships.ts
  - test-bun/http-relationships.test.ts
modified_files:
  - src/plan.ts
  - src/relationship-markdown.ts
  - src/authoring.ts
  - src/write-commands.ts
  - src/viewers/web/data.ts
  - src/viewers/web/map-session.ts
  - src/viewers/web/authoring.ts
  - src/viewers/web/organisms/writes.ts
  - docs/plans.md
  - docs/component-markdown.md
  - groma/systems/groma-md/containers/cli/components/plan.md
  - test-bun/plan.test.ts
  - src/architecture-markdown.ts
  - src/relationship-storage.ts
  - src/relation.ts
  - test-bun/source-relationships.test.ts
  - groma/systems/groma-md/containers/cli/components/relationship-markdown.md
  - src/http-relationships.ts
  - test-bun/http-relationships.test.ts
type: feature
ordinal: 2
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
A plan is a fragment of architecture in Groma.md's own OKF Markdown: a few elements, the relationships between them, and the parents they need. People pick components on the map or name them on the CLI, export them as a plan, and import that plan into another repository, where the elements arrive as ghosts (status draft) at the paths they will keep, under a draft record named after the plan. This is the base for sharing plans between projects. Plans describe outcomes, not work: no layout, no code references, no implementation steps.

Build on drafts (src/draft.ts, src/accept.ts, draft records in src/architecture-model.ts), the emitter (src/markdown-emitter.ts), the multi-selection controls of the web map (src/viewers/web/organisms/writes.ts), static export (src/viewers/web/export.ts) and the Markdown contract (docs/component-markdown.md).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 groma plan export <ids...> --to <path> writes a plan bundle in the OKF profile: the selected elements with status draft and their overviews, the relationships between them as draft rows, the flows that lie entirely within the selection, and the parents they need by id only. The Markdown contract documents the bundle.
- [x] #2 groma plan import <path> [--parent <id>] creates the elements as ghosts at the paths they will keep, the relationships as draft rows, and a draft record named after the plan that tags every imported element. Ids are kept. A colliding id or a missing parent fails the whole import with a message naming it, and nothing is written.
- [x] #3 On the web map, a multi-selection of components offers Export as plan beside Group as and Combine into, and the bundle is written into the repository or downloaded.
- [x] #4 After an import, a scan matches the ghosts when their code arrives and groma accept works unchanged. Existing draft behaviour and its tests stay as they are.
- [x] #5 A round trip works: a plan exported from one fixture repository and imported into an empty one yields equal elements, relationships and overviews.
- [x] #6 groma plan without arguments prints what a plan is and the two commands, and docs/ gets a page with an example plan.
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
1. Export selected C4 meaning through existing plan and Markdown storage owners. Escape decoded prose/table values at serialization, and keep HTTP inference text plain so it is escaped once.
2. Derive external parents from element groma.parent IDs. Import resolves existing destination parents, builds canonical ghost paths, and validates the final rendered documents before writing. The supporting plan record has only type, title and outcome prose; it adds no C4 concept.
3. Existing stored concept-ID draft relationships may be edited and removed. As confirmed by Alex, explicit acceptance transfers their authored text only to the unique existing current exact-file pair between their component owners. Zero or multiple pairs retain the draft with a clear error. Scanner matching and ghost acceptance keep their existing lifecycle.
4. Verification: fixture round-trip checks literal overview, relationship description/technology and ordered flow action meaning (AC1/AC5); element parent IDs check missing-parent atomic rejection and --parent replacement (AC2); imported edit/remove and scanner-backed zero/one/multiple evidence checks cover the reported lifecycle failure (AC4). Existing HTTP literal-path coverage checks that inference and storage do not escape twice. Test additions address gaps in plan and concept-draft coverage, not new behavior.
5. Verify real live browser multi-selection export, run focused checks and bun run check, complete cold simplicity and full-context complexity reviews, and perform implementer specification/quality reviews. Curate task-caused architecture through the CLI and make one local task commit without publishing.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Added the plan bundle and import/export path, CLI help, live multi-selection export, and docs/plans.md. Verified bare plan help with bun src/cli.ts plan (the global groma command points to the separately installed package). No installs, builds or test runners have been run. Existing scanner and accept implementations and their tests remain unchanged.

CLI walkthrough using a temporary copy of test/fixtures/flows: exported service, api, entry, worker, requester and journal; imported into an empty initialized destination. Inspection found 6 equal element meanings/overviews, 4 equal relationship meanings, and 1 equal ordered flow, excluding intentional status/code/draft differences. Reimport failed naming the existing request-plan draft; all destination file hashes remained unchanged. The imported entry view renders its four incoming/outgoing draft relationships.

A two-component export lists only api as its required parent and omits the external flow. Import into an empty initialized architecture failed naming api. After drafting a destination system/container with existing commands, importing that same bundle with --parent application succeeded at the destination canonical paths. The cold simplicity review found no blocking defects or necessary simplifications.

Extended the temporary CLI walkthrough with source files and the configured local TypeScript scanner. Scan reported matched 2, entry acquired src/entry.ts while staying draft, and accept entry succeeded unchanged. Existing draft tests were neither changed nor run. Implementer specification/quality review and the separate final complexity review found no blocking supported-flow defect. Live browser interaction remains unverified because no browser/build/test run was performed.

Repository groma scan completed: created 1, refreshed 111, matched 0, findings 38. Curated the task-owned plan component in the Groma application as Architecture plans, under Architecture records; existing unrelated agents architecture changes were left alone. git diff --check passed for the touched files. Browser export is implemented via the existing selection controls and shared write route, but AC 3 remains unchecked pending actual browser interaction. No installs, builds, test runners, commits or task-status changes were performed.

Review fixes, 9 October: Added focused regressions and first observed literal overview loss plus the concept-ID edit rejection before fixes. All 115 focused plan, relationship, flow and HTTP tests now pass. Cold simplicity review passed with no blocking findings; applied its RelationEnds comment clarification. The first full check exposed double escaping at the existing HTTP inference boundary; removed that duplicate serializer responsibility, kept the existing loaded-path assertion, and reran checks. Scanner matching test uses one explicit module boundary so it exercises the existing matching contract rather than changing that contract. The live browser walkthrough selected Entry and Worker, used Export as plan, and wrote plans/browser-plan. A separate import preserved literal *pending*, description Dispatches A | B and technology Callback | queue. Evidence is /private/tmp/groma-pr120-browser-evidence.json with screenshot /private/tmp/groma-pr120-browser-export.jpg. Implementer specification review maps the fixes to AC1/AC2/AC4/AC5 and now verifies AC3 through actual browser interaction; bare CLI plan help and docs prove AC6. Implementer quality review traced export → serializer → import validation → ghost storage and relationship control → existing evidence → validated storage, checked test failures against their claims, and found no remaining supported-flow defect or added complexity. The latest full check is still running, so its result is not yet claimed.

Final verification: bun run check exited 0 after the HTTP serialization correction. Biome checked 602 files; changed files have no warnings or complexity findings. TypeScript 7.1.0-dev.20260924.1 passed. Node: 16 passed, 0 failed. Bun: 781 passed, 51 skipped for unavailable optional runtimes, 0 failed across 147 files. Successful output is /private/tmp/groma-pr120-final-check.log. The cold simplicity and final full-context complexity reviews both passed with no blocking finding or material simplification; the final reviewer confirmed clear domain ownership and requested only this evidence/status update. Two local scans created no components; the existing relationship architecture record was updated through the CLI and survived rescan. Existing unavailable native scanner workers kept saved data and do not affect the TypeScript fixture or passing check. The implementation uses Markdown text and existing source ownership rather than a project, language or framework-specific rule; TypeScript is only the supported regression fixture. git diff --check passed. All acceptance criteria and Definition of Done items now have evidence, including the formerly unverified live browser Export as plan action.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Portable OKF plans preserve selected element, relationship and ordered flow meaning, including literal overview characters and table pipes. Required external parents are derived from authoritative element parent IDs. Imported concept-ID draft relationships support editing and removal; explicit acceptance transfers their planned text only to one existing current exact-file pair, leaving missing or ambiguous evidence unchanged. Final rendered-document validation and existing scanner/ghost lifecycle remain in use. Verified 115 focused tests, the real live-browser multi-selection export and a separate import of its bundle, bare CLI help, and bun run check (16 Node tests; 781 Bun passed, 51 optional-runtime skips, zero failures). Both external reviews and implementer specification/quality reviews passed. Updated contracts and the existing architecture relationship owner. All task criteria and Definition of Done items are checked. Changes are committed locally without publication.
<!-- SECTION:FINAL_SUMMARY:END -->
