---
id: TASK-651
title: Scan Rust string continuations in files with Windows line endings
status: Done
assignee:
  - '@claude'
created_date: '2026-11-11T22:54:00Z'
updated_date: '2026-11-11T23:28:00Z'
labels: []
dependencies: []
references:
  - 'https://github.com/MrLesk/groma.md/issues/211'
  - plugins/scanners/rust/native/src/scan.rs
  - plugins/scanners/rust/native/src/text.rs
  - plugins/scanners/rust/native/src/outline.rs
modified_files:
  - plugins/scanners/rust/native/src/text.rs
  - plugins/scanners/rust/native/src/scan.rs
  - plugins/scanners/rust/native/src/outline.rs
  - docs/scanners/rust/index.md
  - plugins/scanners/rust/package.json
  - bun.lock
  - test-bun/rust-scanner.test.ts
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
- [x] #1 A Cargo project that contains a CRLF Rust file with a backslash line continuation inside a string literal produces its observation instead of RUST_ANALYSIS_FAILED
- [x] #2 That CRLF file yields the same operations and invocations, at the same line positions, as the same file saved with LF endings
- [x] #3 A Rust file with a genuinely invalid character escape is still reported as invalid Rust syntax
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
Cause (reproduced with a worker built from this branch, engine 0.0.358): the Rust compiler reads every `\r\n` as `\n` before it reads tokens; the worker and the engine it loads read the raw file. In a CRLF file the `\r` after a line-ending `\` in a string literal is an unknown escape, and the `\r` of any multi-line literal expression is a bare carriage return, so the worker's validity check fails the Cargo project.

Why the validity check alone is not enough: a throwaway build that normalized only the text of the validity check scanned the CRLF file, but its operation tokens kept `\r\n` inside the literal (`"first \\\r\n        second"`) while the LF copy has `\n`. Acceptance criterion 2 needs the same operations, so the engine must parse the compiler's text too.

1. `plugins/scanners/rust/native/src/text.rs`: add `SourceText`, the one owner of the reading rule. It reads a file, holds its text with each `\r\n` as `\n`, and converts an offset in that text to the file on disk: UTF-16 `position`, `line`, and the byte range of a syntax error. It replaces the free `position` and `line` functions, so an offset cannot be paired with another text.
2. `plugins/scanners/rust/native/src/scan.rs`: after the engine loads the workspace and before any analysis runs, replace the text of each loaded Rust file with its `SourceText` text. The per-file loop validates and keeps the same `SourceText`; operations and invocations report positions and lines through it; a syntax error keeps its message and its byte range in the file on disk.
3. `plugins/scanners/rust/native/src/outline.rs`: read and count lines through `SourceText`, so the worker has one way to read a Rust file. Outline output does not change.
4. `docs/scanners/rust/index.md`: state the reading rule and that positions and lines refer to the file on disk.
5. `plugins/scanners/rust/package.json` and `bun.lock`: 0.2.3 to 0.2.4, because the package contents change (AGENTS.md, Releases; same form as TASK-622).

Test (one test in `test-bun/rust-scanner.test.ts`, toolchain-gated):
- Rule and authority: acceptance criteria 1 to 3 and the reproduced failure of issue 211; the evidence contract (`docs/scanners/evidence.md`) defines `position` as a UTF-16 offset in the source text, which other scanners' tests read as the file on disk.
- Wrong results it detects: the CRLF scan fails (today); the CRLF file reports tokens or lines that differ from its LF copy (validity-only fix); a position counted in the normalized text, short by the carriage returns before it; an invalid escape accepted in a CRLF file, or reported at a shifted offset.
- Coverage gap: no Rust test scans a CRLF file, and the failing-scan test uses a parser error in an LF file. The test scans `src/provider.rs` of `rust-semantic` with an appended continuation, once with LF and once with CRLF, compares names, lines, tokens and call targets (sorted, because an observation orders them by an id that holds the offset), checks one operation and one call position against the CRLF text, then adds an invalid escape. No outline test: its output is unchanged and existing outline tests cover it.

Verification: build the worker from this branch with Rust 1.99.1; run the new test against the worker built before the change (must fail) and after (must pass); run the gated Rust suites; `bun run check`.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Findings
- Reproduced on macOS with a worker built from this branch before the change (engine 0.0.358): `rust-semantic` with a function `format!("first \` + line break + `second")` appended to `src/provider.rs` scans with LF and fails with CRLF: `RUST_ANALYSIS_FAILED: src/provider.rs: invalid Rust syntax: [SyntaxError("unknown character escape", 257..282)]`.
- The same cause fails a CRLF file with any multi-line string literal expression, without a continuation: `SyntaxError("Character must be escaped: `\r`", ...)`. The fix covers it.
- The engine loader (`ra_ap_load_cargo`) puts raw file text in its database, so the engine's trees also held `\r\n`.

Correction history
- A validity-only fix was built and measured first. The CRLF file scanned, but its tokens differed from the LF copy (`\r\n` inside the literal token), so acceptance criterion 2 was not met. The engine now gets the normalized text.
- The engine pass reads each loaded Rust file from disk again. Reading the text back from the engine was rejected: the engine panics for a loaded file it holds no text for (a file that is not UTF-8). A non-UTF-8 `.rs` file that is no module scans as before.
- The first version of the test compared operations by index. A scale check showed that an observation orders operations by id, which holds the offset, so the order can differ between the LF and CRLF copies. The test now sorts what it compares.
- A syntax error's byte range is converted to the file on disk, so the message for invalid Rust in a CRLF file is identical to the one before the change.

Verification (macOS arm64, Rust 1.99.1)
- New test `a file with Windows line endings scans like its LF copy, with positions in the file on disk`: fails with the worker built before the change (`unknown character escape`), fails at the comparison with the validity-only build, fails at the position (`Expected: 289, Received: 277`) with a build that reports unconverted offsets, passes with the final worker (4 assertions).
- Gated suites with the final worker: `GROMA_TEST_RUST=$PWD/plugins/scanners/rust/dist/bin/darwin-arm64/groma-rust-scanner bun test --timeout 60000 test-bun/rust-scanner.test.ts test-bun/rust-workspace.test.ts test-bun/execution-evidence-native.test.ts`: 28 pass, 0 fail, 1 skip (the Go test, gated by `GROMA_TEST_GO`).
- Scale check on copies of two published crates (25,075 and 102,459 lines): the LF copy gives a byte-identical observation before and after the change in the same time (1.72 s and 1.72 s on the larger); the CRLF copy fails before the change and afterwards reports the same operations, lines, tokens and calls as the LF copy, with all 11,768 and 21,229 positions at the same text in the file on disk.
- Invalid Rust in a CRLF file: the invalid-escape and bare-carriage-return messages, byte ranges included, are identical before and after.
- Outline of the `rust-outline` fixture: identical output for LF and CRLF copies, before and after.

- `bun run check` with the Rust suites enabled (`GROMA_TEST_RUST` set to the worker built from the final source): exit 0. Biome lint, the scrollbar lint and TypeScript pass; Node tests 26 pass; Bun tests 962 pass, 0 fail, 47 skip (other toolchains). Without `GROMA_TEST_RUST` it also exits 0 (944 pass, 65 skip).
- `git diff --check` is clean. No file was added or renamed and no scan ran in this checkout, so `groma/` has no change.

Not verified: Windows and Linux hosts. The worker was built and run on macOS arm64 only; the test rewrites the fixture's line endings itself, so it does not depend on how a Windows checkout stores them.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
The Rust worker now reads every Rust file the way the Rust compiler does: a `\r\n` line ending counts as `\n`. A Cargo project with CRLF files scans, and a CRLF file reports the same operations, lines, comparison tokens and calls as its LF copy. Before, the `\r` after a line-ending `\` in a string literal was an unknown escape, the `\r` in any multi-line literal expression was a bare carriage return, and either one failed the whole Cargo project.

What changed
- `SourceText` in `plugins/scanners/rust/native/src/text.rs` owns the rule. It reads a file, holds the normalized text, and converts an offset in that text to the file on disk (UTF-16 position, line, byte range of a syntax error). The free `position` and `line` functions are gone, so an offset cannot be paired with the wrong text.
- The scan gives the engine the same normalized text before analysis, validates it, and reports positions through `SourceText`. The outline reads through it too; its output is unchanged.
- Positions and syntax-error ranges still refer to the file on disk. Invalid Rust fails with the same message as before.
- `docs/scanners/rust/index.md` states the rule. `@groma/scanner-rust` is 0.2.4.

Verification (macOS arm64, worker built from this branch with Rust 1.99.1)
- The new test in `test-bun/rust-scanner.test.ts` fails with the worker built before the change and passes after it. It also fails against a validity-only build (tokens differ) and against a build that reports unconverted offsets.
- Gated Rust suites: 28 pass, 0 fail. `bun run check` with them enabled: exit 0, 962 Bun tests pass.
- Copies of two published crates (25,075 and 102,459 lines): LF output is byte-identical before and after in the same time; the CRLF copies fail before and afterwards match their LF copies, with all 32,997 positions at the same text on disk.

Limits and follow-ups (none started)
- Not run on Windows or Linux.
- A Rust file that starts with a byte order mark still fails (`expected an item`); the compiler accepts it. Outside this task.
- Each scan reads every Rust file the engine loaded one more time. No time difference was measurable on the larger crate.
- Multi-line literals in CRLF files that scanned before (raw strings, macro arguments) now carry `\n` in their tokens, as in an LF checkout.
- Publishing 0.2.4 is a release step.
<!-- SECTION:FINAL_SUMMARY:END -->
