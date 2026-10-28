---
id: TASK-633
title: Qualify opt-in native AOT builds
status: In Progress
assignee:
  - '@codex'
created_date: '2026-10-27T23:16:00Z'
updated_date: '2026-10-28T00:33:00Z'
labels: []
dependencies: []
references:
  - scripts/build.ts
  - scripts/prepare-bun-runtime.cjs
  - .github/workflows/release.yml
modified_files:
  - scripts/build.ts
  - scripts/aot-compiler.json
  - scripts/prepare-bun-runtime.cjs
  - .github/workflows/aot.yml
  - docs/native-aot.md
  - scripts/qualify-compiled-web.ts
  - test-bun/compiled-scanner.test.ts
  - backlog/attachments/task-633/aot-package-manager.mjs
  - scripts/qualify-compiled-scanners.ts
  - scripts/prepare-tui-test.cjs
  - scripts/qualify-compiled-tui.ts
ordinal: 701000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The actual build script still emits bytecode builds and requires a scratch wrapper for native compilation. Release qualification needs repeatable opt-in AOT and trim modes, scanner disk loading and native checks on every existing release target without changing publication defaults.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Default build and release behavior remain unchanged; opt-in AOT and trim modes reject an unsupported compiler or a mismatched runtime
- [ ] #2 Opt-in AOT and AOT+trim pass compiled smoke with disk-loaded scanners and embedded assets
- [ ] #3 Native qualification covers every release OS and architecture with verified compiler provenance and records real results or concrete blockers
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
Use the existing build entry point with explicit opt-in environment flags, bytecode disabled for AOT, scanner disk imports enabled, and current compiler/runtime identity enforced. Check compiler capability before accepting experimental flags. Add native qualification outside the publishing workflow, using pinned Buildkite artifacts and checksums for the existing five release targets. Reuse compiled scanner and package runtime smoke coverage. Test defaults and unsupported-mode errors locally, then execute native CI and record platform gates.

Extend native delivery qualification beyond the existing CLI/export regression: the user explicitly requires real web, native watching and shutdown on supported targets. Existing compiled-scanner and packaging checks do not start the compiled HTTP server or cause a watched source change. Add a small consumer qualification script using the same flows fixture and a disk-loaded scanner/dependency; verify embedded HTML/JS, world JSON, all cover images, a new source component after watching, and graceful shutdown in each native CI mode.

Run a real Chromium rendering gate on the Linux x64 hosted runner, where the browser can be downloaded independently of this scratch environment. Use pinned Playwright CLI 1.62.1 without adding a product dependency; wait for the JavaScript-rendered map SVG and retain the screenshot as qualification evidence. Other native runners retain the HTTP/watch/shutdown gate.

Reuse the already-built native artifact in the existing compiled-scanner regression via the same GROMA_TEST_CLI input used by packaging checks. Windows x64 run 40602974891 timed out at 60 seconds after its fifth assertion, while rebuilding inside the test; remove duplicate compilation instead of increasing the timeout or weakening export assertions. Keep the default test path building its own artifact.

Qualify real installed official scanner packages, starting with the Python parser worker. Reproduced AOT+trim scan returning zero with PYTHON_SCAN_FAILED because node:vm was removed; lint rejects it. Retain node-vm explicitly for disk-loaded Python/Pyodide code. Add a consumer qualification script that installs pinned official scanner packages into temp fixtures, requires actual code evidence and lint success, and runs in the native workflow before the known untrimmed package-manager gate. Existing local-scanner regression cannot detect removed APIs only used by real installed runtimes.

The Swift fresh-checkout fixture intentionally contains duplicate functions, so lint exit1 is a valid finding, not scanner failure. Compare native lint exit/stdout/stderr with the same compiler running the source CLI under its JIT, after requiring new source evidence. This retains exact findings and catches removed APIs without treating intentional fixture violations as compiler defects.

