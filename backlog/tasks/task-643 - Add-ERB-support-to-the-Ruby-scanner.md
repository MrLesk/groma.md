---
id: TASK-643
title: Add ERB support to the Ruby scanner
status: In Progress
assignee:
  - '@codex'
created_date: '2026-10-29T19:39:00Z'
updated_date: '2026-10-30T08:35:00Z'
labels: []
dependencies: []
references:
  - plugins/scanners/ruby/src/index.ts
  - plugins/scanners/ruby/src/parser.ts
  - features/ruby-rails.feature
modified_files:
  - features/ruby-rails.feature
  - test/fixtures/ruby-coverage/app/views/items/index.html.erb
  - test-bun/ruby-erb.test.ts
  - plugins/scanners/ruby/src/erb.ts
  - plugins/scanners/ruby/src/index.ts
  - plugins/scanners/ruby/src/entries.ts
  - plugins/scanners/ruby/package.json
  - docs/scanners/ruby/index.md
  - bun.lock
  - docs/scanners/ruby/validation.md
  - groma/systems/groma-md/components/erb.md
  - groma/systems/groma-md/containers/cli/components/erb.md
  - groma/systems/groma-md/containers/cli/components/ruby-src-index.md
type: feature
ordinal: 700000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Rails views and other ERB templates are absent from Ruby scans. Developers need selected templates and their embedded Ruby to participate in the existing source inspection flow without evaluating templates.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The packaged Ruby scanner selects and discovers .erb templates, including compound extensions, and assigns existing project membership.
- [x] #2 Embedded Ruby declarations retain original template lines and positions across execution and output tags, including cross-tag control flow; comments and escaped tags contribute no Ruby evidence.
- [x] #3 ERB templates participate in the existing Rails source membership without inventing launch entries or resolved render relationships; documentation explains the supported syntax and limits.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Acceptance criteria have objective verification evidence.
- [ ] #2 Relevant checks pass and changes remain task-scoped.
- [x] #3 Public contracts or documentation are updated when behavior changes.
- [x] #4 Implementation Plan reflects the final approach; correction history and verification are recorded in Implementation Notes.
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Add the ERB scan scenario, then a packaged regression using the existing Rails coverage fixture. Existing Ruby tests cover source selection and locations only for Ruby files; the new case detects skipped ERB, wrong offsets, invented declarations from literal text, and missing Rails membership (AC 1-3).
2. Project ERB execution/output tags into Ruby with original UTF-16 offsets and newlines. Reuse Ruby declarations and project membership; omit launch evidence and duplicate-body comparison for templates because literal output is not Ruby syntax.
3. Select/discover .erb in the manifest, bump the scanner package version, and document the supported tags and limits. This changes source evidence only: existing Code references express it in OKF; core retains C4 identity and placement. No new stored concepts.
4. Run focused packaged tests and bun run check; review specification, ownership and test behavior.

5. Install the local package into NomadNest and scan its existing ERB views. A reproduced cross-tag case/when failure authorizes the minimal projection correction and regression before reinstalling and rescanning.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Packaged regression first failed because ERB was omitted, then passed after implementation. Final focused Ruby suite: 8 passed, 0 failed, 84 assertions. Covers UTF-16 offsets after a non-BMP character, original lines, adjacent output tags, cross-tag conditionals and output blocks, comments and escaped openings, project membership, Rails membership, deterministic scan order and unchanged source. Specification and quality review passed for the supported flow; the test identifies the project by its declaration rather than fixture product wording. Documentation and scanner version 0.1.1 are updated. No live architecture scan was run and groma/ is unchanged. Full repository check results are recorded separately; DoD 2 remains pending until that gate passes.

Final bun run check: lint and TypeScript passed (only existing warnings outside changed files); Node 26 passed, 0 failed; Bun 889 passed, 64 skipped, 49 failed. ERB regression also passed in the full suite. Failures include missing java/javac/jar/keytool and swiftc, plus package installation/update failures reporting EROFS in Bun temporary/cache locations. Logs: /tmp/groma-erb-final-check.log. Full check is not green; no baseline equivalence or complete qualification is claimed. Task remains In Progress with DoD 2 open. Changes are uncommitted pending user confirmation.

NomadNest installation: backed up .groma and tools/ruby-scanner under /tmp/nomadnest-erb-before-5jp8kcjo, rebuilt the local scanner, and added **/*.erb to the existing Ruby include list. Readiness passed; actual scan retained prior Ruby data after a syntax error at app/views/admin/flags/_flag.html.erb:18:5. Cause: redundant opening-delimiter semicolon before when. Extend the existing regression with cross-tag case/when; the concrete failure is rejection of a valid selected Rails view (existing coverage included if/else and do/end only).

NomadNest end-to-end validation succeeded after removing the redundant opening-tag separator. The added cross-tag case/when fixture failed before that one-line correction and passed after it. Rebuilt scanner 0.1.1 into /home/stephen/Work/nomadnest/tools/ruby-scanner and retained its existing plugin source, exclusions and other scanner settings; only **/*.erb was added to the Ruby include list. groma scanner check passed for Ruby and JavaScript. groma scan created 91 template records, refreshed 45 and reported 54 duplicate-logic findings, with informational scanner diagnostics only. All 91 app ERB templates have stored references, no missing templates or duplicate owners. CLI source lookup verified the failing flags partial, application layout, Turbo Stream response and JSON PWA manifest under rack-application. Existing architecture records and descriptions were retained. Initial template records remain uncurated; no app source was changed. Focused Ruby suite still passes 8 tests / 84 assertions. Re-running the required complete check after the projection fix.

Final verification after the NomadNest correction: second groma scan succeeded with created 0, refreshed 136, findings 54; no duplicate template records. Specification and targeted quality re-review of the separator correction passed. Complete bun run check again passed lint, TypeScript and Node 26/26; Bun 889 passed, 64 skipped, 49 failed, including the ERB test passing. Full-check limitations remain missing JVM/Swift tools and Bun temporary/cache write failures; log /tmp/groma-erb-nomadnest-check.log. NomadNest end-to-end installation/scan is verified; general repository qualification remains open.

Submission validation: the completed memory-guarded full check reported lint/types and 26 Node tests passing; Bun 908 passed, 64 skipped and 31 failed. Failures include 22 missing JVM tools, 6 missing swiftc and 3 native npm CA-configuration failures with an unverified underlying cause. ERB assertions passed. Full repository qualification remains open.

Submission branch is independent of runtime configuration and rebased onto upstream b088b2ee. Branch-specific bun run check: lint/types pass; Node 26 pass; Bun 914 pass, 64 skip, 31 fail / 4040 assertions. Failures retain the 22 JVM-tool, 6 swiftc and 3 unresolved npm CA categories. All Ruby/ERB assertions pass. Memory guard did not trigger (minimum available 4371 MiB). Focused isolated package checks: 8 pass / 87 assertions. Added ERB projection source to the existing Ruby source scanner responsibility through Groma CLI. DoD 2 remains open for repository qualification.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Adds packaged ERB scanning with source positions preserved and launch evidence excluded. Verified against 91 NomadNest templates and a stable repeat scan. Focused checks pass; full local suite remains non-green. Submitted for upstream review with this limitation disclosed.
<!-- SECTION:FINAL_SUMMARY:END -->
