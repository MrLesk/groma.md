---
id: TASK-617
title: Update scanners in the background without blocking scans
status: Done
assignee:
  - '@codex'
created_date: '2026-10-16 19:01'
updated_date: '2026-10-16 20:22'
labels: []
dependencies: []
references:
  - src/scanner/modules/inventory.ts
  - src/scanner/modules/package-manager.ts
  - src/scanner/modules/package.ts
  - src/scanner/modules/published.ts
  - src/scanner.ts
  - src/scanner/session.ts
  - src/scanner/cli.ts
  - test-bun/scanner-update.test.ts
  - src/scanner/background-updates.ts
  - src/cli.ts
  - src/config.ts
  - test-bun/work-source-selection.test.ts
  - scanner-source-watch
documentation:
  - docs/config.md
  - docs/scanners/setup.md
modified_files:
  - test-bun/scanner-update.test.ts
  - src/scanner/modules/inventory.ts
  - src/scanner/modules/package-manager.ts
  - src/scanner/modules/published.ts
  - src/scanner/modules/package.ts
  - src/scanner/session.ts
  - src/scanner.ts
  - src/scanner/background-updates.ts
  - src/scanner/cli.ts
  - src/cli.ts
  - test-bun/scanner-installation.test.ts
  - docs/config.md
  - docs/scanners/setup.md
  - src/config.ts
  - test-bun/work-source-selection.test.ts
  - test-bun/viewer-scanner-availability.test.ts
  - groma/systems/groma-md/containers/cli/components/scanner-source-watch.md
  - groma/systems/groma-md/containers/cli/components/src-scanner.md
  - groma/systems/groma-md/components/c-generate-parser.md
  - groma/systems/groma-md/components/c-src-index.md
  - groma/systems/groma-md/components/c-src-macros.md
  - groma/systems/groma-md/components/c-src-parser.md
  - groma/systems/groma-md/components/c-src-source.md
  - groma/systems/groma-md/components/cpp-generate-parser.md
  - groma/systems/groma-md/components/cpp-src-declarations.md
  - groma/systems/groma-md/components/cpp-src-index.md
  - groma/systems/groma-md/components/cpp-src-macros.md
  - groma/systems/groma-md/components/cpp-src-syntax.md
  - groma/systems/groma-md/components/dart-src-index.md
  - groma/systems/groma-md/components/mojo-src-index.md
  - groma/systems/groma-md/components/mojo-src-parser.md
  - groma/systems/groma-md/components/mojo-src-source.md
  - groma/systems/groma-md/components/mql5-src-declarations.md
  - groma/systems/groma-md/components/mql5-src-evidence.md
  - groma/systems/groma-md/components/mql5-src-index.md
  - groma/systems/groma-md/components/mql5-src-syntax.md
  - groma/systems/groma-md/components/outline.md
  - groma/systems/groma-md/components/parts.md
  - groma/systems/groma-md/components/preprocessing.md
  - groma/systems/groma-md/components/worker.md
  - groma/systems/groma-md/containers/cli/components/ada-src-declarations.md
  - groma/systems/groma-md/containers/cli/components/ada-src-evidence.md
  - groma/systems/groma-md/containers/cli/components/ada-src-index.md
  - groma/systems/groma-md/containers/cli/components/ada-src-syntax.md
  - groma/systems/groma-md/containers/cli/components/background-updates.md
  - groma/systems/groma-md/containers/cli/components/src-cli.md