Use the repository-prescribed tui-test procedure for real native console qualification, including Windows Ctrl+C. Pin official tui-test0.1.1 archives by published SHA256 and reuse the existing patched-Node HTTPS downloader. Drive a fresh flows fixture through root/details/container/back navigation, capture screenshots at normal/large sizes, send actual Ctrl+C and assert exit0 separately. Local tui-test cannot start its daemon in this scratch environment, so qualify the harness on native CI; do not label that infrastructure failure a Groma failure.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented opt-in GROMA_BUILD_AOT=1 and independent GROMA_BUILD_TRIM=1 in scripts/build.ts; AOT disables bytecode and permits installed scanner imports. Stable Bun 1.4.4 rejects each unsupported flag before preparing assets; experimental builds reject a different embedded runtime. Direct AOT+trim and x64 baseline-target smoke pass guides/plain view/local scanner dependency/scan/lint/export. Direct AOT baseline-target compiled regression passes all 8 assertions. Trim-only build compiles and smoke passes independently. Downloaded native compiler archives for all five existing release platforms from Buildkite build 133944, verified their published SHA-1 artifact digests, and recorded SHA-256 of both archives and extracted executables plus full commit/revision in scripts/aot-compiler.json. Linux binary SHA matches prior provenance. The existing patched-Node/TLS/checksum runtime preparation now has explicit --aot mode; default stable release pins remain unchanged. Host Node 24 correctly fails the patched-version check. Downloaded official Node 26.12.1 with its published SHA-256 for local validation. Its managed-proxy tunnel timed out on the live Buildkite request; with only the network stream supplied from the already verified local archive, extraction, executable SHA-256 and exact compiler revision verification succeed. A tampered archive is rejected before extraction. The native workflow is separate from publishing, covers native Linux x64/arm64/macOS arm64/Windows x64/arm64, preserves x64 baseline targets, and will run both compiled scanner and packaged-runtime checks in each AOT mode. YAML parses and has five targets. Full required repository check is running; native CI results remain open.

First native CI run 40601608609 starts all five native runners. Compiler preparation returned HTTP 403 on Linux and macOS. Reproduced the exact cause with the same Buildkite artifact URL: empty User-Agent gets HTTP 403, explicit groma-native-build-qualification gets HTTP 200/application-zip. Added an identifying User-Agent to the verified downloader, retaining TLS and checksum verification. This is a download-protocol fix, not a compiler/platform failure. Full required check after build-option implementation: lint/types/Node tests pass; Bun suite 905 pass, 63 skip, 28 fail of 996, matching the earlier missing-toolchain/baseline watcher failure count. The extra scanner-update timing failure from the prior run did not recur. AOT and AOT+trim direct compiled regression both pass 8 assertions; trim-only and baseline-target full CLI smoke pass.

Second native run 40601764572: Linux arm64 and macOS arm64 complete successfully in both AOT modes; Linux x64 baseline completes smoke and uploads artifacts. Both Windows targets are still running. Local packaged C and C++ WASM scanners and packaged JavaScript scanner pass scan/plain view/lint/full export in both modes. AOT Groma plus the AOT+trim Backlog executable also pass the actual bundled work-source bridge: initial tasks appear, edits update the live world in ~102ms, SIGTERM exits 0, and watcher subprocesses do not remain. Full headless-browser verification remains open: installed Playwright has no browser, and its Chromium download returns an invalid/truncated archive in this environment; HTTP and source-level DOM suites are passing, but they are not described as a browser pass.

All five native targets pass the first complete CLI/export/packaged-runtime matrix in run 40601764572 on source 4dec346c9f1952d5237122b5830336054c3d1cfc, with AOT and AOT+trim on each: Linux x64 baseline, Linux arm64, macOS arm64, Windows x64 baseline and Windows arm64. This proves those smoke flows only. Added a consumer qualification script for the remaining native web/watch/shutdown gate; it passes locally against AOT+trim baseline target and is being added to both native CI modes. Playwright browser CDN responds HTTP 200 text/html Site Unavailable instead of the Chromium ZIP in this environment, so a full browser pass is still not claimed.

The new compiled web/watch qualification passes on Linux x64 against both AOT modes, including embedded font CSS, all three PNG covers, installed dependency loading, a new source component after native watching, and SIGTERM exit 0. The two pre-existing watcher test failures are now specifically qualified as a scratch PID-namespace limitation: process.pid=5, /proc/self/status NSpid=126544/5, ps -p 5 returns no process while process.kill(5,0) succeeds. Those tests use ps to assert a second watcher is alive; this environment reports the outer process namespace through procfs. Actual compiled two-process Backlog/Groma watch shutdown succeeds, so no product workaround was added. Required check for the added qualification script is running under Node 26.12.1 and Bun 1.4.4.

The required check after adding web qualification completed lint/types and Node tests under patched Node 26.12.1; Bun suite has 904 passes, 63 skips and 29 failures, with the known scanner-update timing failure recurring alongside the earlier 28 environment/baseline failures. Added a pinned Chromium rendering gate on the Linux x64 hosted runner to avoid treating the scratch browser-download restriction as a product failure. It waits for the JS-created map SVG and retains screenshots; other native targets keep the web/watch/shutdown checks. Final required check is running after this qualification-only change.

