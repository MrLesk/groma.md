---
id: TASK-605
title: Parallelize independent GitHub Actions steps
status: Done
assignee:
  - '@codex'
created_date: '2026-10-15 20:14'
updated_date: '2026-10-15 21:00'
labels: []
dependencies: []
references:
  - .github/workflows/ci.yml
  - .github/workflows/release.yml
  - .github/workflows/architecture.yml
  - >-
    https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax#jobsjob_idstepsparallel
  - test-bun/terminal-lifecycle.test.ts
modified_files:
  - .github/workflows/ci.yml
  - .github/workflows/release.yml
  - .github/workflows/architecture.yml
  - test-bun/terminal-lifecycle.test.ts
type: enhancement
ordinal: 672000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
CI and release jobs wait for independent setup, packaging, and validation work to finish in sequence. Use the supported GitHub Actions parallel-step feature where work can safely overlap on the same runner, including the architecture workflow where outputs are independent.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Independent setup, cache, build, validation, and artifact preparation steps are grouped where useful in the existing CI, release, and architecture workflows.
- [x] #2 Existing commands, cache conditions, job dependencies, publishing gates, and output paths remain effective; consumers wait for all required producers.
- [x] #3 Workflow YAML validates, the repository check passes, and the dependency review records any deliberate sequential boundaries.
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
1. Add self-contained parallel groups to CI: independent package-cache restores; toolchain setup after cache outputs are available; Swift/C#/Rust package builds after dependency installation; repository checks, C# worker tests, and standalone compilation after packages exist.
2. Add release groups for tool setup, independent Bun/.NET dependency restores, the two packaged-scanner validation suites, artifact downloads alongside setup or dependency installation, and npm preparation alongside scanner assembly or package preparation. Keep Rust selection after its installation, scanner staging internally parallel as it already is, and all publish/upload/job dependency gates in place.
3. Group architecture Bun/Pages setup and committed-map export with comparison download. Export writes only site/architecture/<theme>; downloaded comparisons write site/comparison. Wait before uploading the whole site.
4. Validate parsed workflow YAML and compare flattened leaf steps with the originals to prove commands, conditions, action inputs, and job gates remain intact. Run bun run check, then perform the implementer's specification and quality reviews.
Test decision: add no repository tests. This changes scheduling of existing commands, not a domain rule or test-runner API. Existing suites plus a temporary workflow structure/dependency comparison cover the supported risk without freezing YAML source text in product tests. New tests cannot execute GitHub's scheduling engine locally.

5. User-authorized follow-up: fix the existing TS2349 error by giving the lifecycle test's shared completion promise an explicit Promise<unknown> type. Welcome returns an action/undefined and the map returns void; this test observes completion only, so no public return type or runtime behavior changes. Preserve all existing lifecycle assertions and test-runner APIs; no new test is needed because the current test and TypeScript check cover the failure.
6. Run the focused lifecycle test and the full bun run check. After verification, finalize TASK-605, stage only this task's workflows, lifecycle test, task record, and any architecture files actually caused by them; commit with the exact task ID/title and push main as requested. Preserve all unrelated working-tree edits.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented 16 parallel groups: CI 4, Release 10, architecture 2. The CI SwiftSyntax cache restore overlaps tool setup after the Swift package cache output is available. Split only the release Bun install and .NET restore into two existing commands; all other leaf steps retain their names and contents.
Dependency review: cache outputs and tool PATH/environment changes are consumed after group barriers. Scanner package builds use separate destinations. CI C# tests build .NET project output while repository tests read the staged C# runtime; standalone builds use dist, while the existing compiled-scanner test uses its own temporary binary. Release scanner validations copy staged packages into separate temporary directories. npm installation changes its global tool directory while assembly/preparation changes package directories. Architecture export writes site/architecture/<theme>, while comparison artifacts write site/comparison.
Deliberate sequential boundaries: checkout before workspace actions; package caches before their conditional consumers; tool setup before installers/builds; Rust selection after installation; scanner staging after both dependency installers; catalog embedding after downloaded packages and dependencies; upload/publish after all required validation/preparation; all existing job dependencies unchanged. No public contract or documentation change is needed.
Focused verification passed: parsed all three files as YAML; checked Bash syntax for every run block; compared flattened leaf steps with HEAD (allowing the explicit two-command install split) and confirmed exact commands, action inputs, conditions, workflow/job settings, and output references. All groups have 2-7 children with no same-group output dependency; git diff --check passed.
bun run check exited 2 at the existing TS2349 error in test-bun/terminal-lifecycle.test.ts:39. This test, package.json, bun.lock, and tsconfig.json are unchanged from HEAD. Lint completed with its existing warning/info diagnostics; type checking stopped the bundled test stage. Running bun run test directly; initial sandboxed execution also encounters denied local servers, FSEvents, and ps.

