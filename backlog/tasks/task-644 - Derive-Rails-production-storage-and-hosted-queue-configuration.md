---
id: TASK-644
title: Derive Rails production storage and hosted queue configuration
status: In Progress
assignee:
  - '@codex'
created_date: '2026-10-29T20:08:00Z'
updated_date: '2026-10-30T08:34:00Z'
labels: []
dependencies: []
references:
  - plugins/scanners/ruby/src/index.ts
  - packages/scanner/src/index.ts
  - src/scan-reconciler.ts
  - src/relationship-inference.ts
  - docs/scanners/evidence.md
modified_files:
  - features/rails-runtime.feature
  - test/fixtures/ruby-coverage/config/database.yml
  - test/fixtures/ruby-coverage/config/deploy.yml
  - test/fixtures/ruby-coverage/config/puma.rb
  - test/fixtures/ruby-coverage/config/environments/production.rb
  - test-bun/ruby-runtime.test.ts
  - packages/scanner/src/runtime.ts
  - packages/scanner/src/index.ts
  - src/scanner/registry.ts
  - plugins/scanners/ruby/src/runtime.ts
  - plugins/scanners/ruby/src/index.ts
  - plugins/scanners/ruby/package.json
  - plugins/scanners/ruby/build.ts
  - src/scan-world.ts
  - src/scan-reconciler.ts
  - src/scan-entrypoints.ts
  - src/scan-runtime.ts
  - src/relationship-inference.ts
  - src/code-reference.ts
  - packages/scanner/package.json
  - bun.lock
  - docs/scanners/evidence.md
  - docs/component-markdown.md
  - docs/scanners/ruby/index.md
  - src/types.ts
  - src/architecture-markdown.ts
  - src/architecture-model.ts
  - src/core.ts
  - src/viewers/web/organisms/details.ts
  - test/fixtures/ruby-coverage/bin/jobs
  - groma/systems/groma-md/containers/cli/components/src-scanner.md
  - groma/systems/groma-md/components/scan-runtime.md
  - groma/systems/groma-md/components/scan-world.md
  - groma/systems/groma-md/containers/cli/components/ruby-src-runtime.md
  - groma/systems/groma-md/containers/cli/components/scanner-src-runtime.md
  - groma/systems/groma-md/containers/cli/components/scan-runtime.md
  - groma/systems/groma-md/containers/cli/components/scan-world.md
  - groma/systems/groma-md/containers/cli/components/ruby-src-index.md
  - groma/systems/groma-md/containers/cli/components/scanner-src-index.md
  - docs/scanners/ruby/validation.md
type: feature
ordinal: 701000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
NomadNest scans its Rails application but cannot express the PostgreSQL storage boundary or establish how queue execution is configured. Stage one uses checked-in production configuration as the supported example, without claiming a live deployment or beginning ERB/Hotwire ownership work.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The packaged Ruby scanner reads selected production PostgreSQL configuration with YAML aliases and embedded environment expressions without evaluating Ruby, reading environment values, or running application tools.
- [x] #2 Core establishes one owned PostgreSQL storage container for the declared application configuration, retains its logical database roles and source links, and derives an application-to-storage relationship without treating roles as deployed servers.
- [x] #3 The active production Solid Queue adapter, Puma plugin and Kamal setting establish hosted queue execution on the existing application; commented job roles and bin/jobs alone create no worker container.
- [x] #4 Stored configuration remains qualified as intended production configuration, preserves authored architecture and stable source identity across rescans, and is verified with the installed local package in NomadNest.
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
1. Add a feature scenario and packaged Rails configuration regression before implementation. Authority: approved stage one and the existing NomadNest PostgreSQL boundary. Wrong results: configuration omitted, ERB evaluated, production roles mistaken for four servers, or a worker inferred from a commented role. Existing Ruby tests cover Ruby source/ERB only. Use one minimal fixture with aliases, ignored staging data, production roles and hosted queue configuration, plus negative selection/setting variations.
2. Add temporary data-store and hosted-service evidence to the scanner SDK and its selection boundary. YAML parsing uses the existing js-yaml library as an explicit scanner dependency; Ruby expressions stay unresolved. Match the supported Rails production declarations syntactically.
3. Core owns one PostgreSQL container anchored by its exact configuration source and a derived connection from the declared application. Store production role details and hosted queue evidence in a core-owned Derived runtime configuration Markdown section, preserving other prose. In OKF this is ordinary linked supporting knowledge; in C4 the existing application and owned storage are containers, while queue hosting and logical roles are supporting configuration, not deployment nodes. Source facts contain no C4 IDs or kinds. This application-profile choice follows the approved single storage boundary and does not claim four servers or live deployment.
4. Extend focused coverage through storage reload/rescan and authored prose preservation. Keep files below 500 lines by moving existing scan-world record ownership into its own module as needed. Run focused checks, cold simplicity review, implementer specification/quality reviews and full-context complexity review, then bun run check.
5. Build/install local scanner and current core in NomadNest, inspect the persisted production boundary, source links and hosted queue result, then stop for human use before stage two.

