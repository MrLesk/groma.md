---
id: TASK-627
title: Separate Groma runtime requirements from build tools
status: In Progress
assignee:
  - '@codex'
created_date: '2026-10-22T20:31:00Z'
updated_date: '2026-10-22T21:39:00Z'
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
1. Stage the wrapper with its own Node16.20.2 runtime minimum, exact-version optional payloads and no lifecycle hook; keep newer development requirements only in the checkout.
2. Stage platform packages in the same build script. Let x64 npm install the Darwin ARM64 payload under Rosetta, while retaining the existing launcher hardware check and unsupported Intel behavior.
3. Verify real local/global packed installations with --ignore-scripts --engine-strict, argument/exit handling and cleanup. Verify the standalone with an empty runtime PATH and the npm command with only Node. CI covers Windows, Linux and macOS with Node16.20.2 and adds real macOS Rosetta execution.
4. Document native and npm installation/runtime requirements separately. Do not change Backlog, add Nix support, or expand current OS/CPU support.
5. Run bun run check and platform CI; complete the cold simplicity, implementer specification/quality, and full-context complexity reviews, then finalize the task and PR with the exact evidence. No OKF/C4 model changes are required.

CI regression coverage: macOS showed the launcher itself dying from SIGINT during native startup. A deterministic local probe reproduces exit130 while spawnBinary has not returned, before the launcher installs signal listeners. Extend the existing launcher test to send SIGINT during that call and require the native exit7. Existing readiness-based tests do not force this startup window. Install the same listeners before spawning and remove them on a synchronous spawn throw; preserve all existing forwarding rules.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Final design: scripts/package-cli.ts owns npm wrapper and platform staging. The wrapper declares Node>=16.20.2, exact-version optional payloads, and no lifecycle hooks. It does not publish checkout build requirements. npm owns the command link; the unchanged CommonJS launcher selects and starts the payload; the compiled CLI owns application behavior and cleanup. Direct native executables run without external Node or Bun. Backlog and Groma's supported OS/CPU targets are unchanged; no Nix packaging was added. This is delivery knowledge, not a new OKF concept or C4 element.

Rosetta: a real x64 Node16.20.2 installation on Apple Silicon skipped cpu:[arm64] payloads and failed to launch. Allowing cpu:[arm64,x64] installed the ARM64 payload and ran Groma 0.7.6. The existing hardware probe still rejects Intel Macs. Release staging and automated tests now share this metadata.

Verification: actual Node16.20.2/npm8.19.4 passes local/global installation with --ignore-scripts --engine-strict, argument and nonzero-exit checks, and native cleanup. The full standalone binary runs with an empty runtime PATH; the npm command runs with only Node available. All three package tests pass under native ARM64 Node16 and real x64 Node16/Rosetta. All eight existing launcher lifecycle tests pass. Both staging CLI entry points execute with Node, and focused lint/type checks pass. Windows/Linux/macOS CI is running at code commit 2e63e318.

Repository check outside the sandbox: Biome, typecheck, and all 24 Node tests pass. Bun reports 929 passes, 64 optional skips and 19 certificate-related failures. Earlier clean-main focused verification reproduced 11 of those failures in two trust files (7 pass/11 fail); no TLS code or tests changed. The first sandboxed run also hit macOS FSEvents and blocked downloads; those disappear outside the sandbox.

Reviews: cold simplicity review and final full-context complexity review report no blocking findings. Implementer specification review confirms the wrapper/native route distinction and retained launcher semantics; platform CI remains the outstanding verification. Implementer quality review traces release staging -> npm link -> launcher -> native CLI, checks output-stream completion and process-group cleanup, and removes the unnecessary PID comparison. No groma/ files changed.

History: the earlier postinstall-copy approach was rejected because package managers can block lifecycle scripts. It was never merged or released. Its script-enabled CI evidence does not establish the current design; the implementation and tests were replaced.

Platform CI at 2e63e318 found an existing launcher startup race on macOS: the full native/npm package check passed, but the Node lifecycle suite reported launcher signal SIGINT rather than native exit23. Exact CI Node26.12.1 passes the test alone. A deterministic synchronous child-spawn probe reproduces launcher exit130 before signal handlers are registered, so this is a supported-flow race, not a reason to add retries or relax assertions.

Startup-race fix: the same signal listeners are now registered before spawnBinary runs; forwarding callbacks execute after the synchronous spawn returns, so no queue or extra lifecycle state is needed. A synchronous spawn throw releases listeners and preserves its original error. The deterministic SIGINT regression failed before the fix (launcher killed by SIGINT) and passes after it. All nine launcher tests now pass under exact CI Node26.12.1, and all three real Node16 x64/Rosetta package tests pass again. Targeted specification/quality re-review found no forwarding or cleanup regression; the full repository check with Node26 is running.
<!-- SECTION:NOTES:END -->
