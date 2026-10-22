---
id: TASK-627
title: Separate Groma runtime requirements from build tools
status: In Progress
assignee:
  - '@codex'
created_date: '2026-10-22T20:31:00Z'
updated_date: '2026-10-22T21:30:00Z'
labels: []
dependencies: []
references:
  - scripts/npm/cli.cjs
  - scripts/package-cli.ts
  - .github/workflows/release.yml
  - .github/workflows/ci.yml
  - README.md
  - test-bun/npm-packaging.test.ts
modified_files:
  - scripts/npm/install.cjs
  - scripts/npm/cli.cjs
  - scripts/package-cli.ts
  - .github/workflows/release.yml
  - test/npm-launcher.test.ts
  - test/fixtures/npm-launcher/native.cjs
  - test-bun/npm-packaging.test.ts
  - CONTRIBUTING.md
  - .github/workflows/ci.yml
  - README.md
priority: high
type: bug
ordinal: 697000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The published npm wrapper inherits the checkout's current Node and Bun build requirements. Keep generic npm installation compatible with an older tested Node runtime and disabled lifecycle scripts. Native downloads continue to run without external Node or Bun. The rejected postinstall copy design must be removed; Backlog packaging stays unchanged.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The generic npm package installs with lifecycle scripts disabled and strict engine checks and runs with Node 16.20.2 and its npm on supported Windows, Linux and macOS test hosts.
- [ ] #2 The published npm manifest declares its own tested Node minimum, requires no separate Bun installation, and uses exact-version platform payloads without copying development requirements.
- [ ] #3 The npm command preserves platform selection, arguments, native exit status and termination cleanup; macOS remains Apple Silicon only.
- [ ] #4 The standalone Groma executable runs with neither Node nor a separate Bun on PATH, and installation documentation distinguishes the two routes.
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
1. Replace the rejected postinstall package with the existing small CommonJS launcher. The npm consumer package requires Node 16.20.2 or newer, with no Bun or development-tool requirements. Keep the five existing native release targets and exact-version optional dependencies.
2. Retain existing launcher signal/exit coverage. Extend real local/global npm package tests to install with --ignore-scripts and --engine-strict; run them using Node 16.20.2 and its npm in platform CI. This catches copied build engines, skipped-install-script failures, and command/shim failures that direct launcher tests do not cover.
3. Run the actual standalone executable with an empty runtime PATH, then the installed npm command with only Node available. Verify arguments, nonzero exit status, native cleanup, and CLI version. Check a real Rosetta installation if the available Mac supports it; TASK-310 already requires this flow.
4. Use one package staging function for release and tests. Document the npm runtime separately from native downloads and development requirements. Do not modify Backlog, introduce Nix packaging, or change current supported operating systems/CPUs.
5. Run focused checks and bun run check; inspect the final flow and task criteria. Delivery changes belong to existing build/release responsibilities, with no new OKF metadata or C4 elements.

Rosetta reproduction: x64 Node 16.20.2 under real Rosetta installs the root tarball but skips cpu:[arm64] optional payloads; launch fails. With cpu:[arm64,x64], the same packed installation runs Groma 0.7.6. Reuse package-cli.ts to stage platform payload manifests as well as the wrapper so tests exercise the release metadata. Keep hardware rejection in the existing launcher, and add a macOS x64 Node CI pass.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implementation: npm now links bin/groma.exe directly. An install-only script copies the selected exact-version platform executable to that target. The published manifest has no development engines. One platform table serves the installer and package staging script. No core runtime or OKF/C4 model changes; groma/project.md explicitly excludes root build scripts from this map.
Verification: all three focused packaging tests pass on macOS ARM64, including the full compiled Groma binary, local/global npm commands with no Node/Bun on PATH, argument and exit-code forwarding, and PID/process-group termination cleanup. A fresh unbundled npm install using real published 0.7.6 platform dependencies reports 0.7.6 with an empty runtime PATH. The old launcher fails the same environment with exit 127 (node not found). Typecheck and focused lint pass.
The first full bun run check passed lint/typecheck/Node tests and reported 929 Bun tests passing, 64 optional skips, and 19 failures in existing certificate-trust flows. A clean main worktree reproduced exactly the same 11 failures in the two focused certificate files (7 pass/11 fail), before packaging changes. Local Bun returns an empty system certificate set inside these temporary-home flows. No certificate code or tests were changed. Windows/Linux checks and a final full check are pending.

Final validation: CI run 39851142656 passed the full repository checks, C# worker tests and the actual packaged standalone command on Windows, Linux and macOS at code commit 2ce04d32059534518fae932dd138fb81b33604b6. This includes both npm-generated Windows shell entry points, the local/global installer regression and native signal cleanup. Architecture run 39851142780 also passed. The final local check repeated the same result: 929 Bun passes, 64 optional skips and 19 existing trust failures; the clean-main reproduction is recorded above. A real npm installation also exported the approved viewer fixture to a static site with an empty runtime PATH.
Specification review: the installed native command satisfies all three acceptance criteria; publishing and development still use their existing runtimes. Quality review: package-cli.ts stages the manifest and executable target, npm runs install.cjs once to copy the platform dependency, then the OS starts Groma directly. No runtime forwarding process or new application architecture responsibility remains. New tests verify actual npm links/shims and observable command behavior; all fixture resources are owned by each concurrent test. No blocking review findings.

Reopened after Alex rejected mandatory installation scripts and approved revisiting Groma with older-Node npm compatibility plus a separate native route. Earlier completion evidence below applies only to the rejected script-enabled design. No Backlog repository changes are authorized or needed for this Groma task.

Focused verification: Node 16.20.2 ARM64/npm 8.19.4 passes all three packaged-command tests with --ignore-scripts and --engine-strict; native executable runs with an empty runtime PATH. All eight existing launcher lifecycle tests and focused type/lint checks pass. A real Rosetta npm installation reproduces the missing ARM64 payload and passes after allowing x64 npm to install it; temporary experiment is /private/tmp/groma-rosetta-install.ts. Existing TASK-310 requires this supported Apple Silicon flow.

Cold simplicity review passed with no findings. Implementer quality review removed an implementation-specific PID comparison, waits for command output streams to close before assertions, and makes each cleanup test kill its own process group even on failure.

Implementer specification review: the consumer manifest has only the tested Node>=16.20.2 engine, exact-version optional payloads and no lifecycle hook. Native startup needs no external JS runtime. Existing launcher semantics and Intel refusal remain unchanged. New shared payload staging fixes the reproduced Rosetta CPU-filter failure. Local Node16 ARM64 and real x64/Rosetta tests pass; Windows/Linux CI evidence and the full repository result remain pending. Implementer quality review traced release staging -> npm link -> retained launcher -> native CLI; no production-code defects or extra abstractions found. Tests exercise real packed installation, output, exit status and resource cleanup. No architecture-owned groma/ files changed.
<!-- SECTION:NOTES:END -->