Core source identity uses the existing Code reference on a configured storage container. Extend the current component-only Code validation to containers so database.yml can anchor the store directly, avoiding an artificial configuration component or a new identity field. The packaged persistence test covers this application-profile rule. NomadNest verification must use the rebuilt local core as well as the scanner.

NomadNest reproduced a YAML parse failure caused by ERB control flow in its unrelated test environment. Before parsing database YAML, retain only the supported default/production blocks; add that concrete regression to the existing fixture. Expose the persisted derived runtime section as read-only map details, since the existing overview parser intentionally omits named sections; keep it separate from editable authored prose.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Validation interrupted by host memory exhaustion. Kernel journal confirms a global OOM killed ChatGPT at 2026-10-29 22:29:39 SAST. The final full-check log ends during Vue tests, including a timeout; it has no completed suite result and must not be reported as passed. No remaining processes writing this task test/server logs were found in the host process namespace after restart. Heavy validation is stopped. Earlier focused validation passed 46 tests / 297 assertions; cold simplicity and full-context complexity reviews passed without blocking findings. Installed local core and scanner successfully created the PostgreSQL production container in NomadNest, verified four logical roles, hosted Solid Queue and source-file relationships in the rendered map; rescan created zero additional records. Full repository qualification remains open.

User reduced memory load and authorized a retry. Completed bun run check on the host with the map server stopped and a process-group memory guard. The guard did not trigger; minimum sampled MemAvailable was 5473 MiB. Lint and TypeScript passed (existing unrelated warnings), Node 26/26 passed, Bun 908 passed / 64 skipped / 31 failed. Remaining failures: 22 missing JVM tools (java/javac/jar/keytool), 6 missing swiftc, and 3 native npm CA-configuration failures whose underlying cause is unverified. Ruby/ERB/production runtime assertions passed in the full run. Log: /tmp/groma-runtime-retry-check.log. Full repository check remains non-green; DoD 2 stays open. Corrected only obsolete scanner-limit statements in NomadNest project/database-schema overviews through the local CLI, retaining responsibility descriptions and source ownership.

Submission branch is independent of ERB and rebased onto upstream b088b2ee. Branch-specific bun run check: lint/types pass; Node 26 pass; Bun 914 pass, 64 skip, 31 fail / 4046 assertions. The 22 JVM-tool, 6 swiftc and 3 unresolved npm CA failures remain; all Ruby/runtime assertions pass. Memory guard did not trigger (minimum available 5617 MiB). Focused isolated package checks: 8 pass / 93 assertions. Refreshed architecture and combined each new source into the existing scan results, scanner SDK or Ruby scanner responsibility; unrelated scan additions excluded. DoD 2 remains open for repository qualification.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Derives intended production PostgreSQL storage and hosted Solid Queue/Puma configuration with source-linked read-only map details. Installed scanner and core verified in NomadNest, including a stable rescan. Focused checks and required reviews pass; full local suite retains 31 failures, so repository qualification remains open. Submitted for upstream review with this limitation disclosed.
<!-- SECTION:FINAL_SUMMARY:END -->
