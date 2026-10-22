---
id: TASK-627
title: Run the npm-installed Groma command without Node or Bun
status: Done
assignee:
  - '@codex'
created_date: '2026-10-22T20:31:00Z'
updated_date: '2026-10-22T20:51:00Z'
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
- [x] #1 After npm installation, groma runs without Node or a separate Bun executable on PATH on supported Windows, Linux and macOS platforms.
- [x] #2 The npm package selects the matching published native binary and preserves arguments, exit status and native signal cleanup.
- [x] #3 Published runtime metadata does not copy the source checkout development engine requirements.
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

Final validation: CI run 39851142656 passed the full repository checks, C# worker tests and the actual packaged standalone command on Windows, Linux and macOS at code commit 2ce04d32059534518fae932dd138fb81b33604b6. This includes both npm-generated Windows shell entry points, the local/global installer regression and native signal cleanup. Architecture run 39851142780 also passed. The final local check repeated the same result: 929 Bun passes, 64 optional skips and 19 existing trust failures; the clean-main reproduction is recorded above. A real npm installation also exported the approved viewer fixture to a static site with an empty runtime PATH.
Specification review: the installed native command satisfies all three acceptance criteria; publishing and development still use their existing runtimes. Quality review: package-cli.ts stages the manifest and executable target, npm runs install.cjs once to copy the platform dependency, then the OS starts Groma directly. No runtime forwarding process or new application architecture responsibility remains. New tests verify actual npm links/shims and observable command behavior; all fixture resources are owned by each concurrent test. No blocking review findings.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Removed the Node runtime launcher from the npm distribution. Installation selects and copies the native executable, and npm links it directly on Unix, Command Prompt and PowerShell. Published package metadata no longer copies development Node/Bun engines. Platform CI and release builds verify the installed command without external JavaScript runtimes. Full CI and architecture checks passed on the code commit; local trust-test failures were reproduced on clean main. The PR is ready for review; no release was created.
<!-- SECTION:FINAL_SUMMARY:END -->