Native web qualification run 40602467789 reaches Windows HTTP assets, covers, scanner imports and watch refresh, then fails only the POSIX shutdown expectation: both Windows targets exit 143 after child.kill(SIGTERM). Node process documentation explicitly states SIGTERM is unsupported on Windows and programmatic SIGINT/SIGTERM/SIGKILL unconditionally terminate a Windows child. Replace this incorrect platform assumption with a same-compiler uncompiled process control that installs a SIGTERM handler; require the AOT process to match the control. POSIX still requires graceful exit 0. This preserves an explicit shutdown comparison and does not claim Windows console Ctrl+C is verified.

Additional actual product blocker reproduced in both AOT and AOT+trim: plugin add @groma/scanner-javascript@0.2.3 fails because package-manager.ts spawns process.execPath with BUN_BE_BUN=1; AOT removes the Bun command line, so the native executable cannot act as pm view/install. This is independent of scanner disk imports and was absent from the local already-installed scanner regression. Investigate explicit retention of CLI/package-manager code before changing the product runtime contract or registry/auth handling; do not replace it with raw registry fetches that ignore npmrc/proxy/certificate behavior.

Retaining compile.trim.allow=[cli] fixes actual npm scanner installation under AOT+trim: plugin add @groma/scanner-javascript@0.2.3 succeeds. Keeping only install does not retain the CLI entry point; retaining cli while removing other CLI commands also loses that entry point. Updated trimmed builds to keep cli, preserving the existing npmrc/proxy/certificate contract and the no-external-Bun runtime contract. This compiler therefore provides no current retention setting for the untrimmed AOT path; npm installation still fails there, and it remains an explicit open blocker. Binary size changes materially: full Groma AOT+trim retaining CLI is 185959304 bytes versus 175135432-byte same-compiler JIT; the earlier 128065992-byte trimmed artifact cannot install npm scanners and is not a shipping size result. Keep the faster/smaller old measurements qualified as incomplete product flows. Need narrow upstream retention support to avoid carrying the entire Bun command line and to retain package-manager capability without full trimming.

Direct build-script AOT+trim with CLI retention produces 185959304 bytes, passes existing compiled regression against the built artifact (7 assertions, ~2.1s), and passes live web/assets/covers/watch/termination qualification. The installed npm JavaScript scanner then scans and exports successfully. Minimal standalone reproducer is saved at backlog/attachments/task-633/aot-package-manager.mjs: AOT alone exits 70 for BUN_BE_BUN pm --help; AOT+trim allowing install also exits 70; AOT+trim allowing cli exits 0. Native CI now checks this capability explicitly, exercises the retained-CLI trimmed mode first, and still reports the untrimmed-mode failure instead of hiding it. Diagnostic artifacts are retained even on failure. Prior native run 40602974891 verifies all live web/watch gates on Linux arm64/macOS arm64/Windows arm64 and a real Chromium-rendered map in both modes on Linux x64; screenshots inspected and render correctly. Windows x64 instead hit the duplicate-build regression timeout (not a demonstrated product hang); the test now reuses the built artifact without raising its 60s limit. Stable CI run 40601764380 passed the full repository check on Linux/macOS/Windows for the build-option code; local failures remain missing tools/PID namespace and intermittent scanner-update timing. COBOL baseline failure also reproduces on unchanged main and is specifically missing jar.

Final required local check for the retained-CLI/reused-artifact implementation: lint/types/Node tests pass; Bun905pass63skip28fail of996, same environment/baseline set. Current native run40604023011 Linux arm64 completes retained-CLI AOT+trim pm capability, compiled7assertions, web/watch/covers/exit0 and packaged7assertions, then intentionally exposes the real untrimmed AOT BUN_BE_BUN failure(exit70). Fair final-source Linux benchmark rebuilt JIT after the docs/build changes: JIT175139528bytes / median52.45ms / peakRSSmedian73390KiB; functional AOT+trim with CLI185959304bytes /33.01ms /61216KiB. Ten measured plain-view runs after two warmups, identical output, no other local test/build load. This replaces the earlier size comparison for functional builds.

Native run40604023011 completed on all five targets. On every target, AOT+trim with CLI retained passes self pm capability, the reused compiled scanner/export regression, live web/assets/covers/source watching, platform termination comparison and packaged-runtime checks. Linux x64 also passes Chromium rendering. Each job then fails exactly at the untrimmed AOT pm capability check with exit70, so the workflow remains correctly red. Windows x64 no longer times out after reusing the built artifact. Overall shipping readiness remains open: independent untrimmed package-manager retention, narrower CLI retention/size, full Windows console/TUI qualification, remaining official scanners, and Backlog native platform/integration work. No release defaults changed; final evidence-only commit does not alter tested product/build code.