type: bug
ordinal: 684000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Automatic npm updates currently run before the installed registry loads. A disconnected or slow registry therefore delays or prevents scans even when the scanner is already on this computer. Alex requires immediate startup from installed scanners, no startup timeout, and continued offline use. After the background updates finish, trigger the normal scan flow so the existing architecture watcher refreshes the map; no separate map-update protocol is needed. This replaces TASK-616’s synchronous startup policy. Release publication remains paused.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Installed npm scanners run immediately in scan, watch and live-view startup without awaiting registry lookups or using a startup timeout; unavailable registry access leaves the installed version usable.
- [x] #2 Successful background updates preserve project settings and publish the completed scanner selection together, then trigger the normal scan flow with the updated scanners so the open map refreshes through existing behavior.
- [x] #3 A one-shot scan can finish while the background update check is still pending. Closing a live session does not wait for network checks. Manual plugin update and restoration retain their explicit errors and installation behavior.
- [x] #4 Focused regressions prove startup before a deliberately held registry response, offline operation, updated rescan after release, and settings preservation. bun run check and Windows/Linux/macOS CI pass; review Codex feedback before merge.
- [x] #5 Project config accepts automaticUpdates as a boolean, defaults to true when absent, and false prevents automatic registry checks and follow-up scans while explicit plugin updates remain available.
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
1. Validate automaticUpdates as an optional project boolean, enabled when absent. false skips automatic registry work and follow-up scans while explicit plugin updates/restoration retain their behavior.
2. Scan installed packages immediately. Live/watch updates run outside startup/close queues and use normal reconfigure/scan after completed updates. Setup and change failures publish the live notice and reject to their caller; only asynchronous failures use onError, preventing duplicate CLI messages. Closing cancels package work without a startup timer.
3. Inventory validates and installs compatible replacements without per-package config writes. After network work, use the existing project lock to reread current config, preserve settings/source edits, respect the current switch/cancellation, and save completed selections together. Git/local and missing-package installation retain their owners.
4. The one-shot CLI awaits only a local config decision and skips a child for disabled/non-npm selections. Eligible npm checks run in an independent unreferenced CLI job, which invokes the normal scan when selections change. Existing architecture watching refreshes maps; no new map protocol, cache index, retry policy or startup timeout.
5. Verify supported rules with isolated installed-scanner fixtures, held responses, refused connections, executed versions and config edits. Extend existing boolean/availability tests; reject watch startup without also notifying its callback. Reuse filesystem access and existing compiled-local/empty-selection CLI tests for lock/lifecycle fixes, preserving cleanup/timeouts/assertions. Check source/standalone one-shot exit and single-message invalid-config startup. Evaluate review claims before changing code; ignored readiness is already handled and was verified in an isolated Bun child.
6. Configuration and package state remain operational data, not new OKF knowledge or C4 elements. Keep existing ownership and ordinary architecture Markdown. Scan the launcher, combine its code into Command interface, include task-caused derived relationship changes and document offline startup/background rescan/the switch.
7. Run focused/full checks, the cold simplicity review, own specification/quality review and full-context complexity review. Apply actual Codex/CI fixes and targeted own reviews, record disproved claims with evidence, and require three-platform CI/architecture comparison before merging. Release publication remains paused.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Alex clarified the offline request further: registry checks must not block startup, no startup timeout should be introduced, and once all scanner updates are complete the normal scan flow should run so the map updates through its existing watcher. The previous next-session-only assumption is replaced by this approved post-update rescan. Context: inventory owns scanner replacements/config writes, package-manager owns Bun registry processes, session owns scanner watchers and reconfigure, and the web map already observes architecture changes. Bun’s installed child-process documentation confirms unref prevents a spawned child from keeping the one-shot parent alive; its installed types support AbortSignal cancellation. The change needs no cache index, new configuration field, custom map event or retry policy.

The held-registry regression fails before the fix: it observes registry access before session.ready instead of running the installed scanner. After implementation, all 8 focused update tests pass with 71 assertions, including real connection-refused offline scans in scan/watch/live modes and a one-shot CLI process that exits with its registry response held. No elapsed-time threshold or startup timer is used. Registry cancellation is tied only to closing a live session. Watch mode now shares the existing session lifecycle; its error callback and scan summaries are preserved. Missing packages remain explicitly restored through the existing plugin flow, as verified by the colleague-installation scenario.

Focused installation/update/work-source integration passes 24 tests with 136 assertions. The first full repository check passes 16 Node tests and 887 Bun tests with 62 optional skips and zero failures. Two unused internal command options were then removed, and Alex added the automaticUpdates switch; rerun the required full check after that final code change. Compiled CLI smoke validation is in progress.

