---
id: TASK-660
title: Keep Rust scan time proportional to source size
status: Done
assignee:
  - '@claude'
created_date: '2026-11-16T20:57:00Z'
updated_date: '2026-11-16T22:24:00Z'
labels: []
dependencies: []
references:
  - https://github.com/MrLesk/groma.md/issues/200
  - plugins/scanners/rust/native/src/text.rs
  - plugins/scanners/rust/native/src/scan.rs
  - test-bun/rust-scanner.test.ts
  - docs/scanners/rust/index.md
  - docs/scanners/rust/validation.md
modified_files:
  - plugins/scanners/rust/native/src/text.rs
  - plugins/scanners/rust/native/src/scan.rs
  - test-bun/rust-scanner.test.ts
  - docs/scanners/rust/index.md
  - docs/scanners/rust/validation.md
type: bug
ordinal: 709000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
GitHub issue 200: `groma scan` fails on large Rust repositories because the Rust worker is stopped after 120 seconds. Measured on 2026-11-16 with the released scanner 0.2.3 on an Apple M5: awslabs/aws-sdk-rust, googleapis/google-cloud-rust and Byron/google-apis-rs all fail at that limit. Single generated crates of google-apis-rs take 71 s for one 140,028-line file and 213 s for one 242,655-line file: 1.73 times the lines for 3.0 times the time.

A sampling profile of the 140,028-line crate puts 96% of the worker's time in `scan::calls` and `scan::declarations`. Both call `SourceText::position` and `SourceText::line` (`plugins/scanners/rust/native/src/text.rs`) for every operation and invocation, and each call recounts the file from its first byte. On zed (1.84M hand-written lines, 54 s) the same two functions take about a quarter of the time. The worker also searches every operation once per file when it lists each file's symbols (`plugins/scanners/rust/native/src/scan.rs`), so that step grows with files times operations.

Alex approved on 2026-11-16: fix both in the Rust worker and add a scaling check for the Rust scanner. The acceptance criteria, the 2.8 ratio and stating the cost rule in the Rust scanner documentation only are the coordinator's reading of that approval, not Alex's wording.

Not part of this task and not decided: the 120-second limit and its failure message (the rest of issue 200), the 64 MB output cap, streamed worker output, a shared worker runner, and a cost rule or scaling check for other scanners.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A Cargo project with one long source file scans in time proportional to the file's length: doubling the file multiplies the worker's time by less than 2.8
- [x] #2 The worker groups operations by file once instead of searching every operation for each file; the task notes record the scan time of a many-file project at two sizes before and after the change
- [x] #3 Observations are unchanged: the existing Rust fixtures and a file with non-ASCII text and Windows line endings report the same operations, invocations, positions and lines as before
- [x] #4 A scaling check for the Rust scanner scans one generated long file at two sizes with the built worker and fails when the larger takes more than 2.8 times the smaller; it fails on the worker before this change and passes after it
- [x] #5 The Rust scanner documentation states that the worker's own work stays proportional to source size and how to run the scaling check
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
1. `plugins/scanners/rust/native/src/text.rs`: `SourceText::read` builds three ascending offset tables when it reads the file: every `\n`, every `\n` that is `\r\n` on disk (exists today), and every byte that adds no UTF-16 unit (a character outside ASCII takes 2, 3 or 4 UTF-8 bytes and 1, 1 or 2 UTF-16 units). `line`, `position` and `on_disk_range` count the table entries before an offset with one shared binary search (`count_before`) instead of rereading the file. `SourceText` stays the only owner of the offset-to-file rule; the callers in `scan.rs` and `outline.rs` do not change.
2. `plugins/scanners/rust/native/src/scan.rs`: `symbols_by_file` reads the operations once into a map from file to its symbols, and each file takes its list, instead of filtering all operations per file. Symbol order per file stays the operation order.
3. `test-bun/rust-scanner.test.ts`: the scaling check in the opt-in native suite. It writes one Cargo package with one generated source file of 4,000 and of 8,000 functions into its own temporary directories, starts the built worker on each with the input `scanRustSource` sends, checks that every generated function is reported, and fails when the longer file costs more than 2.8 times the shorter (one `limit` constant). A passing run prints nothing; the failure message carries the two CPU times. Cost is the worker process's CPU time from `Bun.spawn(...).resourceUsage()`, which Bun 1.4.4 fills from `wait4` on Linux and macOS and from `GetProcessTimes` on Windows. Each file is scanned three times, the two in turn, and the least time of each is compared, because load on the machine only adds CPU time. The sizes are the smallest at which the unfixed worker is clearly over the limit (3.7) while a passing run stays near 2 seconds.
4. `docs/scanners/rust/index.md` gets a "Scan time" section: the worker's own work stays proportional to source size (it never reads a file again to find a position or a line, and it reads the operations once to list each file's symbols), the engine's analysis is outside the rule, and the scaling check checks the rule on one long file. `docs/scanners/rust/validation.md` owns the commands: "Reproduce the checks" names the check among the suite's cases and says how to run it alone.
5. Verify: byte-identical worker output before and after for the existing Rust fixtures, a file with non-ASCII text and Windows line endings, and the 140,028-line `apigee1` crate; time `apigee1` and a generated many-file project at two sizes before and after; clippy with warnings denied, the native suite, `bun run check`.
6. `plugins/scanners/rust/package.json` stays 0.2.4: npm has 0.2.3, so 0.2.4 is unpublished and already carries worker changes.

