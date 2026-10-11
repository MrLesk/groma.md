---
id: TASK-591
title: Harden audited surfaces and correct documentation drift
status: In Progress
assignee: []
created_date: '2026-09-27 01:23'
updated_date: '2026-10-11 16:37'
labels: []
dependencies: []
modified_files:
  - src/repository-listing.ts
  - plugins/scanners/entry-points/javascript.ts
  - plugins/scanners/angular/src/scan.ts
  - plugins/scanners/angular/src/project.ts
  - plugins/scanners/react/src/project.ts
  - plugins/scanners/typescript/src/projects.ts
  - plugins/scanners/swift/src/index.ts
  - src/scanner/modules/discovery.ts
  - src/markdown-emitter.ts
  - src/http-relationships.ts
  - src/viewers/web/server.ts
  - src/viewers/web/map-session.ts
  - src/viewers/web/work/island.ts
  - src/viewers/web/export.ts
  - src/viewers/web/containment.ts
  - src/cli.ts
  - src/welcome/model.ts
  - src/write-commands.ts
  - src/groma-filesystem.ts
  - plugins/work-sources/backlog/src/index.ts
  - src/work/pins.ts
  - docs/product-model.md
  - docs/component-markdown.md
  - docs/relationship-inference.md
  - docs/agent-instructions/inspect.md
  - CONTRIBUTING.md
  - .github/workflows/ci.yml
  - .github/workflows/release.yml
  - .github/workflows/architecture.yml
  - test-bun/backlog-cli.test.ts
  - test-bun/scanner-source-listing.test.ts
  - test-bun/cli-actions.test.ts
  - test-bun/web-hardening.test.ts
  - docs/viewers/web/index.md
priority: high
type: task
ordinal: 611000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
External security and correctness audit of groma.md v0.5.0 (HEAD 5882073a), triple-validated (independent discovery, adversarial re-derivation, source reproduction). 37 confirmed findings across the scanner surface, web viewer security, core CLI lifecycle, backlog work-source, and docs/CI truth.

Actor: an agent or person scanning/cloning an untrusted repository, running the CLI, or serving/viewing the map.
Entry points: groma scan/view/lint, the web viewer endpoints, the backlog work source, and the agent-facing docs.
Observable result: attacker-controlled repository content can no longer execute code, escape the repository root, mangle architecture files, or inject into the web viewer; CLI failures report cleanly; docs match the implementation; CI third-party actions are SHA-pinned.

This task tracks the remediation PR: 28 findings fixed in code/docs plus CI action pinning; 9 findings are reported for maintainer decision rather than fixed here.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Every fix has a focused regression test (or is docs/CI-only), and bun run check passes with no new lint warnings
- [ ] #2 The PR documents the one amended pinned test expectation (scanner-source-listing Shared.swift) with its rationale
- [ ] #3 Findings without code fixes are itemized in the PR with recommended remediation
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
Clean-up pass on the external audit pull request (#113), on top of today's main.
1. Merge origin/main. Main already reports an absent referenced TypeScript config (TASK-558), so its projects.ts replaces the pull request's version.
2. Renumber this record to TASK-591; main owns TASK-531.
3. Restore main's code where a change guards a case nobody reproduced in a supported flow, or duplicates another owner: Backlog field coercion, SIGKILL escalation and stream resync; the Swift 256 MB output limit; dropping symlinks that leave the repository; the re-measured numbers in relationship-inference.md; relationship row escaping; the process-wide module mock, the help-wording test and the hand-made DOM tests.
4. Web viewer: listen on the loopback interface only. Reject a stored code reference whose file is absolute or has a '..' segment in codeReferencesOf, the one owner of code reference validation, and delete the per-route checks and containment.ts.
5. Check every kept change against main: smallest form, no second copy, no misleading name or comment.
6. Rewrite this record to describe what the pull request contains afterwards.

Tests (rule and authority; wrong result caught; coverage gap):
- test-bun/backlog-cli.test.ts, 'a task id with shell characters never reaches the Backlog CLI' (kept from the pull request, moved here). Rule: readItem passes an id to the Backlog CLI only when it is letters, digits, '.', '_' and '-'; a task id is repository content and the Windows npm shim runs through cmd.exe (owner decision, lane step 3a). Wrong result: 'backlog task view' starts with the id 'TASK-1 & calc'. Gap: no other test passes an id to readItem.

- test-bun/scanner-source-listing.test.ts, 'the repository listing leaves out a symlink whose target is absent'. Rule: the listing holds the repository files that exist (src/repository-listing.ts contract) and a symlink without a target must not stop it (owner decision, lane step 3c). Wrong result: repositoryListing throws ENOENT from realpathSync, or lists the link, once the existence filter is dropped or reordered. Gap: no listing test holds a symlink without a target. Main's code already passes it; no code change was needed.

- test-bun/cli-actions.test.ts, 'a failed export prints its message and exits 1 without a stack trace' (kept from the pull request; now runs in its own temporary repository instead of this checkout). Rule: a command that fails prints the message and exits 1, as groma scan and groma view already do (audit finding D2-3, kept by the owner). Wrong result: groma export prints a source frame and stack lines, which main does for an unknown revision. Gap: no test runs groma export to a failure.

- test-bun/web-hardening.test.ts, 'the viewer accepts no connection on a network address'. Rule: the viewer listens on the loopback address only (owner decision, lane step 4a, from the external review). Wrong result: a client on the network that sends 'Host: localhost' gets the map; main answers 200 on the machine's network address. Gap: every other server test connects through loopback, and the Host check cannot stop a client that is not a browser.
<!-- SECTION:PLAN:END -->