The actual compiled executable passes the held-registry CLI test: the main scan process exits while its detached background worker is waiting for the registry. Source-mode focused integration passes after the automaticUpdates addition; the final full repository check is running. automaticUpdates is an optional validated boolean, enabled when absent. false exits the automatic updater before registry access; explicit update/restore paths do not use that gate. The field remains operational config, not architecture metadata or a new C4 concept.

Final focused integration passes 26 tests with 149 assertions after adding automaticUpdates; final TypeScript checking passes. The default-enabled behavior is exercised by the held-response live/CLI tests with the field absent. The false-field test proves zero registry reads and a successful explicit update; configuration validation round-trips true/false and refuses a string. All modified source/test files remain under 500 lines, no new cognitive-complexity warning is reported, and git diff --check passes. Starting the required cold simplicity review on the complete diff now.

Cold simplicity review passes with no material runtime simplification or blocking finding. Accepted its one test simplification: the CLI case now waits until the registry request is held, then observes natural parent exit while that response is still held. It no longer requires stdout to close before the request begins, avoiding an unnecessary scheduler-dependent ordering. The supported requirement and exit/version assertions are unchanged. Focused and final required checks follow before implementer specification/quality reviews.

First implementer specification/quality review traced CLI, live/watch, inventory, config and package-process ownership after the cold simplicity gate. All planned behavior is present, with one blocking AC5 finding: disabling automaticUpdates while the existing held registry check is pending still allows its completed selection to be applied. This is the same supported config-edit flow already covered for settings preservation. Reproduce and fix that current-setting check, then limit the own re-review to this finding and its regressions.

The disable-during-check regression reproduces the AC5 failure before the fix (update returned true and wrote the new selection despite the current false setting). The final write guard now requires an actual change, the current automaticUpdates setting still enabled, and an active session. This shares the existing commit guard instead of adding another helper; the function stays within the cognitive-complexity limit. Targeted specification/quality re-review is limited to this finding and its regressions.

Targeted own specification/quality re-review passes after the reproduced AC5 fix. The current automaticUpdates flag is checked with cancellation and actual changes immediately before the configuration write; the new regression now passes, settings edited during checks remain preserved, and explicit update/restore tests still pass. Focused integration now passes 27 tests with 156 assertions; git diff --check passes and changed-code lint reports no warnings. All five acceptance criteria have implementation/behavior evidence locally; the final full repository check is running and hosted three-platform CI/Codex review remain pending. No further code or architecture change is planned. Run the final full-context complexity review next.

Final qualification passes: bun run check completed lint/types, 16 Node tests and 890 Bun tests with 62 optional skips, zero failures and 3645 Bun assertions. Focused integration passes 27 tests with 155 assertions (correcting the earlier 156-count typo). The exact final standalone build passes the held-registry CLI exit smoke. Cold simplicity review passed and its one accepted test deletion was applied; own specification/quality review and targeted re-review pass; final full-context complexity review passes with no findings or material simplification. Current source/test files are within 500 lines and changed-code lint has no complexity warning. AC4 remains open only for hosted platform CI and Codex feedback. Preparing the PR now; publication remains paused.

Hosted CI run 38954621682: Windows stopped before repository tests while the unchanged Scala maintainer build could not download sbt 1.11.7 from Maven Central. The exact POM URL now returns HTTP 200; Linux and macOS have already built Scala and reached repository checks. Requested one Windows-job rerun for this external dependency failure, without changing code or test timeouts. Architecture comparison run 38954621808 passed. Codex reviews remain pending.

Codex code review produced three actionable findings; security review was clean. The invalid-config watch-start regression failed before the fix (startup fulfilled) and now passes. Initial session readiness propagates setup failure and its updater continuation does not report that same failure twice. The final config reread, source/flag/cancellation guards and write now share the existing project access lock, held only after network work. Focused lifecycle/config/filesystem checks pass: 36 tests, 192 assertions, zero failures. Linux and macOS implementation CI passed; the initial Windows job failed only on the external Scala sbt download before tests. The reviewed code changes will receive a fresh all-platform run, superseding that old job. Architecture scan and final full check are running.