Latest regular CI40604023281 passes full checks on Linux/macOS/Windows. Upstream PR45631 has merged (2026-10-27T23:50:42Z). Official bun-pr now downloads000968de8e5a99f0d171868c7d3e714c9700e4af, Buildkite134059, revision1.4.4-canary.1+000968de8, binary SHA256c2c17501f6fe3d93333e55275a755de178d2ac83948ca49bcd965d65dc975115. The exact minimal package-manager reproducer still fails AOT/keep-install with exit70 and passes keep-cli. New actual npm Python0.2.3 installation succeeds on existing retained-CLI artifact, but scan reports removed node:vm, produces no Python evidence and returns zero; lint fails. Earlier 185959304-byte size therefore qualifies JavaScript/npm flows, not all official scanners. Investigate required retention and correct evidence before claiming functional shipping size.

Reproduced Python missing-node:vm defect before retention: new consumer qualification fails because no architecture code evidence points to source fixture files, even though scan exits0. With compile.trim.allow including node-vm, actual npm Python0.2.3 installation, source evidence, lint and PNG export pass (185611ms total under concurrent local checks; not a clean performance benchmark). Native workflow now exercises all22 official scanner package versions declared by the checkout before the known untrimmed pm failure, records independent failures without skipping later scanners, and still fails overall if any scanner fails. Local published JavaScript/PHP/C/Cpp/Ada/MQL5/Mojo/Dart/Java/Go/Rust/Csharp/Angular/React/Vue/Scala consumers already pass installation, actual code evidence, lint and PNG export; remaining runs ongoing. Prior retained-CLI size and five-platform green flows did not qualify Python; no all-scanner shipping claim.

All22 published official scanner consumers now pass locally on Linux AOT+trim after node-vm retention: installation, actual source evidence, lint and PNG export. Swift fixture deliberately contains duplicate functions, so initial lint-zero assertion was incorrect; updated gate compares exact exit/stdout/stderr with a same-compiler source/JIT control and Swift/Cobol/Nasm/TypeScript pass that gate. The other17 plus Python passed original clean-lint gate. Full required local check before the final lint-control correction completed lint/types/Node; Bun905pass63skip28fail/996/149.07s, same missing Java/Swift toolchains and procfs baseline. Final required check is running after the correction. Native official-scanner results pending; no all-platform scanner claim.

Final required check after lint-control correction:lint/types/Node pass;Bun905pass63skip28fail/996/135.00s, same environment/baseline. Fair current-source same-compiler plain-view benchmark10 measured after2warmups: JIT175139528bytes/52.62ms/73408KiB vs AOT+trim retaining cli+node-vm185975624bytes/29.83ms/60942KiB; identical output. Clean single paired Python lint run: JIT1855.36ms/270672KiB vs AOT44578.91ms/163852KiB, identical output. This is a significant runtime performance concern, not a median benchmark. Scratch retention probe adding jit increases binary to196002504bytes but still takes43.21s; no production jit-retention change. Native official-scanner run40608004826 Linux ARM passes all22 installed scanner/evidence/lint-control/export checks plus prior web/packaging gates, then fails known untrimmed pm exit70. Other native results pending. New console gate uses verified tui-test0.1.1 and exact key API from agent-context; local daemon cannot accept connections, so native CI is required for real console validation.

Console-driver preparation verified locally with the already verified Linux archive supplied as the HTTPS response: executable extraction and exact0.1.1 revision succeed; tampered archive rejected before extraction. Official Windows ZIP downloaded and SHA256 verified; exact member tui-test.exe confirmed. CJS syntax checks pass. Console driver install reuses existing patched-Node downloader and guards direct execution so requiring its helpers has no download side effect. Native console screenshots/assertions remain pending.

Native run40608004826 on ec302 passes all22 actual installed official scanners, code evidence, same-compiler JIT lint findings and export on ALL FIVE native targets; each then fails only known untrimmed pm exit70. New console run40608854750 reaches root/details/container/back/resize/screenshots and Ctrl+C wait-exit on Linux ARM and macOS, then fails a harness assertion: tui-test expect exit-code reads shell-command markers, which direct run does not track. Official tui-test0.1.1 source confirms daemon status JSON data.exited is the PTY process exit code. Correct the gate to assert that field equals0; retain actual shutdown check. This is a test-driver assumption correction, not a product exit fix.
<!-- SECTION:NOTES:END -->
