---
id: TASK-552
title: Protect local architecture updates and reject stale edits
status: Done
assignee:
  - '@codex'
created_date: '2026-10-06 08:58'
updated_date: '2026-10-06 09:29'
labels: []
dependencies: []
references:
  - src-architecture-reader
  - src-authoring
  - src-scanner
  - organisms-details
  - web-server
  - data
  - curate
  - relationship-markdown
  - src-initialize
  - create
modified_files:
  - src/groma-filesystem.ts
  - src/authoring.ts
  - src/architecture-reader.ts
  - src/scan-reconciler.ts
  - src/project-profile.ts
  - src/initialize.ts
  - src/authoring-conflict.ts
  - src/edit.ts
  - src/relation.ts
  - src/group.ts
  - src/viewers/web/organisms/editable.ts
  - src/viewers/web/organisms/writes.ts
  - src/viewers/web/authoring.ts
  - src/viewers/web/map-session.ts
  - src/viewers/web/data.ts
  - test-bun/filesystem-access.test.ts
  - test-bun/editing.test.ts
  - src/viewers/web/project/editor.ts
  - docs/component-markdown.md
  - docs/viewers/web/index.md
  - src/viewers/web/organisms/details.ts
  - test-bun/inspect-details.test.ts
  - groma/systems/groma-md/components/authoring-conflict.md
  - groma/systems/groma-md/containers/cli/components/authoring-conflict.md
  - groma/systems/groma-md/containers/cli/components/src-authoring.md
  - groma/systems/groma-md/containers/cli/components/src-architecture-reader.md
priority: high
type: bug
ordinal: 636000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Concurrent CLI edits to different fields of one component both succeeded but silently lost one change. Protect cooperating local architecture operations with a project filesystem lock, bounded waiting, and atomic document replacement. CLI commands accept only new values and overwrite requested fields on the latest architecture under that lock. Web forms compare changed fields with their original values and reject stale changes before writing. Filesystem coordination stays in GromaFileSystem; conflict meaning is independent of storage. Ordinary Markdown and the C4 model remain unchanged. Remote clones, shared scanner caches, and process-crash recovery across several files are outside this task.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Concurrent local CLI, web, and scanner architecture updates use one project-scoped filesystem boundary and preserve independent changes.
- [x] #2 An operation waits for the project lock within a bounded timeout; timeout and rejected edits make no architecture changes.
- [x] #3 Groma readers do not observe an in-progress structural update, and individual documents are replaced atomically.
- [x] #4 The web editor retains unsaved input on conflict; edits to unrelated fields do not cause false conflicts.
- [x] #5 Filesystem coordination remains inside the filesystem layer; domain validation and conflict meaning remain storage-independent, with the supported contract documented.
- [x] #6 CLI edits carry only new values and overwrite the requested fields on the latest architecture inside the filesystem-protected operation. Web edits compare original field values, reject conflicting changes as one request, and report original, current, and proposed values.
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
1. GromaFileSystem owns cross-process access, a five-second bounded wait, nested access, and replacement of each complete document through a temporary file and rename. Architecture readers use the same scope. Watchers ignore lock and temporary-file activity.
2. The shared authoring writes API protects each complete operation before its first read. Scanner reconciliation, initialization, and project-profile writes use that scope. CLI flags remain unchanged and carry only new values.
3. Web forms retain their original field values and send only changes. The storage-independent authoring conflict rule checks all supplied originals before any write, permits independent changes and already-applied values, and reports original/current/proposed values. Forms retain unsaved input on failure.
4. Keep the behavior in existing filesystem, authoring, and form responsibilities. The conflict helper belongs to the existing authoring component. OKF remains ordinary Markdown with no new metadata; no new C4 element or persistence-plugin abstraction is introduced. The rule does not depend on a project language.
5. Verification authority and gaps: the reproduced lost independent update requires separate CLI processes because existing edit coverage was sequential. Approved timeout, complete structural reads, and atomic replacement require filesystem tests using isolated fixture copies. The approved stale-form rule requires HTTP coverage proving all-or-nothing rejection, unrelated-field success, and repeat success; the browser check observes retained input. Cold-review reproductions require technology originals to stay unchanged by chip display, descriptions to retain spaces, and overview/project-title repeat checks to follow their existing writer normalization. Extend existing edit coverage rather than duplicate it across layers.
6. Document local cooperation and crash limitations. Run focused checks, one cold simplicity review with at most one targeted re-review, implementer specification and quality reviews, the full repository check, and one final full-context complexity review. Curate generated architecture and verify two scans create no new elements.

Final review regression: the approved already-applied-value rule also applies to relationship forms. An isolated reproduction showed that saving a relationship description with surrounding spaces succeeds once but rejects the identical request, because Markdown reads trim relationship cells. Extend the existing HTTP edit test with one repeated relationship request covering both description and technology; existing coverage only repeats element and project fields. Normalize these proposals at the relationship owner to match the existing reader.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Alex chose optional CLI preconditions: edits without original values remain available, and conflict checks apply only when original values are supplied. The web editor supplies them automatically.

Alex revised the CLI policy: do not offer original values, even optionally. CLI updates overwrite requested fields against the current architecture inside the protected operation. No --expect flag. Web stale-form checks remain part of the previously approved browser flow.