The normal repository scan generated the new background-updates record and removed obsolete watch callback rows from Scan results/Source watching. It also generated 26 unrelated scanner records from already-merged source; those newly generated, previously absent records were discarded with exact-path Git cleanup to keep this PR limited to TASK-617. No pre-existing architecture record or other agent change was discarded. The transient scan paths remain in the task trace; only updater ownership and task-caused relationship changes will be committed.

Reviewed fixes are qualified locally: bun run check passes lint/types, 16 Node tests and 891 Bun tests, 62 optional skips, zero failures, 3649 Bun assertions. The focused five-file suite passes 36 tests with 192 assertions. The rebuilt standalone CLI passes its held-registry exit smoke. Groma scan and combine recorded src/scanner/background-updates.ts on src-cli (Command interface); groma view of that source confirms its owner. Scan-caused obsolete direct watch callback rows were removed. Targeted implementer specification/quality review confirms startup failure is reported once and rejected, failed startup starts no updater, and final config read/check/write share one existing access boundary after network work. No new timer, transaction abstraction or architecture concept was added. Preparing the reviewed commit and fresh hosted CI; publication remains paused.

Reviewed-head hosted run 38955926583 is blocked on Windows before tests: the unchanged Scala build launcher download from Maven Central returned HTTP 403 (first run had failed retrieving its sbt POM). Sonatype documents 403 as an access block rather than a retry signal and notes shared hosted CI egress may be affected: https://central.sonatype.org/faq/403-error-central/. No endpoint rotation, user-agent change, retry loop or test suppression was added. Linux/macOS qualification is still running. All three actual code findings have been fixed, locally verified and resolved in PR #164; the attempted Codex re-review failed because the account reached its code-review limit, with no additional findings. AC4 and merge remain pending successful Windows CI; publication remains paused.

Reviewed-head Linux and macOS CI completed successfully, and architecture comparison 38955925975 passed. Requested exactly one targeted rerun of the failed Windows job now that the workflow is complete; its previous attempts never reached repository tests. No test retry, changed timeout, mirror, user-agent change or bypass was added. If the Maven access denial persists, keep the PR open and AC4 unchecked.

Windows rerun 38955926583 attempt 2 cleared Maven and reached all tests. It reproduced EPERM/EBUSY cleanup failures in compiled-scanner and first-scan-curation: an unnecessary detached worker held temporary project/executable paths even with only local or no scanners. The launcher now reads only local config before spawning and returns when automaticUpdates is false or no npm source is selected. scanOnce awaits this local decision only; npm registry/download work remains independent. Existing tests and assertions are unchanged. Focused coverage passes 41 tests across seven files, 196 assertions. Targeted own review confirms the npm held-response path still starts independently, disabled/local/empty selections launch no worker, and ownership stays on Command interface. Full checks and the rebuilt standalone smoke follow, then fresh hosted all-platform qualification.

Windows lifecycle fix qualification passes: final bun run check completed lint/types, 16 Node tests and 891 Bun tests with 62 optional skips, zero failures and 3649 Bun assertions. Focused seven-file coverage passes 41 tests/196 assertions, and the rebuilt standalone held-registry smoke passes. Targeted own specification/quality review is limited to the actual Windows no-op-worker finding and its regressions; local-only/empty/disabled selections stop before spawn while npm remains independent after the local config read. No new tests, retries, timeout or platform-specific branch was needed. Pushing this source fix for fresh all-platform CI; AC4 remains pending.

Final source qualification is green on e14464361ad9dc6e4ce5492ce8407b2770686b86: CI run 38958218249 passed Windows, Linux and macOS, and architecture comparison 38958214262 passed. The unchanged Windows compiled-local-scanner and first-scan CLI cases are now covered by successful repository checks after the no-op-worker fix. All three original Codex findings are fixed and resolved; no unresolved review threads remain on PR #164. Codex could not run its later re-review because the account code-review quota was exhausted, so that limit remains visible in the PR. Required cold/full-context reviews and targeted implementer reviews passed; final local full/focused/standalone checks passed. All acceptance criteria and Definition of Done items have evidence. This final commit only records task verification; qualify the resulting hosted head before merging. Publication remains paused.

