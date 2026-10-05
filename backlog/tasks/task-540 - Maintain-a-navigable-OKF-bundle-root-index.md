---
id: TASK-540
title: Maintain a navigable OKF bundle root index
status: Done
assignee:
  - '@codex'
created_date: '2026-10-05 03:58'
updated_date: '2026-10-05 04:03'
labels: []
dependencies: []
references:
  - >-
    https://github.com/GoogleCloudPlatform/open-knowledge-format/blob/main/SPEC.md#8-index-files
  - src-architecture-reader
  - src-initialize
modified_files:
  - test-bun/bundle-index.test.ts
  - src/groma-filesystem.ts
  - src/initialize.ts
  - docs/component-markdown.md
  - docs/product-model.md
type: bug
ordinal: 625000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Independent validation of an existing Groma bundle with @mfdaves/okf-mcp 0.9.1 reports two OKF conformance errors: the root index has no heading and no linked contents. Initialization currently writes only the version declaration. Alex requested a fix that works for other repositories, rather than a hand-written index for this repository.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Initialization writes an OKF 0.2 root index with a heading and relative links to the actual immediate Markdown documents and subdirectories in either supported bundle directory.
- [x] #2 Groma document writes and removals keep root entries current without recursively listing every nested concept or changing C4 meaning.
- [x] #3 The documented index contract matches the behavior, and representative output passes the independent validator conformance checks.
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
1. Keep root index generation in Markdown storage (GromaFileSystem). List actual immediate Markdown files except index.md and actual subdirectories in stable filename order, using relative links. No repository names, scanner languages, C4 types, recursive inventory, or new metadata enter the index. OKF owns navigation; C4 ownership and the architecture reader stay unchanged.
2. Initialize the project record before generating the root index. Refresh the root index after a Markdown write introduces a top-level entry or a top-level Markdown removal changes the listing. Existing nested edits need no refresh. Re-running initialization regenerates the current listing; read-only loads never write.
3. Test authority: the reproduced empty-index conformance failure and the requested repository-independent fix. Existing authoring/scanner tests exercise Markdown writes but none inspect bundle index navigation. Add concurrent, isolated tests for fresh initialization under both supported roots and for root links following document/directory creation and root-document removal, using a small existing fixture and unrelated concept names. Assertions inspect Markdown headings and link targets, not exact prose. Run the regression tests before and after the fix.
4. Replace the empty-index documentation rule. Run focused tests, independent OKF 0.2 validation on fresh and populated temporary examples, then bun run check. Perform the implementer specification and quality reviews; this is a bounded storage bug fix and does not need separate architecture review agents.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Regression evidence: all four new index tests failed before the fix because the parsed index had no heading. After implementation, all 10 focused tests passed (bundle index, authoring, and scanner entry-point suites). Root entries use actual filenames and relative links; nested documents and non-Markdown configuration are not repeated.

Independent validator @mfdaves/okf-mcp 0.9.1 reports conformant=true for fresh and populated examples under both groma/ and .groma/, and for a regenerated copy of the 130-document repository bundle. The populated examples also pass the validator project policy. The repository copy retains outside-root source-link policy warnings, unrelated to conformance. Full check initially stopped at a Comark AST typing mismatch in the new test helper; corrected its explicit Markdown-node projection.

Quality review traced initialization and shared Markdown writes through GromaFileSystem to the generated root listing. No repository names, language assumptions, new dependency, additional module, or C4 element was introduced. The heading assertion now accepts any Markdown heading level, so harmless formatting changes do not fail the regression test. Directory links resolve to existing directories; okf-mcp reports them as non-blocking broken_link policy warnings because its concept graph does not represent bare directories. OKF section 8 explicitly allows directory links. The first complete suite attempt hit sandbox restrictions (listen/FSEvents/ps); the unchanged check is running with the required permissions.

Final verification: bun run check passed outside the sandbox, including Biome, TypeScript, Node tests and the full Bun suite. The final heading-level-only test adjustment also passed all four focused index tests. Existing lint warnings are outside the changed files. Specification review: both root choices produce navigation from actual contents, authoring keeps immediate entries current, nested contents remain behind directory links, and the independent validator reports no conformance errors. Quality review found no remaining blocking defect; the change uses existing storage ownership with no new source module or dependency. git diff --check passed. No live groma/ files changed and no scanner ran against the working tree; the regenerated full-bundle example and independent results are under /private/tmp/groma-okf-audit-lcn94knf. Existing bundles regenerate through groma init, without a migration or read-time write.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Groma now generates an OKF root index from immediate Markdown files and directories in the selected bundle folder. Initialization refreshes it, and shared document storage updates it when a top-level entry is added or removed. Relative links and filename ordering work across repositories and both groma/ and .groma/. Updated the Markdown contract and product documentation. Four new concurrent regressions fail before the fix and pass afterward; the repository check passes. Independent okf-mcp 0.9.1 validation reports conformant=true for fresh and populated examples under both roots and the regenerated 130-document repository bundle. Tool-specific source-link and directory-graph warnings remain separate from conformance.
<!-- SECTION:FINAL_SUMMARY:END -->