Tests

A. New: scaling check.
- Rule and authority: the Rust worker's own work stays proportional to source size, so a position or line lookup never reads the file again. Alex approved a scaling check for the Rust scanner on 2026-11-16 (task description); the failure is reproduced in the supported flow (issue 200: one 140,028-line file takes the worker 71 s).
- Wrong result it detects: a lookup whose cost grows with the file, so a file twice as long costs about four times the CPU time (the worker before this change) instead of about twice.
- Gap: no test measures scan cost. Smallest test: one generated file at two sizes and one ratio.

B. Extended: the existing Windows-line-endings test gets `é` and `中` beside its `😀`.
- Rule and authority: `position` is a zero-based UTF-16 offset in the file on disk (docs/scanners/evidence.md, docs/scanners/rust/index.md).
- Wrong result it detects: a position after a 2-byte or 3-byte character that is off because the new table weighs the character by the wrong width.
- Gap: the test's only character outside ASCII is outside the Basic Multilingual Plane (4 bytes, 2 units); no Rust fixture holds other non-ASCII text. One edit to the test's string literal covers all three widths.

No test for the grouping by file: it changes no output, which step 5 proves by byte-identical observations, and the task asks for a one-time timing of a many-file project, not a permanent check.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Measured on an Apple M5 (macOS arm64, rustc 1.100.0, Bun 1.4.4) on 2026-11-16. "Before" is a worker built from main before this change; "after" is this change. Times are the worker process's CPU time unless marked wall.

Long file
- `apigee1` of google-apis-rs (`src/api.rs` 140,028 lines; 3,429 operations, 40,332 invocations): before 78.2 s wall (76.7 s CPU), after 1.55 s wall (1.53 s CPU). Its outline: 1.48 s before, 0.08 s after.
- Generated file of the scaling check: before 1.32 s for 4,000 functions and 4.90 s for 8,000 (3.70 times); after 0.21 s and 0.42 s (1.99 times).
- Further doublings after the change, generated file with a two-line body: 8,000 to 16,000 functions 1.98 times, 16,000 to 32,000 2.04, 32,000 to 64,000 2.22 (4.3 MB, 914 MB peak memory).

Many files (generated package, 10 functions per file, output identical before and after)
- 4,000 files: 5.68 s before, 1.79 s after.
- 8,000 files: 25.13 s before, 3.91 s after.

