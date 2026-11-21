---
id: TASK-640
title: Export a map subset using includeFilter and excludeFilter
status: Done
assignee:
  - '@claude'
created_date: '2026-10-28T20:33:00Z'
updated_date: '2026-11-21T15:59:00Z'
labels:
  - personalization
milestone: m-6
dependencies:
  - TASK-639
references:
  - src/cli.ts
  - src/viewers/web/export.ts
  - src/architecture-model.ts
documentation:
  - ROADMAP.md
  - docs/viewers/web/index.md
  - docs/component-markdown.md
modified_files:
  - src/tag-selection.ts
  - src/viewers/web/runtime.ts
  - src/viewers/web/export.ts
  - src/cli.ts
  - test-bun/tag-subset.test.ts
  - test-bun/web-export.test.ts
  - docs/viewers/web/index.md
  - docs/component-markdown.md
  - docs/product-model.md
type: feature
ordinal: 704000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
A map author can export only the architecture relevant to an audience by supplying includeFilter and excludeFilter. The exported map contains the selected subset instead of the full map with dimmed elements.

Reuse the same tag matching rules as the interactive web filter. The export/projection flow owns selection of the exported view; source OKF documents, C4 identities, containment, and authored relationships remain unchanged.

Before implementation, confirm one filtered-export example covering parent context and relationships. The proposed rule retains the parents needed to understand a matching element and only relationships whose endpoints are retained. Define include/exclude overlap in that example rather than adding a general query language.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The supported map export entry point accepts includeFilter and excludeFilter, separately and together.
- [x] #2 Exports contain the selected subset according to the same tag matching rules as the web map; excluded architecture is absent rather than merely dimmed.
- [x] #3 One approved example documents include/exclude overlap, required parent context, and which relationships remain.
- [x] #4 Retained architecture keeps its authored metadata, and exporting does not modify the source architecture.
- [x] #5 An export that fails says why in one line, exits with status 1 and writes nothing to the output directory
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
1. Rule in core, beside selectByTags (src/tag-selection.ts): subsetByTags(world, { include, exclude }). Include keeps what its tags select and the parents that hold it; an empty include keeps everything. Exclude then removes what its tags select and wins over include. A relationship stays when both ends stay, a flow stays when all its steps stay, and a subset carries no scan findings because they name files across the whole project.
2. Export: groma export takes --include-filter and --exclude-filter as comma-separated tags. The map loader applies the subset before layout, so the exported sheet is laid out for the subset and only retained components contribute source text. An include filter that selects nothing fails with a message naming the tags, instead of writing an empty site.
3. Docs: web viewer static publication section and the worked example in the Markdown contract.

Tests (authority: acceptance criteria 1 to 3).
- subsetByTags on a minimal world: include keeps matches and parents; exclude removes a subtree and wins when both name the same element; a relationship with a removed end and a flow with a removed step are gone. Wrong result caught: an excluded part or its relationship survives, or a parent is lost. Gap: no subset rule exists.
- Export: excluding the tag of the only component publishes neither the component nor its source text. Wrong result caught: an excluded part leaks into a public export. Extends the existing export test.

Failing cleanly (src/cli.ts, src/viewers/web/export.ts): the export command reports a failure as the other commands do, the message alone and exit status 1. The exporter writes its first file only after the snapshot exists, so a failed export leaves nothing behind. Test, extending the existing empty-filter case of test-bun/web-export.test.ts: rule "a filter that leaves no element fails instead of writing an empty site" (the documented behaviour of this task); wrong result: the failed export leaves a directory with render.js; gap: the case only checked that the export rejects.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Decisions: the flags are --include-filter and --exclude-filter with comma-separated tags, the same text form as groma edit --tags. The subset is taken before layout, so the exported sheet is laid out for what remains and only retained components contribute source text; this is what keeps an excluded part out of a public export. The worked example in the Markdown contract was written by the implementer, not confirmed by Alex beforehand. Not changed, existing behavior: an export error prints a stack trace, as --from without --revision already does.

Verification: bun run check passed (28 Node tests, 1014 Bun tests, 64 environment-dependent skips, 0 failures). On groma.md own map, groma export --include-filter scanning --exclude-filter terminal wrote a site with 1 system, 4 containers and 53 components laid out on their own, and --include-filter with an unused tag failed naming the tag. The export test proves an excluded component and its source text are absent from the published payload.

Automated PR review, applied: a comparison export read the union of both commits owned files for each snapshot, so a component excluded in the newer commit still published its newer source. A filtered snapshot now reads only the files its own subset owns; a two-commit export test fails without the fix. Criterion 3 is unchecked and the task is back in progress: the worked example is the implementer proposal and waits for Alex to approve it.

Cold simplicity review (one round), applied: the filter is built once in the command as a TagFilter and is absent when both flags are empty, so filtered has one meaning from the command to the source reads; the guard against an empty result now checks the exported commit only and says the filter leaves no element, so a comparison whose older commit lacks the tag no longer fails and the message is true when include and exclude name the same tag; the worked example excludes internal instead of legacy, which the Tags sample puts on the container itself; the subset comment states that draft ids pass through.

Criterion 3: Alex approved the worked example on 2026-11-19 ("I approve the example"), shown to him as the table of the section Exporting a subset in docs/component-markdown.md. The table has the same rows on this branch and at the top of the stack; later pull requests only extend the prose above it for groups and flows.

2026-11-21, the owner walking the filtered export. Found by the coordinator while walking it for him: groma export --include-filter with a tag that selects nothing failed with a raw stack trace and left the new output directory behind with render.js in it. Any other export failure, such as an unknown --revision, printed a stack trace as well: the export command was the only one that did not catch its error.

Fixed. The export command now reports a failure as the other commands do: the message alone, exit status 1 (src/cli.ts). The exporter creates the output directory and writes its first file only after the snapshot exists (src/viewers/web/export.ts), so a failed export leaves nothing behind. Verified from the command line on this branch: --include-filter with a tag nothing carries prints "The export filter leaves no element to export", exits 1 and leaves no directory; an unknown --revision prints the one line git gives, exits 1 and leaves no directory; an ordinary export writes the same seven files as before. The extended test fails on the former order (the directory exists) and passes now. bun run check: see the task commit. The pull requests above this one do not have the commit until the stack is restacked.
Raised with the owner, not built: a filter that names a tag nothing carries is ignored without a word, so a mistyped --exclude-filter publishes the whole map with exit status 0.

bun run check on this branch after the fix: 965 pass, 67 skip, 0 fail.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
groma export takes --include-filter and --exclude-filter. subsetByTags in core keeps what the include tags select with its parents, removes what the exclude tags select (exclude wins), and keeps only relationships and flows whose ends remain. The map loader applies the subset before layout, so excluded architecture and its source text are absent from the output. The web viewer docs and the Markdown contract document the rule with one worked example.
<!-- SECTION:FINAL_SUMMARY:END -->
