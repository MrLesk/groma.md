---
id: TASK-651
title: Scan Rust string continuations in files with Windows line endings
status: To Do
assignee: []
created_date: '2026-11-11T22:54:00Z'
labels: []
dependencies: []
references:
  - 'https://github.com/MrLesk/groma.md/issues/211'
  - plugins/scanners/rust/native/src/scan.rs
type: bug
ordinal: 706000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
GitHub issue 211: on a Windows checkout the Rust scanner rejects a file the Rust compiler accepts. A string literal that ends a line with a backslash (a line continuation) is reported as `invalid Rust syntax: unknown character escape`, and the whole Cargo project then produces no observation (`RUST_ANALYSIS_FAILED`). The reporter had to exclude each such file by hand; a second report (issue 212) lists ten affected files in one workspace.

The trigger is the line ending, not the continuation itself: the same function scans with LF endings and fails with CRLF endings. Reproduced on macOS by appending a function with `format!("first \` + line break + `second")` to `src/provider.rs` of the `rust-semantic` fixture, once with LF and once with CRLF, and calling `scanRustSource` with the built worker. The Rust compiler treats CRLF as a line break before it reads string escapes; the worker validates the raw file text (`plugins/scanners/rust/native/src/scan.rs`).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A Cargo project that contains a CRLF Rust file with a backslash line continuation inside a string literal produces its observation instead of RUST_ANALYSIS_FAILED
- [ ] #2 That CRLF file yields the same operations and invocations, at the same line positions, as the same file saved with LF endings
- [ ] #3 A Rust file with a genuinely invalid character escape is still reported as invalid Rust syntax
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Acceptance criteria have objective verification evidence.
- [ ] #2 Relevant checks pass and changes remain task-scoped.
- [ ] #3 Public contracts or documentation are updated when behavior changes.
- [ ] #4 Implementation Plan reflects the final approach; correction history and verification are recorded in Implementation Notes.
<!-- DOD:END -->