Implementer's specification review: AC1 and AC2 are satisfied by the 16 parsed groups, the unchanged flattened leaf-step comparison, and the reviewed producer/consumer boundaries. AC3's YAML and dependency-review portions pass, but the full repository check remains blocked by the pre-existing terminal-lifecycle TypeScript error; do not mark that criterion or the task Done.
Implementer's quality and simplicity review: the entry point remains each existing workflow trigger, followed by the same jobs. Each parallel group exposes independent work at one phase and supplies an implicit wait before its consumers. Scripts continue to own packaging, validation, and publication; no orchestration helper or dependency was added. Checked output directories, cache/output references, PATH consumers, conditional skips, failure gates, and all Bash heredocs. A junior developer can follow the phases directly in each workflow. No new tests or product/architecture concepts were introduced; no blocking finding was found in the scheduling changes. Actual GitHub execution and timing measurement await the next workflow run.

Final validation: the unsandboxed bun run test completed successfully: 16 Node tests passed; Bun reported 793 passed, 54 skipped, 0 failed (847 tests across 149 files). The first sandboxed run's 30 failures were caused by unavailable local servers/file watchers/process inspection; no tests or assertions were changed for the retry. The separate full bun run check still exits 2 at the unchanged terminal-lifecycle TS2349 error. TypeScript includes only TS sources/tests, not the changed workflow YAML. No groma/ files were changed. Only the three workflow files and this task belong to this change; unrelated working-tree edits were preserved. AC3 and the task remain open solely for the full-check failure.

User authorized fixing the TypeScript blocker and pushing on 2026-10-15. Reproduced TS2349 before the fix with bun run typecheck. The welcome completion promise returns WelcomeActionId | undefined, while the map completion promise returns void; their inferred union made .then uncallable in the installed TypeScript version. Annotated only the test-local closed variable as Promise<unknown>, which matches its completion-only use without an assertion/cast, public API change, or runtime change. All three focused terminal-lifecycle tests pass (9 assertions), preserving suspension/restoration timing assertions. The existing test closes the coverage gap; no tests or assertions were added or weakened.
Targeted quality re-review of the one-line fix: both promises are assignable to Promise<unknown>; the test reads no completion value, and .then/await still observe the original promise. The previous supported lifecycle behavior is unchanged. Full bun run check is running outside the sandbox because the earlier test run proved local server/watcher/process permissions are required. Git fetch origin main completed; unrelated source and documentation edits remain unstaged.

Completion verification after the authorized fix: bun run check exited 0. Biome completed with the same existing warning/info diagnostics, the scrollbar check and TypeScript check passed, all 16 Node tests passed, and Bun reported 798 passed, 54 skipped, 0 failed across 150 files. The focused lifecycle test passed all three cases without changing assertions. Specification re-review confirms AC3 now passes; the previously reported type-check blocker is resolved. Quality re-review of the fix found no runtime change or new defect. git diff --check passed for the task files, and git status --short groma/ was empty, so no architecture curation is required for this change.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added 16 native GitHub Actions parallel groups across CI (4), Release (10), and Groma architecture (2). Independent caches, tool setup, scanner package builds, validation, artifact downloads, and package preparation overlap, while required waits and publishing gates are preserved. Fixed the lifecycle test's TypeScript error with an explicit Promise<unknown> type for its completion-only promise. Workflow YAML/Bash validation, unchanged-step/dependency checks, three focused lifecycle tests, and the full bun run check pass: 16 Node tests and 798 Bun tests, with 54 skips. Actual workflow timing will be measured by GitHub on subsequent runs.
<!-- SECTION:FINAL_SUMMARY:END -->
