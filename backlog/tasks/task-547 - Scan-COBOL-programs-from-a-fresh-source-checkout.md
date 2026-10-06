---
id: TASK-547
title: Scan COBOL programs from a fresh source checkout
status: Done
assignee:
  - '@codex'
created_date: '2026-10-05 16:37'
updated_date: '2026-10-05 16:58'
labels: []
dependencies: []
references:
  - scanner-src-index
  - screen
  - organisms-details
  - modules-discovery
  - cobol-src-index
documentation:
  - docs/scanners/creating-a-plugin.md
  - docs/scanners/evidence.md
  - docs/component-markdown.md
modified_files:
  - plugins/scanners/cobol/package.json
  - plugins/scanners/cobol/.gitignore
  - plugins/scanners/cobol/java/md/groma/cobol/Engine.java
  - plugins/scanners/cobol/java/md/groma/cobol/Source.java
  - plugins/scanners/cobol/java/md/groma/cobol/Main.java
  - plugins/scanners/cobol/src/index.ts
  - plugins/scanners/cobol/build.ts
  - plugins/scanners/cobol/THIRD-PARTY-NOTICES.txt
  - packages/scanner/src/index.ts
  - src/viewers/tui/panes/details.ts
  - src/viewers/web/organisms/code-lists.ts
  - src/scanner/modules/official-catalog.ts
  - scripts/scanner-release.ts
  - test/fixtures/cobol-source/caller.cbl
  - test/fixtures/cobol-source/providers.cob
  - test/fixtures/cobol-source/Fields.CPY
  - test-bun/cobol-scanner.test.ts
  - test-bun/scanner-fresh-checkout.test.ts
  - bun.lock
  - docs/scanners/cobol/index.md
  - docs/scanners/creating-a-plugin.md
  - docs/scanners/index.md
  - groma/systems/groma-md/components/cobol-src-index.md
  - groma/systems/groma-md/containers/cli/components/cobol-src-index.md
  - test-bun/scanner-release.test.ts
type: feature
ordinal: 632000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Deliver the first approved COBOL scanner revision around the CardDemo statement-generation flow: source inventory, program outlines, COPY preprocessing, exact source locations and bounded CALL facts. Ordinary direct-call arrows and broader CICS/JCL runtime interpretation follow later approved examples, as proposed in the accepted delivery order.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The installed scanner discovers and scans selected IBM fixed-format programs and copybooks without project builds, dependencies, a mainframe or separately installed language tools.
- [x] #2 Code details and static export show COBOL program declarations at original source lines, including multiple programs in one file, without pretending programs are types.
- [x] #3 The CardDemo statement-generation slice scans with COPY expansion and CALL evidence; shared copybooks do not merge program owners and curated architecture survives rescans.
- [x] #4 CALL candidates use declarations and preserve unknown alternatives; invalid supported syntax fails without publishing partial evidence.
- [x] #5 Selection, exclusions, copybook edits, source listing and package relocation use the existing lifecycle; supported settings and limits are documented.
- [x] #6 Cold simplicity review, implementer specification and quality reviews, full-context complexity review and repository checks pass with evidence.
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
1. Package Eclipse COBOL 2.5.1 with a Java worker and host runtime; scan only the selected UTF-8 IBM fixed-format source snapshot and ordered local data-copybook paths. 2. Convert program declarations and CALL nodes into existing inventory/operation evidence. Preserve original source locations, unknown runtime alternatives and independent copybook ownership. Use a program Code-outline kind; add no C4 kind, automatic container or direct-call arrow. 3. Integrate official discovery and multi-host release assembly; document usage, current limits and the pinned CardDemo qualification slice. 4. Verify independent fixtures, source selection/exclusions, COPY edits, relocated offline package, host assembly, CardDemo curation/rescans, both viewers and static export. 5. Run the cold simplicity review, implementer specification/quality reviews, repository check and full-context complexity review. Test rationale: existing coverage had no COBOL source parser or package. The minimal fixture detects wrong identities/locations after COPY, false CALL certainty, hidden excluded files, syntax partial results and stale copybooks. Existing relocation and release tests close package-delivery gaps without duplicating host lifecycle tests. OKF remains ordinary Markdown and existing source metadata; program declarations are supporting C4 Code knowledge, with architecture ownership retained by core and people.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Parser decision: the Eclipse COBOL 2.5.1 published engine parses the CardDemo CBSTM03A/CBSTM03B slice with local data COPY, preserves original CALL locations, and supplies program nodes. ProLeap preprocessing exposes plain expanded text, so Eclipse is the smaller fit for exact origins. The worker uses an in-memory source snapshot and no editor client. Literal CALLs name declaration candidates but always remain unresolved; ordinary call arrows remain out of scope. Focused tests exercise CRLF/UTF-16 offsets, multiple programs, COPY REPLACING, exclusions and source changes. CardDemo probe: 2 programs, 14 calls, 13 CBSTM03B candidates and one external CEE3ABD call, no parser warnings.

Cold simplicity review passed with no findings. Reviewer traced catalog -> source snapshot -> Eclipse worker -> existing scanner facts/outline -> viewers and core; no extra layer or useful deletion found. Full repository check first encountered sandbox-only watcher/listener failures and one release fixture missing the added COBOL host artifact. The existing release fixture now includes and verifies COBOL; focused assembly test passes. The complete check is running with the watcher/listener access it requires. CardDemo installed-plugin scan creates six independent file owners; two rescans create zero new elements and preserve curated program names. Static export contains program outlines at original line 2.

Implementer specification review: AC1/5 are evidenced by packaged fresh-checkout test (no project dependencies or language tools on PATH), case-insensitive selection and exclusion test, copybook edit failures, source listing and multi-host assembly test. AC2 is evidenced by multiple-program and original CRLF/UTF-16 fixture assertions, live web program row at line 2, source navigation to that line, TUI outline, and exported program payloads. AC3/4 are evidenced by CardDemo facts, separate file owners and preserved names on rescans, plus uncertain CALL and syntax-failure tests. Implementer quality review traced the adapter, worker setup, parser extraction and viewer hooks; the change uses no new architecture inference or persistence and has no blocking findings. Tests detect wrong candidates, false certainty, wrong source locations, hidden excluded context and stale copybooks without freezing prose. bun run check passed: 16 Node tests; 761 Bun tests passed, 49 existing opt-in tests skipped, zero failures. The COBOL relocated-package check was also run explicitly and passed.

Final full-context complexity review passed with no findings. Both independent reviewers found no useful deletion or consolidation within the approved slice. TUI validation followed docs/viewers/tui/validation.md: How shows CBSTM03B without function parentheses, Enter opens app/cbl/CBSTM03B.CBL:2. Screenshots are /tmp/groma-cobol-tui.svg and /tmp/groma-cobol-tui-source.svg. Web verification opened CBSTM03A at line 2 from its program row. The local built package is plugins/scanners/cobol/dist/package; no separately installed COBOL tools are needed. No release was published and no commit was made.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added the first official COBOL scanner revision: selected IBM fixed-format source, data COPY/REPLACING, exact program outlines and conservative CALL candidates, bundled with Eclipse 2.5.1 and a Java runtime. Added discovery/release wiring, program rendering in both viewers, documentation and focused package/source tests. CardDemo qualification, source navigation, curation/rescans and static export passed. bun run check passed (16 Node and 761 Bun tests; 49 existing opt-in skips). Cold simplicity, implementer specification/quality and final complexity reviews passed. Direct CALL arrows, CICS/JCL/runtime inference, free-format and other dialects remain outside this revision.
<!-- SECTION:FINAL_SUMMARY:END -->
