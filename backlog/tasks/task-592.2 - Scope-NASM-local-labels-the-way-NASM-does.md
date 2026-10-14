---
id: TASK-592.2
title: Scope NASM local labels the way NASM does
status: Done
assignee:
  - '@claude'
created_date: '2026-10-11 16:51'
updated_date: '2026-10-13 19:13'
labels: []
dependencies: []
references:
  - plugins/scanners/nasm/src/evidence.ts
documentation:
  - docs/scanners/nasm/index.md
modified_files:
  - plugins/scanners/nasm/src/reserved-words.ts
  - test-bun/nasm-scanner.test.ts
  - plugins/scanners/nasm/src/evidence.ts
  - plugins/scanners/nasm/build.ts
  - docs/scanners/nasm/index.md
  - plugins/scanners/nasm/THIRD-PARTY-NOTICES.txt
  - groma/systems/groma-md/containers/cli/components/nasm-src-index.md
parent_task_id: TASK-592
type: bug
ordinal: 659000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The NASM scanner fails with "nasm: duplicate code label first.loop" on sources that NASM 3.02 assembles. A local label (leading dot) belongs to the most recent non-local label. The scanner tracks that scope only from labels written with a colon inside a `.text` section (`labelPattern` and the section check in `evidence.ts`), so its scope diverges from NASM in two reproduced cases. Case 1, a non-local label without a colon (alone on its line, or followed by an instruction as in `second  dec ecx`), then a reused local label: `first:` / `.loop:` / `ret` / `second` / `.loop:` / `ret`. Case 2, a non-local label in another section between two uses of one local name: `section .text` / `first:` / `.again: ret` / `section .data` / `counters:` / `section .text` / `.again: ret`. Colon-less labels are usual in older assembly style.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Both reproduced sources scan, and each local label is reported under the non-local label NASM attaches it to.
- [x] #2 A label that NASM itself rejects as a redefinition still fails the scan with the duplicate label message.
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
Finding: NASM decides label or instruction in its parser (asm/parser.c parse_line): the first word of a line is a label when a colon follows it or when its scanner does not find the word in its keyword table (asm/tokhash.c, 3093 entries, 2640 instructions). The scanner only runs 'nasm -E', which stops before the parser, and the preprocessor has no test for instruction words, so the existing invocation cannot say which words are labels. NASM moves the local-label scope in one place (asm/labels.c define_label): on every label that does not start with a dot and is not defined by EQU, in any section. Verified on the bundled binary by assembling probes and reading their symbol tables.

1. plugins/scanners/nasm/src/reserved-words.ts (new, data only): the 3049 words NASM 3.02 reserves outside braces, taken from the pinned source's asm/tokhash.c. No existing file owns NASM's vocabulary.
2. plugins/scanners/nasm/src/evidence.ts: splitLabel() owns label recognition (colon optional; a reserved word without a colon is an instruction). defineLabel() is the only writer of the scope and is fed by every label line in every section; an EQU constant neither moves the scope nor becomes a code label. Only labels in .text stay routine candidates and stay in the duplicate check, so the duplicate message is unchanged. readCall() keeps the call reading that readCode() held.
3. plugins/scanners/nasm/build.ts: checkReservedWords() fails the build when the pinned NASM source reserves other words than the list, so a NASM upgrade cannot leave a stale list.
4. docs/scanners/nasm/index.md: state the label and scope rule and name the new file. plugins/scanners/nasm/THIRD-PARTY-NOTICES.txt: name the word list as taken from NASM.
5. Verify: audit probes na1 to na8, NASM's own test sources compared with the symbol tables NASM writes for them, test-bun/nasm-scanner.test.ts, biome lint, typecheck.

Test decisions (test-bun/nasm-scanner.test.ts, both on evidence() with inline preprocessed text, as the existing location test does):
A. Rule: a local label belongs to the latest label that is not local, with or without a colon and in any section; an EQU constant is not such a label. Authority: the two reproduced failures in this task and acceptance criterion 1. Wrong result caught: 'duplicate code label first.step', or a called local label reported and resolved under the wrong label. Gap: the fixture only has colon labels inside .text. Smallest test: one unit with a colon-less label followed by an instruction, a data label between two uses of one local name, an EQU constant inside a routine, and calls to the local label; assert the routine names and which routine each call reaches.
B. Rule: a code label defined twice fails the scan (acceptance criterion 2). Wrong result caught: the redefinition scans and one definition silently wins, which is what removing the check to make case A pass would do. Gap: no test reaches the duplicate check. Smallest test: one expectation that evidence() throws and names the label.
No fixture change: the rule lives in evidence(), and the fixture test already covers the real NASM run and, through buildPackage, the word list check.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented as planned; no corrections to the approach after the plan was written.

Why a word list: 'nasm -E' never runs NASM's parser, and nothing in the preprocessor (asm/preproc.c, asm/pptok.dat) tests whether a word is an instruction, so the existing invocation cannot classify 'second' in 'second dec ecx'. Alternatives measured and not built: (1) a second run of the bundled NASM over the candidate words, reading its label-orphan warnings (works on the bundled binary, about 5 ms, but is a new worker invocation and parses diagnostic text); (2) patching the bundled NASM so -E marks labels (needs all five host binaries rebuilt and released).

Evidence that the rule matches NASM: for the 229 sources in NASM 3.02's own test directory that assemble as ELF64, the labels named by the changed evidence.ts (all sections) equal the symbol table NASM writes, 185911 labels, except three sources whose difference is not about labels (weak extern declarations, an lprefix pragma that renames object symbols, and an object with 131072 sections that nm cannot read). The same comparison on the committed code differs in 17 sources. Scratch scripts: scratchpad/fixes/nasm/corpus/compare.ts and compare-head.ts.

