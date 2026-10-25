---
id: TASK-631
title: Allow Unicode architecture IDs
status: Done
assignee:
  - '@codex'
created_date: '2026-10-25T10:10:00Z'
updated_date: '2026-10-25T10:16:00Z'
labels: []
dependencies: []
references:
  - 'https://github.com/MrLesk/groma.md/issues/138'
  - src/naming.ts
  - src/architecture-model.ts
  - src/flow-model.ts
modified_files:
  - test-bun/rename.test.ts
  - src/naming.ts
  - src/architecture-model.ts
  - src/flow-model.ts
  - docs/component-markdown.md
type: bug
ordinal: 699000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Names written entirely in a non-Latin script fail during ID creation even though titles already support those scripts. Alex selected Unicode IDs throughout the architecture model for issue #138.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Creating actors, external systems, drafts, and flows from non-Latin names produces usable lowercase Unicode IDs without a Latin-name workaround.
- [x] #2 Unicode element and flow IDs load, resolve through parents and Markdown links, and remain usable after a structural rename.
- [x] #3 The architecture ID format is documented and existing Latin ID, collision, and reserved-name behavior remains covered.
- [x] #4 Focused regressions fail before the fix and pass after it; bun run check and both required simplicity reviews are completed.
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
1. Use the existing naming domain to generate lowercase hyphen-separated Unicode words and validate the same format for elements, draft records, and flows. Preserve combining marks attached to Unicode letters/digits so scripts that use them keep their names. Scanner/plugin package IDs retain their separate existing format.
2. Add a small authoring regression that creates non-Latin actors, externals and draft hierarchies, links them through a Unicode flow, renames a Unicode element, then reloads and resolves the directed steps. Authority: issue #138 and Alex explicitly selected Unicode IDs throughout the model. Wrong result: non-Latin creation is rejected or a valid ID becomes unresolvable after persistence/rename. Existing authoring, flow and rename coverage uses Latin IDs, so it does not observe this gap. Extend relevant coverage or keep one focused concurrent integration test; also exercise a script with combining marks rather than assuming all Unicode letters are one code point.
3. Document the ID rule as Groma application-profile meaning. Ordinary OKF/Markdown readers keep readable Unicode titles, IDs and links; existing C4 actors, systems, containers, components and flows keep their responsibilities and boundaries. Core naming and model validation own identity. No new metadata, architecture concept, dependency, migration, or CLI flag is needed.
4. Verify the regression fails before the change, run focused authoring/naming/flow checks, perform one cold simplicity review without conversation history, apply accepted simplifications, perform own specification and quality reviews, then one full-context complexity review. Run bun run check on the complete change and after relevant fixes. Deliver only this task in its own PR.
Cross-project/language check: retaining the users script is language-neutral and does not depend on a particular repository, scanner, framework or transliteration dictionary.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
The new authoring/rename regression failed before the change with name must contain a letter or a digit on Студент. After the change, 25 focused rename, flow and scanner naming tests pass. The naming domain now uses Unicode words (letters, digits, attached combining marks); its one validator is shared by element IDs, draft IDs/tags and flow IDs. The regression covers Cyrillic, Chinese and Devanagari names, stored relationships, flow steps, a structural rename, and case-normalized collision rejection.

Cold simplicity review /root/unicode_cold_simplicity passed with no blocking findings or material simplifications. Reviewer confirmed that naming owns the single ID rule and existing persistence, parent lookup, flow resolution and rename paths use IDs unchanged. CLI smoke also passed: add actor Студент returned студент, add external Склад returned склад, and view студент --plain resolved the actor. git diff --check passed and no groma/ files changed.

Complete repository check passed: lint/typecheck, 26 Node tests, 931 Bun tests, 63 opt-in skips, zero failures. Local runtime: Bun 1.4.3 and Node 24.11.1. Existing lint has two warnings and two infos outside this diff.
Implementer specification review: Unicode creation covers actors, external systems, draft records and every drafted C4 level; Unicode parents/draft tags, flow IDs, relationship links and structural renames reload correctly. Documented rule matches the shared generator/validator. Existing Latin collision/reserved-name checks pass. Final full-context review is the remaining required gate.
Implementer quality review: traced add/draft/flow entry points through freeId and naming, model validation, document writing, flow endpoint resolution and curation link rebasing. One naming function owns the format and both loaders share it. New functions have no nested branches; changed source/test files stay below 500 lines. The one concurrent test owns its temporary fixture, checks concrete IDs/parents/flow endpoints and collision rejection, and failed before the fix. No source-text, prose, decoration or fixture-inventory assertions were added. No unapproved abstraction, migration, fallback or compatibility path was added. No supported-flow blockers remain.

Final full-context complexity review /root/unicode_full_context_complexity passed after the implementer specification and quality reviews, with no blocking findings or material simplification/architecture recommendations. Both required independent review gates are complete. No implementation changes followed the passing full check.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Architecture names now retain Unicode letters, digits and attached combining marks in lowercase hyphen-separated IDs. One naming rule is shared by element, draft/tag and flow validation; existing parents, Markdown links and structural renames use those IDs directly. Documented the Groma profile rule. The new Cyrillic/Chinese/Devanagari integration regression failed before the fix, then passed; all 25 focused tests and CLI smoke passed. bun run check passed with 26 Node tests, 931 Bun tests and 63 opt-in skips. Cold simplicity and final full-context complexity reviews both passed without findings.
<!-- SECTION:FINAL_SUMMARY:END -->
