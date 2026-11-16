---
id: TASK-660
title: Keep Rust scan time proportional to source size
status: To Do
assignee: []
created_date: '2026-11-16T20:57:00Z'
labels: []
dependencies: []
references:
  - https://github.com/MrLesk/groma.md/issues/200
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
- [ ] #1 A Cargo project with one long source file scans in time proportional to the file's length: doubling the file multiplies the worker's time by less than 2.8
- [ ] #2 The worker groups operations by file once instead of searching every operation for each file; the task notes record the scan time of a many-file project at two sizes before and after the change
- [ ] #3 Observations are unchanged: the existing Rust fixtures and a file with non-ASCII text and Windows line endings report the same operations, invocations, positions and lines as before
- [ ] #4 A scaling check for the Rust scanner scans one generated long file at two sizes with the built worker and fails when the larger takes more than 2.8 times the smaller; it fails on the worker before this change and passes after it
- [ ] #5 The Rust scanner documentation states that scan time stays proportional to source size and how to run the scaling check
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Acceptance criteria have objective verification evidence.
- [ ] #2 Relevant checks pass and changes remain task-scoped.
- [ ] #3 Public contracts or documentation are updated when behavior changes.
- [ ] #4 Implementation Plan reflects the final approach; correction history and verification are recorded in Implementation Notes.
<!-- DOD:END -->
