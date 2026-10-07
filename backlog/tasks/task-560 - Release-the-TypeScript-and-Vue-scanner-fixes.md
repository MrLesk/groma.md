---
id: TASK-560
title: Release the TypeScript and Vue scanner fixes
status: In Progress
assignee:
  - '@claude'
created_date: '2026-10-07 23:08'
updated_date: '2026-10-07 23:08'
labels: []
dependencies: []
references:
  - plugins/scanners/typescript/package.json
  - plugins/scanners/vue/package.json
modified_files:
  - plugins/scanners/typescript/package.json
  - plugins/scanners/vue/package.json
  - bun.lock
type: chore
ordinal: 643000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
TASK-557, TASK-558 and TASK-559 changed @groma/scanner-typescript and @groma/scanner-vue, whose manifests still name the published 0.2.1 and 0.2.2. The release workflow reuses published versions, so npm users such as FunstageGmbH/Buzzinga-web would not receive the fixes. The other scanners only bundle a comment change in the shared typescript-outline.ts and keep their versions.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 @groma/scanner-typescript is versioned 0.2.2 and @groma/scanner-vue 0.2.3 in their manifests and bun.lock; no other package version changes.
- [ ] #2 The packages are published only after the maintainer starts the release workflow with publish_scanners.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Acceptance criteria have objective verification evidence.
- [ ] #2 Relevant checks pass and changes remain task-scoped.
- [ ] #3 Public contracts or documentation are updated when behavior changes.
- [ ] #4 Implementation Plan reflects the final approach; correction history and verification are recorded in Implementation Notes.
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Bump the two manifests and their bun.lock workspace entries.
2. Leave publication to the maintainer: Actions -> release workflow -> Run workflow with publish_scanners enabled.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Bumped @groma/scanner-typescript 0.2.1 -> 0.2.2 and @groma/scanner-vue 0.2.2 -> 0.2.3 in their manifests and bun.lock; bun install --frozen-lockfile accepts the lockfile. Publication waits for the maintainer to run the release workflow with publish_scanners.
<!-- SECTION:NOTES:END -->
