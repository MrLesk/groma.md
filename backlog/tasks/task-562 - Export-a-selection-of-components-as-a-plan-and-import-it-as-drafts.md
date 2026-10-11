---
id: TASK-562
title: Export a selection of components as a plan and import it as drafts
status: In Progress
assignee:
  - '@codex'
created_date: '2026-10-07 23:16'
updated_date: '2026-10-11 19:18'
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
  - src/architecture-reader.ts
  - src/markdown-emitter.ts
  - src/okf-profile.ts
  - src/viewers/web/page.ts
  - src/groma-filesystem.ts
  - src/flow-authoring.ts
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

6. Maintainability pass, 11 October (review findings A to F). A: table text gets a backslash only where Comark reads syntax, so ordinary punctuation is stored as written; one owner in src/architecture-markdown.ts serves relationship rows and the plan Steps table, and a cell is always one line. B: a destination named by the browser must be a new directory inside the repository; the rule sits beside exportPlan in src/plan.ts and the web route uses it. C: the pane confirms an export in its own element and form class, and the route stops reloading the map, which erased the confirmation. D: src/plan.ts reuses the reader's document parser and the emitter's front matter, drops its casts, and names bundle documents with an explicit label. E: imports follow each file's grouping. F: docs/plans.md states how to edit, remove and accept an imported relationship.

7. Test: extend 'imported concept draft relationships can be edited and removed' in test-bun/plan.test.ts. Rule and authority: review decision A and OKF readability, stored relationship text reads back as written and ordinary punctuation carries no backslash. Wrong result caught: 'Reads user.name, then retries (HTTPS/JSON)' stored as 'Reads user\.name\, ...', or text Comark reads as syntax (*pending*, __init__, A | B, :name, {id}, a URL with an underscore) lost or changed on read. Gap: current tests read only the model for '|' and '*' and never inspect the stored row.

8. Test: add 'the live map exports a plan only into a new directory inside its repository' to test-bun/plan.test.ts, through the /plan/export route of the web map session. Rule and authority: acceptance criterion 3 (the web writes the bundle into the repository) and review decision B. Wrong result caught: a POST with to '../x' or an absolute path creates a directory outside the repository. Gap: no test drives this route; exportPlan tests cover only the command-line function, which may write anywhere.

9. Review list of 11 October, second pass. D1: a plan carries each element's Markdown body as written; export and import replace only the front matter (status, parent, no code, no group, the draft tag on import) and rebuild the relationship sections from the plan's draft rows. D2: people and external systems travel and arrive as stable declarations, tagged with the plan's draft record. D3: exportPlan refuses a destination inside the Groma directory, for the command line and the web. D4: an underscore between two ASCII letters or digits and an ampersand that starts no character reference are stored plain. Also: the plan writes leave the shared authoring writes and the command line calls plan.ts; one declared-concept predicate; relation.ts keeps planned and the index in Ends, always passes drop as an array and passes the accepted pair explicitly; one OKF index renderer and one flow renderer; readPlan requires index.md and plan.md first and reads the bundle ids once; placement is one pass ordered by kind.

10. Tests of the second pass. (a) Extend the plan round trip in test-bun/plan.test.ts. Rule and authority: decisions D1 and D2. Wrong result caught: a code span, link, emphasis or a whole section such as '## Requirements' missing from an imported document, an overview that starts with an escaped block marker imported empty, a person or external system imported as a draft that no command can make stable. Gap: the test compares decoded text only and never reads status. (b) New test: exportPlan refuses a directory inside the Groma directory. Rule and authority: decision D3. Wrong result caught: groma/plans/x is written and every later load fails. Gap: none covers the destination of the shared export. (c) Move the escape assertions to a relationship storage test in test-bun/source-relationships.test.ts and add 'user_id' and 'Auth & billing'. Rule and authority: decisions A and D4. Wrong result caught: user\_id or Auth \& billing in a stored row, or text Comark reads as syntax changed on read. Gap: the assertions sit in a plan test named for edit and remove, and the two plain cases are untested. (d) Anchor the missing-parent assertion on the quoted id, so a path containing /api/ in an unrelated error no longer satisfies it. (e) Extract the setup that two imported-relationship tests repeat; no assertion changes.