Focused checks pass: 16 existing editing/index/rename/partial-scan tests; 4 new filesystem tests for cross-process writes, timeout, consistent structural reads, and atomic replacement; 3 editing tests including HTTP conflict behavior. Typecheck passes. Native web filesystem watching requires the unsandboxed test invocation on this host; the initial sandbox run could not start FSEvents.

Cold simplicity review recommends keeping the single filesystem boundary and pure conflict rule. Two blocking findings: technology originals reconstructed from display chips can be wrong, and blanket trimming rejects already-applied descriptions whose spaces the writer preserves. Fixing these within the approved field-edit flow. First full repository check passes (770 Bun tests passed, 50 skipped, no failures; Node tests also passed).

Browser verification on a disposable fixture: opened Stock, typed a proposed title, changed the title through a separate CLI process, and saved the web form. The hierarchy showed the CLI title, the form retained the proposed title, and the conflict displayed original/current/proposed values. Temporary browser tab and server were closed. Targeted cold re-review accepted technology preservation and repeated descriptions, then found the directly related overview-trimming regression; fixed it using the existing overview rule and project-title normalization at its owner. Expanded HTTP regressions pass. No additional review cycle was added.

Implementer specification review: all supported CLI and web mutation routes use the shared writes boundary; scanner reconciliation acquires the same boundary before loading architecture. CLI carries no original-value flag. Web checks precede any write, and independent fields survive. Lock timeout, consistent reads, and replacement behavior are covered by isolated filesystem tests. The disposable browser conflict retained input and showed original/current/proposed values. Documentation states the local cooperation and crash limits.

Implementer quality review: traced CLI/web entry -> shared writes -> current architecture read -> domain validation -> filesystem replacement -> refreshed view. Filesystem lock mechanics have one owner; the pure conflict helper and shared form comparison avoid duplicated policy. New tests exercise changed observable behavior rather than prose or implementation structure. The original cold findings and its targeted regression are resolved by preserving raw technology and following the existing writer normalization. No new dependency, migration, recovery system, or plugin abstraction. Source files remain at or below 500 lines. Two post-curation scans each created zero components; the new helper is grouped in src-authoring.

Full-context review reproduced one supported-flow defect: repeated relationship edits with surrounding spaces falsely conflict. The reviewer recommends the current architecture and a small owner-local normalization fix. Final full repository check before this fix passed: 16 Node tests; 770 Bun passed, 50 skipped, zero failures.

Full-context complexity review recommends acceptance after one owner-local relationship correction, with no broader architecture changes. Its reproduced defect is now covered in the existing HTTP test: the identical relationship description/technology request returned 409 before the fix and succeeds after it. The relation handler compares the same trimmed text that its Markdown reader returns. Targeted implementer re-review checked only that finding and the normalization change; validation still precedes every write, independent fields retain their existing behavior, and conflict ownership remains in authoring. Focused editing tests: 3 passed. The required full check is running again after this final code change.

Final verification after every code fix: bun run check passed (Biome and TypeScript; 16 Node tests passed; 770 Bun tests passed, 50 skipped, zero failures). Existing unrelated lint notices remain. git diff --check passed.

AC evidence: (1) separate CLI process regression preserves title and overview; shared web routes and scanner reconciliation enter the same filesystem boundary, with existing scanner/structural suites passing. (2) a separate process times out before entering an occupied operation and changes no document; stale HTTP rejection preserves the complete original document. (3) a reader waits through a temporary invalid multi-document state; an already-open file handle sees the whole previous document after replacement. (4,6) HTTP tests cover stale whole-request rejection, independent fields, already-applied values, and original/current/proposed data; manual browser verification retains unsaved input. CLI uses existing flags and accepts only new values. (5) lock/wait/replacement implementation resides in GromaFileSystem, conflict meaning resides in authoring, and both local and web contracts are documented.

Cold simplicity and full-context reviews are complete; all authority-backed findings are resolved and regression-verified. No material architecture recommendation remains. Both scans following curation created zero components. Only task-owned code, docs, architecture records, tests, and this Backlog record are included for commit.

Delivery integration: origin/main advanced with TASK-549 Scala scanner work. Its files did not overlap TASK-552 or the unrelated local untracked files. Rebased this task cleanly and reran bun run check on the combined main: 16 Node tests passed; 771 Bun passed, 51 skipped, zero failures. No task code changed during integration.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Protected complete local architecture operations with a project filesystem lock, a five-second wait, and atomic replacement of each document. CLI commands keep their existing flags and overwrite requested fields against the latest state. Web forms compare only changed fields, report conflicts, and retain unsaved input. Scanner reconciliation and architecture readers use the same boundary.

Filesystem coordination stays in GromaFileSystem; field conflicts stay in authoring. The helper is grouped under the existing authoring component, with ordinary OKF Markdown and C4 unchanged.

Verified by the full repository check (16 Node and 770 Bun tests passed; 50 skipped), focused concurrency and stale-edit tests, a browser conflict check, and both required reviews. A repeated relationship-edit defect failed before its fix and passes afterward.

Scope: cooperating local Groma processes. Direct file editors and separate clones do not share the lock. Multi-file crash recovery and automatic stale-lock cleanup are not included; the local contract documents manual cleanup.

After integrating the newer main, the full check also passed: 16 Node and 771 Bun tests passed, 51 skipped, zero failures.
<!-- SECTION:FINAL_SUMMARY:END -->