The final-head CI/architecture checks passed, but merge was not submitted: the pre-merge guard found newly posted Codex finding 4298835159 / PRRT_kwDOTVpKCM6tXAZE on head63a9e42f. It identifies duplicate CLI reporting after the earlier propagation fix. Reopened the task for this targeted regression; all other review findings remain resolved and release publication remains paused.

Duplicate-report regression is reproduced and fixed: the real invalid-config groma scan --watch exited 1 and printed its config error twice before the fix, and now exits 1 with one config error line. The existing startup test failed before the fix because onError was called for the same rejected error; it now requires no duplicate callback. report still publishes live settings notices; enqueue disables the callback only when it propagates the rejection to its caller. Post-start/background errors retain default callback notification. Focused seven-file checks pass 41 tests with 195 assertions, and targeted own review covers this reporting regression only. Full check is running; source must be requalified before merge.

Final duplicate-report fix is locally qualified: focused 41 tests/195 assertions and full lint/types plus 16 Node and 891 Bun tests pass, with 62 optional skips, zero failures and 3648 Bun assertions. The actual source CLI and rebuilt standalone CLI both exit 1 and print the invalid-config startup error once. The API documents that asynchronous errors use onError while startup/change failures reject their promises; live notices are preserved. Targeted specification/quality review confirms one route for propagated failures and unchanged default callbacks for background/watch failures. Committing the source/test/task fix and requiring fresh all-platform CI before merge.

Codex review on source91948de8 raised finding4298945595 / PRRT_kwDOTVpKCM6tXRDc, claiming ignored ready causes an unhandled rejection in terminal owners. This is disproved in installed Bun1.4.3: an isolated child with malformed config deliberately never awaits/catches session.ready, observes the error notice, yields one event-loop turn, closes the session, and exits0 with cleanup completed (/tmp/groma-task617-ignored-ready.log). The existing ready.then success/rejection handlers already consume rejection, along with the serial queue catch. No runtime change or new automated test is justified by this non-reproducing finding; mark it addressed with the existing-handler evidence. Original security review remains clean; all earlier actual findings are fixed.

Final reporting-fix source91948de86215da11f2718d6d4ae0ec64e3768b1d is fully qualified: CI38960774313 passed Windows/Linux/macOS and architecture comparison38960773186 passed. Codex review completed on this source. All five review threads are resolved: four real findings were fixed (startup propagation, atomic config commit, launcher architecture ownership and duplicate reporting), while the ignored-readiness claim was disproved by the existing handlers and isolated Bun exit0/cleanup proof. Windows additionally verified the no-op-worker lifecycle fix. Final local checks: 41 focused/195 assertions; lint/types, 16 Node and 891 Bun tests, 62 optional skips, zero failures, 3648 Bun assertions; source/compiled invalid-config CLI exit1/one message. No runtime changes follow this qualification. This final commit records verification only; qualify its hosted head and merge. Publication remains paused.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Installed scanners run immediately, including offline. Compatible npm updates complete in the background and trigger the normal scan/map watcher. automaticUpdates defaults to true; false disables checks and their follow-up scan while manual commands work. Final selection preserves current config under the existing lock. CLI jobs are independent and skip disabled/non-npm projects; live close cancels checks, and startup errors reject/report once. Command interface owns the launcher. Verified 41 focused tests/195 assertions, full lint/types, 16 Node/891 Bun tests (62 skips, zero failures), source/standalone CLI behavior and green Windows/Linux/macOS CI plus architecture comparison. Codex feedback was evaluated: actual findings fixed, ignored-readiness claim disproved. Publication remains paused.
<!-- SECTION:FINAL_SUMMARY:END -->
