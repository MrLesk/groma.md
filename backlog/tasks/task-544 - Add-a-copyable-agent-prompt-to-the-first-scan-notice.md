---
id: TASK-544
title: Add a copyable agent prompt to the first-scan notice
status: Done
assignee:
  - '@codex'
created_date: '2026-10-05 09:54'
updated_date: '2026-10-05 10:04'
labels: []
dependencies: []
references:
  - shell
modified_files:
  - src/viewers/web/chrome/empty.ts
  - docs/viewers/web/index.md
type: enhancement
ordinal: 629000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The First scan notice tells the map reader to ask a coding agent for curation but does not give them text to send. Alex requested a visible agent prompt and a clipboard button in that notice.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The First scan notice displays a ready-to-use prompt directing a coding agent to the Groma curation instructions.
- [x] #2 A copy button copies the displayed prompt and confirms successful copying.
- [x] #3 Existing notice visibility and dismissal behavior remain unchanged.
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
1. Keep the repository-neutral curation prompt, presentation, and clipboard handler in the existing web empty-state module. Point to the installed agent guide workflow and explicitly describe existing architecture without changing application code. This UI guidance belongs to Map controls (shell); it adds no stored OKF fields or C4 concepts. 2. Use the existing first-scan visibility class and shared button style. Copy the displayed text, confirm only after clipboard success, and restore Copy prompt after two seconds. 3. Document the browser behavior. Existing first-scan coverage and real browser click/paste checks are sufficient; add no exact-prose or decorative assertions. 4. Run bun run check, perform scoped implementer reviews, then commit and push task-owned files as requested.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
The user clarified that this feature serves other peoples repositories, not the architecture of Groma itself. The prompt is repository-neutral. Browser verification uses a temporary local sample world and the actual web page and empty-state module; it does not read or scan the live groma/ tree. Verified a real click and paste copies the entire displayed prompt and changes the button to Copied. Empty and no-component states omit the prompt. The initial full check was blocked by sandbox restrictions on local servers and file watchers; rerunning with the required local process permissions.

Verification: the actual page styles and notice controller were exercised in Chrome with one generic uncurated component. Clicking Copy prompt and pasting into a textarea produced the full displayed text and Copied feedback. Empty and no-component states omit the prompt; adding a description or selecting a historical state hides the notice; dismissal removes it. The four focused first-scan tests pass. bun run check passed outside the sandbox: lint, scrollbar rules, TypeScript, Node tests, and Bun tests (759 passed, 48 skipped, 0 failed). Full log: /tmp/groma-task-544-check-unrestricted.log. git diff --check passes. No groma/ files changed. Specification and quality review: all requested behavior is present; renderPage renders the existing notice, emptyState adds the text and button, and createEmptyState copies the rendered prompt after a click. The existing first-scan class owns visibility. No additional modules, dependencies, architecture records, or exact-prose tests were needed. The change adds 19 lines to the existing UI module and five documentation lines; unrelated changes remain untouched.

User-requested advice from claude -p --model claude-fable-5-1 completed successfully. The consultation used only a generic UI scenario and example wording; automatic approval review rejected sending repository files and the diff, so Claude did not review implementation code. Main recommendation: shorten the prompt to point to groma agent-instructions and explicitly describe existing architecture without changing application code. Suggested wording: Curate this repository architecture with Groma. Run groma agent-instructions and follow its curation workflow. Describe the architecture as it exists today; do not change application code. Claude agreed that Copied should appear only after clipboard success, and also suggested a temporary success label. The implementer considers the shorter prompt useful and a label reset optional polish, not a completion blocker. Advice is reported for user review; no further code changes were requested or applied.

Alex approved the proposed prompt and temporary Copied label, and requested commit and push. The underlying model and architecture ownership remain unchanged; no new source files or imports are needed.

Applied the approved shorter prompt and two-second Copied label. Chrome verification on the generic one-component sample confirmed the complete revised text reaches the clipboard, Copied appears on success, and Copy prompt returns afterward. No model or ownership changes, source files, imports, or dependencies were added. Targeted re-review found no defects introduced by the prompt and timer refinement. The final bun run check passed; full log is /tmp/groma-task-544-final-check.log. git diff --check passes and git status --short groma/ is empty, so no task-owned architecture changes need folding into the commit.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
The First scan notice displays a repository-neutral prompt that directs coding agents to groma agent-instructions and asks them to describe existing architecture without changing application code. Copy prompt copies the displayed text, confirms success with Copied, and restores its label after two seconds. Existing visibility and dismissal behavior remains intact. Browser click/paste and timed-label checks passed with generic sample data, and bun run check passed. Web viewer documentation was updated. Alex approved the refinement and requested commit and push.
<!-- SECTION:FINAL_SUMMARY:END -->
