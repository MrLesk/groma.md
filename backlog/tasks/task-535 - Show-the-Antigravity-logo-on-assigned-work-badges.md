---
id: TASK-535
title: Show the Antigravity logo on assigned work badges
status: Done
assignee:
  - '@codex'
created_date: '2026-10-03 20:58'
updated_date: '2026-10-03 21:00'
labels: []
dependencies: []
references:
  - 'https://antigravity.google/press'
  - button
modified_files:
  - src/viewers/web/atoms/marks.ts
type: enhancement
ordinal: 620000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Work assigned to Antigravity currently shows a letter monogram, while Codex and Claude use their vendor logos. Alex requested the same logo treatment for Antigravity.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Work assigned to @antigravity displays the official Antigravity logo through the existing agent badge flow.
- [x] #2 The Antigravity mark remains readable in light, dark and blueprint themes.
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
1. Add the official one-colour Antigravity SVG to the existing MARKS registry, using the theme ink like Codex. 2. Verify fillWorkBadge renders the mark for @antigravity in browser previews across themes and run bun run check. This adds a decorative mark to an existing selection flow; no new tests or architecture concepts are needed.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Added the official one-colour icon from https://antigravity.google/assets/image/brand/antigravity-icon__one-color.svg to MARKS under antigravity. Preserved its path and viewBox, removed fixed dimensions, and changed the fill to theme ink like Codex. Browser verification used the actual WORK_BADGE and fillWorkBadge flow for @antigravity beside @codex and @claude: the new mark rendered as an 18px SVG, with theme ink RGB 34/38/46 in light, 230/232/235 in dark and 216/243/255 in blueprint. Screenshots confirmed readability in all themes. Own specification and quality review found the change stays inside the shared mark registry; badge selection, progress, navigation and architecture boundaries are unchanged. No new tests or public contract documentation are required for this decorative asset.

bun run check passed: lint, type checking and Node/Bun suites completed successfully. Bun reported 750 pass, 48 skip, 0 fail. git diff --check passed.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added the official Antigravity one-colour SVG to the existing agent mark registry. Work assigned to @antigravity now displays its logo with theme ink, following Codex. Verified the actual badge renderer and readable appearance in light, dark and blueprint themes. bun run check passed.
<!-- SECTION:FINAL_SUMMARY:END -->
