---
id: TASK-670
title: Allow npm installs when Node inherits the bundled CA option
status: Done
assignee:
  - '@codex'
created_date: '2026-11-19T17:59:00Z'
updated_date: '2026-11-19T18:07:00Z'
labels:
  - cli
dependencies: []
references:
  - src/certificate-trust.ts
  - test-bun/npm-trust.test.ts
  - https://github.com/MrLesk/Backlog.md/actions/runs/44475923160/attempts/2
modified_files:
  - test-bun/npm-trust.test.ts
  - src/certificate-trust.ts
type: bug
ordinal: 710000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Groma’s GitHub Action runs plugin installation with Node’s bundled certificate authorities selected. When Groma installs the Backlog.md work source through npm, it also selects OpenSSL’s authorities. Node 26.12.1 rejects the two active modes before npm starts, so the architecture map fails to publish.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The Backlog.md work source installs through npm when the parent sets NODE_OPTIONS=--use-bundled-ca.
- [x] #2 The installer still verifies the registry using the configured, filtered certificate authorities and preserves unrelated Node options.
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
1. Reproduce the hosted Action failure by giving the existing npm global-install test its bundled CA option. The test already exercises an HTTPS registry with its own CA, but it does not set the Node option from the failed run.
2. When preparing child processes, disable the bundled store before selecting OpenSSL with Node’s own boolean flags. Preserve inherited options and existing CA filtering and strict TLS settings.
3. Run the new regression against the old and fixed code. Check the related trust tests, a real npm install with the Action’s Node version, and the repository check.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
The updated npm integration test failed on the original code with the same install error as the hosted workflow. With the fix, all 11 npm and certificate checks passed on Node 26.12.1 and npm 12.2.1. In a disposable checkout of Backlog.md at c03a60e1, the compiled Groma command restored the work source into an empty npm prefix, installed Backlog.md 1.55.3, and exported the HTML map. An inherited Node preload whose filename contained a space ran during the npm install.

The complete repository check passed with the CI runtime, Node 26.12.1 and its bundled npm 11.20.0. The Node suite passed all 26 tests. The local Bun suite passed 958 tests and skipped 67 gated checks. The repair restores the documented plugin installation flow and requires no documentation or architecture changes.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Groma now clears Node’s bundled CA setting before selecting OpenSSL for the child installer. The installer keeps the caller’s other Node options and uses the configured filtered CA bundle. The regression test exercises installation against a private HTTPS registry with the option used by the hosted Action.
<!-- SECTION:FINAL_SUMMARY:END -->
