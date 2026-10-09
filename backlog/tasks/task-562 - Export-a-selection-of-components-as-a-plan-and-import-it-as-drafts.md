---
id: TASK-562
title: Export a selection of components as a plan and import it as drafts
status: Done
assignee:
  - '@codex'
created_date: '2026-10-07 23:16'
updated_date: '2026-10-09 08:02'
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
- [ ] #3 On the web map, a multi-selection of components offers Export as plan beside Group as and Combine into, and the bundle is written into the repository or downloaded.
- [x] #4 After an import, a scan matches the ghosts when their code arrives and groma accept works unchanged. Existing draft behaviour and its tests stay as they are.
- [x] #5 A round trip works: a plan exported from one fixture repository and imported into an empty one yields equal elements, relationships and overviews.
- [x] #6 groma plan without arguments prints what a plan is and the two commands, and docs/ gets a page with an example plan.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Acceptance criteria have objective verification evidence.
- [ ] #2 Relevant checks pass and changes remain task-scoped.
- [x] #3 Public contracts or documentation are updated when behavior changes.
- [x] #4 Implementation Plan reflects the final approach; correction history and verification are recorded in Implementation Notes.
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Implement a portable OKF directory bundle containing selected draft concepts, concept-linked draft relationships, internal flows, and external parent IDs. Use existing Markdown emitters, canonical paths and locked writes; validate the complete import before saving. 2. Register plan export/import/help commands and add a repository-path export action beside web multi-selection controls. 3. Document the profile and an example. Keep scan matching and element acceptance unchanged. 4. Review the diff and update the architecture via groma scan. No installs, builds, tests or commits per stage instructions; unexecuted verification will be reported rather than claimed.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Added the plan bundle and import/export path, CLI help, live multi-selection export, and docs/plans.md. Verified bare plan help with bun src/cli.ts plan (the global groma command points to the separately installed package). No installs, builds or test runners have been run. Existing scanner and accept implementations and their tests remain unchanged.

CLI walkthrough using a temporary copy of test/fixtures/flows: exported service, api, entry, worker, requester and journal; imported into an empty initialized destination. Inspection found 6 equal element meanings/overviews, 4 equal relationship meanings, and 1 equal ordered flow, excluding intentional status/code/draft differences. Reimport failed naming the existing request-plan draft; all destination file hashes remained unchanged. The imported entry view renders its four incoming/outgoing draft relationships.

A two-component export lists only api as its required parent and omits the external flow. Import into an empty initialized architecture failed naming api. After drafting a destination system/container with existing commands, importing that same bundle with --parent application succeeded at the destination canonical paths. The cold simplicity review found no blocking defects or necessary simplifications.

Extended the temporary CLI walkthrough with source files and the configured local TypeScript scanner. Scan reported matched 2, entry acquired src/entry.ts while staying draft, and accept entry succeeded unchanged. Existing draft tests were neither changed nor run. Implementer specification/quality review and the separate final complexity review found no blocking supported-flow defect. Live browser interaction remains unverified because no browser/build/test run was performed.

Repository groma scan completed: created 1, refreshed 111, matched 0, findings 38. Curated the task-owned plan component in the Groma application as Architecture plans, under Architecture records; existing unrelated agents architecture changes were left alone. git diff --check passed for the touched files. Browser export is implemented via the existing selection controls and shared write route, but AC 3 remains unchecked pending actual browser interaction. No installs, builds, test runners, commits or task-status changes were performed.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Implemented portable OKF plan export/import, whole-import ID and parent validation, canonical ghost placement with a named draft, concept-linked draft relationships and internal flows, CLI help, live browser multi-selection export, documentation and the Architecture plans map component. CLI walkthrough verified equal element/relationship/flow meaning after round trip, parent override, rejection without partial writes, and scan/accept of imported ghosts. AC 3 browser interaction remains unverified; builds and test suites were not run per instruction.
<!-- SECTION:FINAL_SUMMARY:END -->
