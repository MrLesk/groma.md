---
id: TASK-531
title: Harden audited surfaces and correct documentation drift
status: In Progress
assignee: []
created_date: '2026-09-27 01:23'
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

This task tracks the remediation PR: 29 code/doc fixes plus CI pinning; 8 design-level findings are reported for maintainer decision rather than fixed here.
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