Test evidence: test A failed before the change with 'nasm: duplicate code label first.step'. Mutations of a scratch copy of evidence.ts each fail a test: colon required (A, duplicate first.step), scope only from code sections (A, duplicate second.step), EQU moves the scope (A, routine names differ), duplicate check removed (B, did not throw). The build check was seen rejecting a list with one word removed and one invented word added.

Verification: bun test --timeout 20000 test-bun/nasm-scanner.test.ts: 4 pass, 0 fail. bunx biome lint on the four changed TypeScript files: clean. bun run typecheck: clean. Audit probes: na2, na4, na6 scan; na1, na3, na8 give the same operations and calls as before; na7 still fails with 'nasm: duplicate code label helper'.

Limits: the list is the vocabulary of the bundled NASM 3.02. TASM mode (@@ local labels) is not read. A label that NASM accepts twice at one address still fails as a duplicate, as before. Not re-measured: the Cityssembly counts in the guide, no checkout is available here. The local dist binary did not need a rebuild: the NASM build itself is unchanged.

Cold review: no blocking findings. The reviewer fed all 3093 words of NASM's table to the bundled binary (none of the 3049 listed words is read as a label, every identifier-shaped word outside the list is), compared five sources of its own against nm (0 differ) and reproduced the corpus result. Accepted clarifications applied, no behavior change:
1. Letter case is held by test A: its source writes 'LIMIT EQU 4' and ' CALL .step' in upper case. Matching reserved words case-sensitively, or 'equ' in lower case only, each fails test A (seen on a scratch copy of evidence.ts); the four earlier mutations still fail.
2. reserved-words.ts says in plain words why brace-only words ({z}, {1to8}) are left out and why directives (section, global, extern, bits, align) are not listed and are still never labels: 'nasm -E' prints them in brackets, and align as [sectalign 16] and a times line (checked on the bundled binary).
3. The guide states the consequence next to 'does not validate all assembly instructions': a first word the bundled NASM does not know is read as a label, so such a source can fail with a duplicate label or move a local label's owner. Checked on the bundled binary: NASM rejects 'newinsn eax, 1' and a lone unknown word on two lines, and accepts a lone unknown word on one line as a label with a warning.
4. evidence.ts: isLocal() is named hasLeadingDot(), with a comment that NASM's '..@' names also start with a dot and are handled as local labels here.
5. reserved-words.ts and the guide's implementation paragraph say 'the bundled NASM' in place of the version number; the pinned version stays in build.ts, index.ts and the guide's introduction.

Verification after these changes: bun test --timeout 20000 test-bun/nasm-scanner.test.ts: 4 pass, 0 fail. bunx biome lint on evidence.ts, reserved-words.ts, build.ts and the test file: clean. bun run typecheck: exit 0. Probes na1 to na8: output identical to the run before the review (na2, na4, na6 scan; na7 fails with the duplicate label message; na5 is an empty directory). Corpus comparison: 229 sources, 185911 labels, the same three unrelated differences.

OPEN ITEM for the owner: the guide's Cityssembly sentence (59 source files, 924 routine operations, 4,392 calls) was measured with the previous label recognition and has not been re-measured. There is no local checkout and nothing was downloaded. The numbers were left unchanged. Re-measure these three counts at the pinned revision b5ff5470bedd24ad6bd55e71fa47d3ffcc7ed4b0 before the next NASM scanner release and correct the guide if they differ.

Verified on the combined working tree with every TASK-592 change and TASK-580 present: `bun run check` exits 0 (Node 16 pass; Bun 785 pass, 53 skip, 0 fail), no file under `groma/` changed, no changed source or test file exceeds 500 lines.

Architecture: a scan made `reserved-words.ts` a stand-alone component; it was combined into `nasm-src-index`, the component that owns the NASM scanner source.

Review on pull request 139 (automated code review, one finding, accepted): on a source line that holds a label and a call, the call was reported at the position of the label, because the call took the position of its line. The evidence contract (`docs/scanners/evidence.md`) gives an invocation the offset of the call itself. This held for colon labels before this task; the task made it reachable for labels written without a colon, as in `second call .step`. `afterLabel` in `evidence.ts` now moves the position past a label that the source line starts with; a label that a macro expansion wrote is not on the source line, so the position of the line stands, as before. Test decision: rule and authority, the documented invocation position; wrong result caught, a call reported at the offset of its label; gap, no test had a label and a call on one line. The assertion was added to the existing scope test and was seen failing with the old call (expected the offset of `call`, received the offset of `second`). Verified: `bun test --timeout 20000 test-bun/nasm-scanner.test.ts` 4 pass, Biome lint and typecheck clean, audit probes na1 to na8 unchanged.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
A NASM local label belongs to the latest non-local label, with or without a colon, in any section. `splitLabel` in `evidence.ts` recognises a colon-less first word as a label when the bundled NASM does not reserve it (`reserved-words.ts`, 3049 words taken from the pinned NASM source and checked against it by `build.ts`), and `defineLabel` is the only writer of the scope; an `EQU` constant neither moves the scope nor becomes a code label, as in NASM. Both reproduced sources scan and a label NASM itself rejects still fails as a duplicate. Verified by two tests with six mutations, by label names equal to NASM symbol tables on the 229 sources of NASM own test directory that assemble as ELF64 (the previous code differed in 17), and by a cold review that fed every table word to the bundled binary. Open item for the owner: the guide counts for Cityssembly (59 files, 924 routine operations, 4,392 calls) were measured with the old recognition and must be re-measured at the pinned revision before the next NASM scanner release. `reserved-words.ts` is a new source file to fold into its component at commit time.
<!-- SECTION:FINAL_SUMMARY:END -->
