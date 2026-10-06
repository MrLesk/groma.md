---
id: TASK-545
title: Run web scanner setup once across simultaneous submissions
status: Done
assignee:
  - '@codex'
created_date: '2026-10-05 10:27'
updated_date: '2026-10-05 10:42'
labels: []
dependencies: []
references:
  - web-server
documentation:
  - docs/component-markdown.md
  - docs/scanners/setup.md
modified_files:
  - test-bun/web-startup.test.ts
  - src/viewers/web/server.ts
  - docs/scanners/setup.md
priority: high
type: bug
ordinal: 630000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The live Keycloak talk demo installs the current Java, JavaScript, React and TypeScript 0.2.1 scanners, then fails before opening its map because the same component ID is stored under two generated containers. The web host starts every setup submission immediately, so simultaneous Install & scan submissions can create overlapping map sessions that write the same architecture. The talk can submit the shared setup from more than one slide window. Restore the supported first-run web flow without changing architecture identity rules or scanner versions.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Simultaneous submissions of the same web scanner setup perform one installation and initial scan and open one usable map.
- [x] #2 Every waiting setup caller receives the completed setup response, and readiness waits for that operation.
- [x] #3 The fresh live Keycloak demo opens its complete map without duplicate IDs using the current installed scanners, and tracked source files remain unchanged.
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
1. Reproduce simultaneous scanner setup through the real HTTP server and a local fixture scanner. Existing web-startup coverage handles one submission only. The authority is the reproduced duplicate-ID failure in the supported talk flow and the web-host contract that one server owns one map. The smallest added test sends two setup submissions while the first scan is pending; it checks one scanner execution, completed responses, readiness and a loadable world. Prove it fails before the fix.
2. Keep ownership in src/viewers/web/server.ts. Share the in-flight setup operation and return a separate Response to each caller, so no second map session can start for the same pending setup. Preserve normal setup errors and the existing ready-map behavior. This is workflow ownership only: OKF documents remain ordinary linked Markdown, C4 components and containers keep their existing meaning, and Groma retains its unique stable IDs.
3. Run the focused web-startup tests, then bun run check. Perform own specification and quality reviews. Restart only the owned live Java demo through the addon, repeat its clean clone and setup, and verify complete architecture and unchanged tracked sources. Preserve the curated Keycloak project and the existing order-service demo.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Alex confirmed that speaker and presenter views run at the same time in the supported talk. Both can submit the shared scanner setup, so simultaneous submissions are part of the required flow. The new regression test uses two concurrent HTTP submissions with a held local scanner and checks one scan, completed responses, readiness and a usable world. The first test invocation could not bind a local server in the sandbox; run the test with local-server access before evaluating the regression.

The corrected regression fixture fails before the production change: two simultaneous scanner setup submissions execute the scanner twice (expected one, observed two), while both responses are 303. The web host now shares its pending setup Promise and clones the resulting Response for every caller. Installation, initial scanning and map creation therefore belong to one setup operation. Alex also confirmed that advancing from either talk view must have the same result; no view is restricted or given priority.

All five focused web-startup tests pass with the fix, including the simultaneous-submit regression: one held scanner run, both setup responses complete, readiness waits, and the resulting world contains its source component. Updated the setup guide to explain the shared pending operation across browser windows. The change preserves existing C4 identity and containment and adds no OKF metadata or architecture concept.

bun run check passes: 16 Node tests, 760 Bun tests, 48 environment-dependent skips and zero failures. The existing two Biome warnings and two infos are unchanged. git diff --check passes and groma/ has no changes. Own quality review traces setup requests through prepare, the shared pending action, installation, one initial map session and cloned responses. The original Response stays unread so every caller can safely receive a clone. Existing setup errors, progress and readiness remain covered. This small behavior-preserving lifecycle fix needs no external architecture review.

Live verification kept speaker and presenter views open together and alternated controls: cloned from the presenter view, advanced to setup from the audience view, initialized from the presenter view, and installed/scanned from the audience view. Both views stayed synchronized. Later map advances from each view also worked. The actual Java, JavaScript, React and TypeScript 0.2.1 scanners completed; startup reported one map preparation and one opening. Readiness returned 204 and the complete world contained 7,400 elements, 169 relationships and 1,823 findings, with unique IDs. Evidence: /private/tmp/groma-545-live.log, /private/tmp/groma-545-live-result.json and /private/tmp/groma-545-live-map.jpg. The before/after snapshots cover 13,367 tracked source files and have the same SHA-256 c77cc6f4c387c09d38f3c657c7eb56094479c3d6d2ea7c1c47f8ea5fd0c01cdd. Reset only the disposable live Java clone; preserved the curated Keycloak project, the order-service demo and the running deck. Restored the original browser tab to live-java at click 4 and closed the temporary second view.

Specification review: all three acceptance criteria are met by the failing-then-passing simultaneous-submit regression, completed independent responses and readiness checks, and the actual two-view Keycloak run with unchanged sources. The final plan matches the implementation, the setup documentation describes shared ownership, and the quality review found no supported-flow defect or unnecessary abstraction. No scanner package, addon source, architecture identity rule or version was changed.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Simultaneous speaker and presenter setup submissions previously started overlapping first scans and produced duplicate architecture IDs. The web host now shares one pending setup operation and gives each caller its own completed response. Either talk view can advance normally. The regression failed with two scans before the fix and passes with one scan after it; all five focused tests and bun run check pass. The real two-view Keycloak demo opens its full map with unique IDs and unchanged tracked sources.
<!-- SECTION:FINAL_SUMMARY:END -->
