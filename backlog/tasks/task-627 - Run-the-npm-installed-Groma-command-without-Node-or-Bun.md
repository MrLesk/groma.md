---
id: TASK-627
title: Run the npm-installed Groma command without Node or Bun
status: In Progress
assignee:
  - '@codex'
created_date: '2026-10-22T20:31:00Z'
updated_date: '2026-10-22T20:41:00Z'
labels: []
dependencies: []
references:
  - .github/workflows/release.yml
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
priority: high
type: bug
ordinal: 697000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The npm distribution starts a Node launcher before the self-contained Groma executable. This makes the installed command depend on an external JavaScript runtime even though Groma embeds Bun. Select and expose the supported native binary during package installation instead.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 After npm installation, groma runs without Node or a separate Bun executable on PATH on supported Windows, Linux and macOS platforms.
- [ ] #2 The npm package selects the matching published native binary and preserves arguments, exit status and native signal cleanup.
- [ ] #3 Published runtime metadata does not copy the source checkout development engine requirements.
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
1. Stage the npm package with a native executable bin target and an install-only Node script. Keep OS/CPU selection at installation and remove the runtime launcher. Keep Node/Bun engine requirements in the source checkout only.
2. Replace obsolete launcher tests with a real npm local/global installation test using a compiled fixture. With an empty PATH, verify arguments, exit codes and native signal cleanup. Existing tests start the launcher explicitly with Node, so they cannot detect this runtime dependency. Cover supported platform selection separately with a small table test.
3. Use the same package staging code in the release workflow. Run the packaged-command test on Windows, Linux and macOS CI and smoke-test the full standalone CLI. Update packaging documentation.
4. Run focused checks and bun run check, then perform specification and quality reviews. No application architecture concepts or stored OKF/C4 meaning change; this is executable delivery plumbing.

Windows entry-point coverage: npm creates both Command Prompt (.cmd) and PowerShell (.ps1) commands. Verify both with PATH restricted to the installation directory; the old tests never invoked either generated command.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implementation: npm now links bin/groma.exe directly. An install-only script copies the selected exact-version platform executable to that target. The published manifest has no development engines. One platform table serves the installer and package staging script. No core runtime or OKF/C4 model changes; groma/project.md explicitly excludes root build scripts from this map.
Verification: all three focused packaging tests pass on macOS ARM64, including the full compiled Groma binary, local/global npm commands with no Node/Bun on PATH, argument and exit-code forwarding, and PID/process-group termination cleanup. A fresh unbundled npm install using real published 0.7.6 platform dependencies reports 0.7.6 with an empty runtime PATH. The old launcher fails the same environment with exit 127 (node not found). Typecheck and focused lint pass.
The first full bun run check passed lint/typecheck/Node tests and reported 929 Bun tests passing, 64 optional skips, and 19 failures in existing certificate-trust flows. A clean main worktree reproduced exactly the same 11 failures in the two focused certificate files (7 pass/11 fail), before packaging changes. Local Bun returns an empty system certificate set inside these temporary-home flows. No certificate code or tests were changed. Windows/Linux checks and a final full check are pending.
<!-- SECTION:NOTES:END -->