Observation unchanged
- The adapter's own functions (`scannerFiles`, `rustProjects`, `checkRustReadiness`) built each worker input as `scan` does; the same input went to both workers and their output was compared byte for byte: 20 of 20 identical. Inputs: the scan and the outline of the fixtures rust-collision, rust-declared-roots (two projects), rust-duplicates, rust-http, rust-semantic, rust-shared and rust-outline (outline only, it has no Cargo project); a package with 2, 3 and 4 byte characters in comments, strings and identifiers, Windows line endings, mixed line endings and a lone carriage return; the same package with a syntax error (same exit code and same byte range in the message); `apigee1` (7,034,615 bytes of output).
- One-time check outside the repository: the old recounts and the new table lookups, copied side by side, agree on position, line and on-disk offset at every character boundary of 20,000 generated texts (1,021,532 offsets).

Scaling check: how it measures and why the verdict is stable
- It compares two scans by the same worker in the same test, so the speed of the machine cancels.
- Cost is CPU time (user plus system) of the worker process, from `Bun.spawn(...).resourceUsage()`. Read in Bun's source at the 1.4.4 tag: `wait4` on Linux and macOS, `GetProcessTimes` on Windows. Executed here on macOS arm64 only; Linux and Windows are not run locally.
- CPU time still grows under load on this machine: one 8,000-function scan took 0.45 s idle, 0.61 to 0.67 s beside 4 busy processes and 0.77 to 0.83 s beside 16. Under steady load both scans grow alike (single pairs 1.75 to 2.15). Under load that comes and goes, a single pair read up to 2.97 (16 processes busy in bursts of 1 s and 3 s), which would fail a correct worker. The check therefore scans each file three times, the two in turn, and compares the least time of each.
- With that (ratios read from a line the check printed until the review round): 1.92 to 2.37 in 23 runs alone, 2.00 in both runs inside `bun run check`, 1.87 to 2.26 in 13 runs inside the whole native suite at default concurrency, and 1.61 to 2.31 in 20 runs beside 16 processes that were busy all the time or in bursts of 250 ms, 500 ms, 1 s and 3 s. The worker before the change read 3.39 to 3.70 in four runs.
- Sizes: the unfixed worker reads 2.64 at 500 and 1,000 functions (it would pass), 3.11 at 1,000 and 2,000, 3.48 at 2,000 and 4,000, 3.70 at 4,000 and 8,000. At 4,000 and 8,000 a passing run takes about 2 s wall and the unfixed worker fails in 19 s. The test states this beside the sizes.
- Limit: the check detects a lookup that reads the text again. A linear scan of one offset table is about 100 times cheaper per entry and stays under 2.8 at these sizes; the single shared `count_before` and the note on `SourceText` guard that.

Checks
- Native suite (`GROMA_TEST_RUST=... bun test --timeout 60000 test-bun/rust-scanner.test.ts`): 15 pass. With the worker before the change: 14 pass, the scaling check fails with 3.70; the extended Windows-line-endings test passes on both workers.
- `bun run check` with `GROMA_TEST_RUST` set, twice: exit 0, 977 pass, 48 skip, 0 fail; the scaling check read 2.00 both times.
- After the review round, on the rebuilt worker: the worker output is again byte-identical to the worker before the change on all 20 inputs (18 run on both workers, `apigee1` compared with the saved output). `bun run check` with `GROMA_TEST_RUST`: exit 0, 977 pass, 48 skip, 0 fail. The native suite one test at a time, as `bun run check` runs it: 15 pass in 3 of 3 runs. At default concurrency it passed in 1 of 4 runs; in the other three the hang described below stopped one or two other tests at 60 s while large measurement scans were running on the machine. The scaling check alone passes, and against the worker before the change it fails with `CPU time: 1552 ms for 4000 functions, 5547 ms for 8000 functions`, expected below 2.8, received 3.57. Clippy reports the same three findings and nothing else.
- `cargo clippy --locked ... -- -D warnings` with clippy 0.1.100: fails on three `needless_borrow` findings in `endpoints.rs:273` and `handlers.rs:62` and `:72`. The same three appear on main's unchanged source; none is in a file this task changes, and with that one lint allowed clippy finishes clean. Not fixed here: outside the task.

