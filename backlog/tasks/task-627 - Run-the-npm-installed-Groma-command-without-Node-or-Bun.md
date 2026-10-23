---
id: TASK-627
title: Separate Groma runtime requirements from build tools
status: Done
assignee:
  - '@codex'
created_date: '2026-10-22T20:31:00Z'
updated_date: '2026-10-23T18:59:00Z'
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
Keep npm installation compatible with an older tested Node runtime and disabled lifecycle scripts. Publish only launcher runtime requirements, independently of checkout build tools. Preserve native downloads without external Node or Bun, supported platform selection, arguments, exit status and cleanup. Backlog packaging stays unchanged.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The generic npm package installs with lifecycle scripts disabled and strict engine checks and runs with Node 16.20.2 and its npm on supported Windows, Linux and macOS test hosts.
- [x] #2 The published npm manifest declares its own tested Node minimum, requires no separate Bun installation, and uses exact-version platform payloads without copying development requirements.
- [x] #3 The npm command preserves platform selection, arguments, native exit status and termination cleanup; macOS remains Apple Silicon only.
- [x] #4 The standalone Groma executable runs with neither Node nor a separate Bun on PATH, and installation documentation distinguishes the two routes.
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
1. Stage the wrapper with its own tested Node16.20.2 minimum, exact-version optional payloads and no lifecycle hook; keep development requirements only in the checkout.
2. Stage platform manifests in the same build script. Allow x64 npm under Rosetta to install the Darwin ARM64 payload while retaining the launcher hardware check and Intel rejection.
3. Register launcher signal handlers before native spawn, preserving forwarding, exit status and native cleanup. Prove the observed startup race with a deterministic regression.
4. Verify real packed local/global installs with --ignore-scripts --engine-strict, arguments/exit status and cleanup. Test the standalone with no runtime on PATH and npm with only Node; run full Windows/Linux/macOS CI plus Node16 and macOS Rosetta checks.
5. Document npm, native and development requirements separately. Leave Backlog, Nix packaging and OS/CPU scope unchanged.
6. Complete cold simplicity, implementer specification/quality, full-context complexity and targeted startup-regression reviews; record exact verification evidence.

Security review boundary, approved by Alex: keep Node16 runtime compatibility; document that compatibility is separate from the security maintenance of the user-installed package manager. Treat pre-install npm certificate trust as an installation-environment advisory. Do not add runtime version gates, installer hooks, system trust mutations or user-config repair.

PR178 review regression: Ctrl+C delivered before native process creation must not be lost. Existing coverage interrupts only after child creation. Add one deterministic pre-spawn signal test that expects the signal exit status, then queue that early signal until the child exists without duplicating normal terminal group delivery.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Final flow: scripts/package-cli.ts stages the wrapper and platform payloads. The npm manifest declares Node>=16.20.2, exact-version optional payloads and no lifecycle hook, independently of the checkout's newer Node/Bun build requirements. npm owns the command link. The small CommonJS launcher selects and starts the native payload; the compiled CLI owns application behavior and cleanup. Direct native downloads run without external Node or Bun. Backlog and current OS/CPU support are unchanged. No new Nix package, OKF metadata or C4 element is introduced.

Rosetta: a real x64 Node16/npm8 installation on Apple Silicon skipped the old ARM64-only CPU-filtered payload. Shared staging now allows x64 npm to install that ARM64 payload; the existing hardware probe still rejects Intel Macs. The actual installation failed before the metadata fix and succeeds after it.

Startup lifecycle: the launcher installs signal listeners before spawning. A fast native process can become ready before spawn returns, so installing listeners afterwards allowed terminal SIGINT to kill the launcher during startup. A deterministic regression failed before the fix and passes afterwards. The fix uses the same forwarding rules and no signal queue; synchronous spawn errors release listeners and preserve the error.

Verification: code commit 818a66b475d704a03699971d679f7f6a0555f271 passed full Windows, Linux and macOS CI in https://github.com/MrLesk/groma.md/actions/runs/39859095516 . Each platform passed the full repository check, the standalone/npm command smoke and the Node16.20.2 installation checks with scripts disabled. macOS also passed real x64 Node/Rosetta installation. Architecture workflow https://github.com/MrLesk/groma.md/actions/runs/39859093105 passed. Local real Node16.20.2/npm8.19.4 checks cover local/global installation, Windows shell entry points in platform CI, arguments, nonzero exits and cleanup. Both release staging CLI entry points were exercised.

Local repository check with exact CI Node26.12.1: lint/types and all 25 Node tests pass; Bun reports 929 passes, 64 optional skips and 19 certificate-related failures. Earlier clean-main focused verification reproduced 11 of these failures in two trust files (7 pass/11 fail). No TLS code or tests changed. Full platform CI passes its complete checks.

Reviews: cold simplicity and full-context complexity reviews found no blocking design issues. Implementer specification/quality reviews confirm all task criteria, clear staging/launcher/native ownership, tests with independent temporary resources and complete output collection. The CI-discovered startup race received a deterministic failing-before/passing-after test and targeted specification/quality review. No groma/ files changed.

History: the initial postinstall-copy design was rejected because package managers may block lifecycle scripts. It was never merged or released. The final change restores a small runtime launcher, separates consumer requirements from build requirements and documents direct native installation. No release was created.

Alex approved treating Codex's npm-bootstrap certificate finding as an installation-environment advisory, not a Groma release blocker. The local probe confirms the old Node default trust risk, but the launcher makes no network requests and a package's engines field cannot secure an already compromised installer. Keep Node16 compatibility and Groma's own download protections. README now separates compatibility from patched installation tools; CONTRIBUTING records responsibility. No runtime gate, CA-store repair or configuration mutation was added. This update is documentation/task administration only; the existing code CI remains applicable.

PR178 Codex P2 addressed: the launcher queues a signal received before the native process exists, then forwards it after attaching child lifecycle listeners. Normal process-group Ctrl+C is not forwarded twice. The new pre-creation regression fails before the fix (exit 7 instead of 130) and all 10 lifecycle tests pass after it with Node26.12.1. The earlier npm-bootstrap security advisory remains non-blocking per Alex; no user Node gate is added.

Final PR178 review: both threads are resolved. The relevant P2 startup signal finding is fixed in b2bb9873 with failing-before/passing-after evidence. The P1 npm bootstrap advisory stays an environment responsibility under Alex explicit decision; no older-Node gate was added. Final PR178 CI39999077829 passed with complete Windows/Linux/macOS, Node16 installation, Rosetta and architecture checks passing. The one unrelated macOS lock timeout did not recur on the complete job rerun. The coordinated Bun1.4.4 source passed26 Node and930 Bun tests with63 optional skips, and hosted all-platform CI40003380577. PR178 merged as50aaac6a and is included in the single full Groma0.7.7 release. Publishing workflow40003386302 passed all builds, native/npm smoke checks, platform publications, wrapper publication and main-version sync. The native assets and checksums are public. No groma/ changes were caused by this task.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Separated npm runtime requirements from build tools. npm installs with Node16.20.2, disabled lifecycle scripts and exact-version native payloads; it needs no separate Bun. Direct native downloads need neither Node nor Bun. Rosetta payload selection and early Ctrl+C forwarding are fixed. PR178 merged and ships in Groma0.7.7. Full Windows/Linux/macOS, older-Node and Rosetta checks passed; both review threads are resolved. User-owned npm/Node security maintenance remains outside Groma, as approved.
<!-- SECTION:FINAL_SUMMARY:END -->
