---
id: TASK-571
title: Page the output of every command through one shared window
status: To Do
assignee: []
created_date: '2026-10-08 15:14'
updated_date: '2026-10-08 15:31'
labels: []
dependencies: []
references:
  - src-list-window
  - src-cli
  - src-core
  - src-lint-command
  - instructions
  - src/list-window.ts
  - docs/agent-instructions/inspect.md
  - docs/product-model.md
type: enhancement
ordinal: 648000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Coding agents read groma.md through shell tools that cut long output. Claude Code, Codex and Grok each truncate a tool result above a size limit, and small local models have small context windows. When a command prints more than the tool shows, the agent loses part of the answer without noticing.

groma.md already has one paging helper, src/list-window.ts. It gives plain lists `--max-count <n>` (default 50 items), `--skip <n>` and `--count`, named after `git log` and `grep`, and ends a partial page with the printed range, the total and the exact command for the next page, for example `Showing 1-50 of 86 items. Next: groma view cli --plain --skip 50`. The plain views in src/plain-world.ts, `groma lint`, `groma scanner list` and `groma scanner discover` use it. Item counts do not bound size: the first page of `groma view cli --plain` is 14.5 KB on this repository, because every child carries its overview. Other read outputs are not paged at all: the complete record printed by `groma view <id>` (the docs say it "stays whole"), `groma agent-instructions` and its guides (the index is about 6 KB, the structure guide about 13 KB), `groma instructions` printed as plain text, and `groma scanner discover --json`.

Page these read outputs through the one helper:
- `groma view` in every plain form, and the complete record printed by `groma view <id>`
- `groma agent-instructions` and every guide it prints
- `groma instructions` printed as plain text
- `groma lint`, `groma scanner list` and `groma scanner discover`, including `--json`
Out of scope: mutation acknowledgements (add, draft, edit, remove, accept, init), help, errors, startup messages, the interactive terminal and browser maps, and the `groma scan` report, which stays unpaged because a second page would scan again.

The rules:
- Lists page by item. Guides and Markdown records page by line, like `head` and `sed -n`.
- A default page holds as many items or lines as fit a fixed byte budget; `--max-count` caps the count further. Choose the budget below the output limits of Claude Code, Codex CLI and Grok CLI, and record the budget, the measured limits and the tool versions in the implementation notes. Everything the command prints counts toward the budget: headings, repeated context, the footer and JSON encoding.
- A page always holds at least one item or line, even when that one alone exceeds the budget, so reading always makes progress.
- The footer names the exact command for the next page. When the command read its targets from stdin, the footer says to repeat the same input with `--skip <n>` instead, because the printed command cannot replay stdin.
- A JSON result carries the page's items or lines, the total and the next `--skip` value, or null on the last page. A JSON result with several collections, such as `groma scanner discover --json`, pages one combined list in a documented order, each item naming its collection.
- Offsets are enough: output is deterministic for one architecture revision, so `--skip` works as the cursor and nothing is stored between calls.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The read outputs listed in the description page through src/list-window.ts, and no command implements its own windowing.
- [ ] #2 Lists page by item and guides and records page by line, with the same --max-count, --skip and --count flags and the same footer; after stdin input the footer says to repeat the same input with --skip.
- [ ] #3 A default page stays within a fixed byte budget that counts everything printed, recorded in the implementation notes with the measured limits and versions of Claude Code, Codex CLI and Grok CLI; an item or line larger than the budget is printed alone on its page.
- [ ] #4 JSON results carry the page's items or lines, the total and the next --skip value or null, and groma scanner discover --json pages one combined list in a documented order.
- [ ] #5 Joining the page payloads in order, without footers and repeated context, reproduces every item or line exactly once.
- [ ] #6 The Paging section of the inspect guide and docs/product-model.md describe the one paging contract.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Acceptance criteria have objective verification evidence.
- [ ] #2 Relevant checks pass and changes remain task-scoped.
- [ ] #3 Public contracts or documentation are updated when behavior changes.
- [ ] #4 Implementation Plan reflects the final approach; correction history and verification are recorded in Implementation Notes.
<!-- DOD:END -->