Found, not changed
- The native suite at default concurrency sometimes hangs one test until its 60 s limit: `bun test` is left with a child (git or the worker) that exited and was never collected. It happens without this change too: run in turn on the same machine, main's unchanged suite hung in 8 of 20 runs, this change in 3 of 20, and this change without the scaling check in 3 of 20 (separate batches before that: main 1 of 12, this change 9 of 20). The scaling check itself completed in every run. `bun run check` runs the file's tests one at a time and did not hang.
- After the change the many-file scan still grows a little faster than the file count (2.01, 2.08, 2.19 times per doubling from 2,000 to 16,000 files). Not profiled.

Correction history
- First version of the check compared one scan of each size. Replaced by the least of three after the load measurements above.
- Review round, 2026-11-16 (two external reviews, nothing blocking; no behavior change). The coordinator accepted the least of three scans and leaving the three clippy findings as a follow-up. Applied: the "Scan time" section now claims only the worker's own work and leaves the engine's analysis outside the rule, and the command moved to validation.md "Reproduce the checks"; the check prints nothing on success, its failure message carries the two CPU times, the limit is one constant and the test is named `scan time stays proportional to source size`; `scanCpuTime` takes `functionCount`; in text.rs the table builder is `find_bytes_without_utf16_unit`, the UTF-8 and UTF-16 note sits on the field, and the struct note no longer says `read` passes the text once. Acceptance criterion 5 was reworded by the coordinator to match the narrower documentation.

Definition of Done: (1) the evidence for each criterion is in the sections above; (2) `bun run check` exits 0 and the native suite passes, the three clippy findings and the suite's hang exist on main and are follow-ups, and the work commit holds two worker files, one test file, two documentation files and this record; (3) `docs/scanners/rust/index.md` and `docs/scanners/rust/validation.md`; (4) the plan above and the correction history.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
The Rust worker no longer reads a file again to place a function or a call, and no longer searches every operation for each file.

- `plugins/scanners/rust/native/src/text.rs`: `SourceText` builds three ascending offset tables when it reads a file (line ends, removed carriage returns, bytes that add no UTF-16 unit) and answers `position`, `line` and `on_disk_range` with one shared binary search. It stays the only owner of the rule that turns an offset in the parsed text into a place in the file on disk.
- `plugins/scanners/rust/native/src/scan.rs`: `symbols_by_file` reads the operations once to list each file's symbols.
- `test-bun/rust-scanner.test.ts`: the native suite's scaling check scans one generated file of 4,000 and of 8,000 functions and fails when the longer one costs more than 2.8 times the worker's CPU time (least of three scans each). The Windows-line-endings test also covers 2 and 3 byte characters.
- `docs/scanners/rust/index.md` "Scan time" states the rule for the worker's own work; `docs/scanners/rust/validation.md` says how to run the check.
- `@groma/scanner-rust` stays 0.2.4, which is not published yet.

Why: GitHub issue 200. One 140,028-line file took the worker 78 s and now takes 1.5 s; a generated package of 8,000 small files went from 25 s to 3.9 s.

Verification: the worker prints byte-identical output before and after on 20 inputs (the Rust fixtures, a package with non-ASCII text and Windows line endings, the 140,028-line crate). The scaling check reads about 2.0 after the change and 3.4 to 3.7 before it. `bun run check` with `GROMA_TEST_RUST` set passes (977 pass, 48 skip, 0 fail).

Risks and follow-ups, none done here:
- CPU time on Linux and Windows is read from Bun's source at 1.4.4, not run locally; CI is the first run there.
- The check catches a lookup that reads the text again, not a linear scan of one offset table.
- Clippy 0.1.100 reports three `needless_borrow` findings on main (`endpoints.rs:273`, `handlers.rs:62`, `handlers.rs:72`).
- The native suite at default concurrency sometimes hangs one test to its 60 s limit, on main too: `bun test` does not collect a child that exited. One test at a time, as `bun run check` runs it, it passes.
- The engine's analysis is outside the rule: a many-file scan still grows slightly faster than the file count.
- The 120-second worker limit and the rest of issue 200 are untouched.
<!-- SECTION:FINAL_SUMMARY:END -->