11. Test, added to the plan round trip after a mutation check. Rule and authority: the task description and the Markdown contract, a plan carries no code ownership and no group. Wrong result caught: an imported ghost keeps the groma.code or groma.group of the repository it came from. Gap: nothing asserted it, and D1 changed how the front matter is produced (keeping groma.code passed every test).
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

Maintainability pass, 11 October (review findings A to F). A: escapeMarkdownText in src/architecture-markdown.ts now puts a backslash only where Comark reads inline syntax: the characters \ ` * _ [ < & ~ { |, a colon that starts an inline component (:name at the start of a word), and the colon of scheme:// (Comark links such an address and copies it raw, which kept our backslashes as text and grew on every rewrite). The set was derived by probing Comark 0.7.0 per character and checked with 60,000 random punctuation-heavy strings through the reader's parser: the only differences left are percent-encoded bytes that Comark shows decoded inside a linked address, which main does too. escapeTableCell adds the one-line rule for cells and serves relationship rows and the plan Steps table; overviews keep their line breaks. Ordinary punctuation is stored as written, HTTP labels keep the stored form main gave them, and none of this repository's 126 relationship cells would change on a rewrite.

B: exportPlanIntoRepository in src/plan.ts refuses a destination outside the repository; the /plan/export route calls it, the command line keeps exportPlan. exportPlan now refuses an existing directory with a sentence instead of a raw EEXIST. C: headless Chromium showed the old confirmation never appeared: the route reloaded the map after every export and the repaint cleared the form. The route no longer goes through writeResponse (an export changes nothing the map shows), the form has its own class export-as-plan, and the pane confirms in a separate .confirmation element. D: plan.ts uses parseArchitectureDocument (split out of the reader's file read), the emitter's sourceWithFrontmatter, OKF_VERSION, a new PLAN_TYPE and ArchitectureRecords; its casts are gone; bundle documents carry the explicit label plan/ instead of a made-up groma/ path, so import errors name the plan's files and work the same in a .groma project. E: plan imports and writer entries follow each file's grouping in src/authoring.ts, src/viewers/web/data.ts and src/viewers/web/authoring.ts. F: docs/plans.md lists the three relation commands and what acceptance needs; docs/component-markdown.md states how cell text is stored. The plan component overview was updated through groma edit.

Verification of this pass. Both tests were run before the fixes and failed: the extended relationship test on the refused line break, the route test with status 200 for '../outside-plan'. Each escape rule was then removed in turn and the relationship test failed every time. bun run typecheck passed. bunx biome lint: 1 warning and 2 infos, the same three as before the pass, none in a changed file. bun test --parallel=2 --max-concurrency 1 --timeout 20000 over 17 focused files: 167 passed. node --import=tsx --test test/*.test.ts: 16 passed. bun scripts/lint-web-scrollbars.ts exited 0. Headless Chromium on a copy of test/fixtures/flows: exporting two selected components shows 'Exported to plans/browser-plan' and keeps the typed directory; '../p120-outside' shows the refusal and creates nothing; exporting to the same directory again shows the already-exists sentence. A command-line walkthrough on fixture copies covered export, the existing-directory refusal, import, and edit, accept and remove of the imported relationship. The full bun run check was not run in this pass; the orchestrator runs it. No source file was added, moved or deleted, so no scan was run.

Not changed, for a decision. 1) The reader parses stored files with Comark's streaming auto-close and linkify left on. Auto-close rewrites the last line of every document, so text such as a[0](x in the last relationship row is refused on save, and an unclosed [ in a last-line overview gains a placeholder; linkify shows %XX decoded. Both predate this task and no escaping can prevent them; parsing with autoClose and linkify off in the reader would. 2) Plan export re-encodes decoded overviews, so an overview line that begins with an escaped block marker (\# or \-) would turn into a heading or list on import. 3) Exporting into the Groma directory itself is not refused. 4) Four older copies of the parse-and-cast (markdown-emitter, flow-authoring, relationship-storage, curate) could call parseArchitectureDocument. 5) An underscore inside a word and an ampersand in prose still get a backslash (user\_id, Auth \& billing); a positional rule for each is possible if quieter storage is wanted.

Checked for item 3: exporting to groma/plans/x makes the architecture unloadable (component entry 'is not stored at its canonical C4 path') until that directory is deleted. Checked for item 1: 'Reads a[0](x' in the last row of a document is refused with 'description and technology must not be empty'; an overview ending in 'Reads [a' on the last line reads back with '(comark:incomplete-link)' appended.

Second pass on the consolidated review list, 11 October. D1: plannedSource in src/plan.ts builds an element document for both directions from the source document: the Markdown body as written, the front matter with status replaced and groma.code, groma.group and an earlier draft tag removed (plus the draft tag on import), and the relationship sections rebuilt by withStoredRelationships from the plan's draft rows. The prose escape is used in plan.ts only for a flow overview; flows are still written again from their meaning because their Steps links depend on where the elements land. D2: status is stable for a person or an external system and draft for software, in the bundle and after import; everything imported carries the plan's draft tag. D3: exportPlan refuses a destination inside the Groma directory, beside the existing-directory refusal, so the command line and the web share it. D4: an underscore between two ASCII letters or digits and an ampersand that starts no character reference are stored plain.

Second pass, the rest of the list. The plan entries left the shared authoring writes; src/write-commands.ts calls plan.ts, which takes the lock itself. isDeclaredConcept in src/relationship-markdown.ts is the one declared-concept test, used by the reader, relation.ts and plan.ts. relation.ts keeps the source index and planned in Ends, always passes drop as an array, passes the accepted endpoints to writeRow explicitly and labels both cases of acceptanceEnds. withStoredRelationships takes RelationshipConnection rows. renderBundleIndex in src/okf-profile.ts writes the OKF index for the Groma directory and for a plan (the plan index now escapes labels and encodes links). renderFlowDocument in src/markdown-emitter.ts serves flow authoring and plan.ts. readPlan requires index.md and plan.md before it walks the directory and reads the bundle ids once. Import no longer overrides front matter for its first model (only the --parent replacement), leaves the missing-parent refusal to the model, and places elements in one pass ordered by kind. The escape functions state their input contract, the reason for each character in the colon rule and the guarding test. Docs: what a plan carries, declarations, the destination rules, that only an import writes a planned relationship between two internal ids, and that the plan.md body is the draft outcome and meant to be edited. The plan component overview was updated through groma edit.

Verification of the second pass. Written first and failing before the changes: the round trip (formatting, the escaped '1986\.' paragraph and the Requirements section were lost), the Groma-directory refusal (the export succeeded) and the relationship text test (user\_id and Auth \& billing were stored). Mutations that then failed the round trip: status always draft, no draft tag, keeping groma.code, keeping groma.group. bun run typecheck passed. bunx biome lint: 1 warning and 2 infos, the same three as before, none in a changed file. bun test --parallel=2 --max-concurrency 1 --timeout 20000 over 20 focused files: 187 passed. node --import=tsx --test test/*.test.ts: 16 passed. Fuzz of escapeTableCell through the reader's parser, 59,741 strings including underscore and ampersand cases: 7 differences, all percent-encoded bytes shown decoded inside a linked address. None of this repository's 126 relationship cells would change. Command-line walkthrough on fixture copies: export with a formatted body and a Requirements section, the already-exists and inside-groma refusals, import (body identical, person stable and tagged), edit (stored as written), accept of an internal planned relationship (found 0), accept of a relationship with a person (accepted), remove (refused because a flow uses it), draft relation between two internal ids (refused). Headless Chromium: confirmation shown, and the outside, inside-groma and already-exists refusals shown in the error element. The full bun run check was not run. No source file was added, moved or deleted, so no scan was run.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Portable OKF plans preserve selected element, relationship and ordered flow meaning, including literal overview characters and table pipes. Required external parents are derived from authoritative element parent IDs. Imported concept-ID draft relationships support editing and removal; explicit acceptance transfers their planned text only to one existing current exact-file pair, leaving missing or ambiguous evidence unchanged. Final rendered-document validation and existing scanner/ghost lifecycle remain in use. Verified 115 focused tests, the real live-browser multi-selection export and a separate import of its bundle, bare CLI help, and bun run check (16 Node tests; 781 Bun passed, 51 optional-runtime skips, zero failures). Both external reviews and implementer specification/quality reviews passed. Updated contracts and the existing architecture relationship owner. All task criteria and Definition of Done items are checked. Changes are committed locally without publication.
<!-- SECTION:FINAL_SUMMARY:END -->
