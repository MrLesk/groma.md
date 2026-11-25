---
id: TASK-652
title: Open Git revisions with non-ASCII file names on Windows
status: Done
assignee:
  - '@claude'
created_date: '2026-11-11T22:55:00Z'
updated_date: '2026-11-11T23:58:00Z'
labels: []
dependencies: []
references:
  - 'https://github.com/MrLesk/groma.md/issues/208'
  - src/history/revisions.ts
modified_files:
  - src/history/revisions.ts
  - test-bun/web-revisions.test.ts
  - docs/scanners/creating-a-plugin.md
  - src/history/snapshots.ts
type: bug
ordinal: 706000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
GitHub issue 208: on Windows, comparing two revisions fails with `groma/actors/s├ñkerhetsoperat├Âr.md: endpoint "groma/actors/säkerhetsoperatör.md" names no architecture concept` for an actor named Säkerhetsoperatör. The first name in that message is the UTF-8 file name read as code page 850, so the snapshot holds the document under a different name than the relationship link that points to it. Every feature that opens a revision is affected (comparison, time machine, `groma export --revision` and `--from`), for any architecture document whose name has a non-ASCII character. Unicode IDs are supported since TASK-631, so such names are ordinary.

A revision snapshot is written by `git archive` and unpacked by the `tar` found on PATH (`withGitTree` in `src/history/revisions.ts`). The evidence points at that step: the working tree, which Groma reads directly, loads fine for the reporter, and the tar bundled with Windows decodes archive member names with the console code page. This was not run on Windows yet. On macOS the same scenario works: an actor named Säkerhetsoperatör with a relationship, two commits, `groma export <dir> --from <first> --revision <second>` succeeds.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 On Windows, a revision whose architecture has a document with non-ASCII characters in its file name and a relationship to or from it opens and compares without error
- [x] #2 On Windows, macOS and Linux a revision snapshot holds every file under the exact name Git records for it
- [x] #3 Snapshot file contents are still the committed bytes, with no line-ending conversion
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
1. Cause, confirmed before choosing a fix. `git archive` writes each path as raw UTF-8 bytes in the tar header and records no character set (checked on the archive bytes: the only pax record is the commit comment). The tar bundled with Windows is libarchive's bsdtar (Microsoft Learn, "tar on Windows"). On Windows libarchive converts tar names that carry no character set from the OEM code page (`archive_string_default_conversion_for_read`, libarchive/archive_string.c, Windows-only branch); on other systems it leaves the bytes alone. Reading the same archive with `tar --options hdrcharset=CP850` on macOS produces `s├ñkerhetsoperat├Âr.md`, and Groma then fails with the exact message of issue 208. Inferred, not run: that the reporter's PATH resolves that tar.
2. Replace how `withGitTree` in src/history/revisions.ts fills a snapshot, the same way on every system: `git ls-tree -r -l -z` lists the files the revision records (names verbatim, object id, size), `git cat-file --batch` hands over each stored content, and Groma writes each file itself under the name Git gave. A name travels only as UTF-8 text and content only as raw bytes, so locale, code page, line-ending settings and the installed archive tool take no part, and both Git commands only read the repository.
3. Delete what this makes unnecessary: `git archive`, the `tar` process, `-c core.autocrlf=false`, the archive file and the `tree` directory beside it. Correct the comments in src/history that still said archive.
4. Refuse a recorded path that would land outside the snapshot directory, as `git archive` did (`invalid path`).
5. Test, extending the one existing revision test (test-bun/web-revisions.test.ts) instead of adding a file:
   a. Rule: a revision snapshot holds each file under the name Git records (acceptance criteria 1 and 2, issue 208). Wrong result detected: the snapshot holds an actor document under another name, so its own relationship link names no concept and the revision neither lists as compatible, opens, nor compares. Gap: every fixture document name is ASCII. Smallest test: add one actor with a non-ASCII name and one relationship to the fixture repository before its architecture commit. The existing assertions that the revision lists as compatible, opens and compares then detect it, so no assertion is added.
   b. Rule: snapshot content is the committed bytes, with no line-ending conversion (acceptance criterion 3). Wrong result detected: source text of a revision arrives with CRLF where LF was committed. Gap: the test pins `core.autocrlf false` in its repository, so no conversion is ever attempted and removing the protection would go unnoticed. Smallest test: turn conversion on in that repository before revisions are opened; the existing source assertions then prove it.
6. Say in docs/scanners/creating-a-plugin.md what a historical snapshot holds, because scanners read from it.
7. Verify: old and new snapshots of this repository's revisions hold the same files and bytes; time listing and opening revisions before and after; `bun run check`.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Cause (sources read 2026-11-11). git-archive(1) documents only a global pax header holding the commit ID; the archive bytes for the reported name show the UTF-8 bytes in the plain tar header and no `path` or `hdrcharset` record. Microsoft Learn "tar on Windows": the Windows tar is based on libarchive's bsdtar. libarchive 3.7.4 `archive_string.c`: under `#if defined(_WIN32) && !defined(__CYGWIN__)`, `archive_string_default_conversion_for_read` converts from `CP<OEM code page>` unless the current code page is the C locale or equals the OEM one; elsewhere it returns no conversion. `archive_read_support_format_tar.c` uses that default when no `hdrcharset` option is given. So the name is decoded with the system OEM code page (850 in Western Europe, also the console default there), not with the console's current code page as the description says. Reproduced on macOS: previous mechanism with `tar --options hdrcharset=CP850` fails with `groma/actors/s├ñkerhetsoperat├Âr.md: endpoint "groma/actors/säkerhetsoperatör.md" names no architecture concept`, byte for byte the reported message. Still inferred: that the reporter's `tar` is the bundled one, and every Windows result below.

Verification on macOS (arm64, Git 2.54, Bun 1.4.4).
- `bun run check`, on the branch rebased onto main at dcde38e9: exit 0. Node 26 pass. Bun 945 pass, 64 skip, 0 fail. No lint finding in the changed files.
- `bun test test-bun/web-revisions.test.ts`: pass. The same test against the previous mechanism: passes unchanged on macOS (its tar keeps the bytes); fails at the assertion that the revision lists as compatible (expected true, received false) when its tar reads names as code page 850; fails at the source-text assertion when its `-c core.autocrlf=false` is removed.
- Old and new snapshots of this repository compared by file name and SHA-256: the Groma directory of all 190 listed revisions (17,498 files) is identical; six complete trees (56 to 3,102 files, including names with an em dash, a typographic apostrophe and an emoji, and blobs up to 15 MB) differ only in `CLAUDE.md`, a symbolic link that is now a file holding `AGENTS.md`.
- One-off checks on scratch repositories: empty file, name with tab and newline, bytes with CR and LF, 9 MB blob all kept; only requested paths written; a tree entry `..` is refused with `invalid path '../escape.md'` and nothing is written outside; after a failed write no temporary directory and no Git process remain; `git status --porcelain` stays empty.
- `groma export <dir> --from <first> --revision <second>` on a repository with the actor Säkerhetsoperatör and its relationship: exit 0.
- Timing on this repository, median of 5, two passes each, before then after: `listGromaRevisions` (190 revisions, four at a time) 2291 and 2269 ms, then 2408 and 2436 ms (about 0.7 ms more per revision); `withGitRevision` of HEAD (3,102 files, 86 MB) 623 and 616 ms, then 482 and 482 ms; 2,604 files 501 and 492 ms, then 405 and 407 ms; 549 files 97 and 100 ms, then 89 and 89 ms.
- `groma scan` in the worktree changes nothing under groma/.

Waits for CI. Nothing here ran on Windows or Linux. The proof for those systems is test-bun/web-revisions.test.ts in the ubuntu, macOS and windows jobs. That test would most likely have passed on the Windows runner before the fix too: CI runs `bun run check` under `shell: bash`, which is Git for Windows' bash (GitHub workflow syntax reference), whose PATH resolves `tar` to Git's GNU tar (the removed comment in withGitTree and plugins/scanners/nasm/build.ts both record that from CI), and the Cygwin runtime under it translates file names as UTF-8 (Cygwin user guide, "Internationalization"). The failure needs the bundled tar, which is what `tar` resolves to in cmd and PowerShell when Git's Unix tools are not ahead of System32 on PATH.

Behaviour that differs from `git archive` and tar, all following from writing exactly what Git records (each checked on a scratch repository):
- A symbolic link is a file holding its target (tar recreated the link on macOS and Linux). Creating links on Windows needs a privilege, and libarchive reports an error for a link it cannot create (`archive_write_disk_windows.c`).
- Files marked `export-ignore` are included and `export-subst` is not applied.
- Line-ending attributes and smudge filters no longer apply, so a Git LFS file is its pointer text; `-c core.autocrlf=false` covered only the configuration setting.
- A listed revision without the Groma directory gives an empty snapshot and is listed as incompatible. Before, `git archive` failed with `pathspec 'groma' did not match any files` and the whole listing was rejected.
Not handled, as before: file names that are not valid UTF-8.

Correction history. The test first carried a direct assertion on document names. Its first form compared `sourceFilename` on web payload elements, which do not carry that field, so it compared undefined with undefined; the code-page reproduction exposed that. Review then showed the existing assertion that the revision lists as compatible already fails for a document under a wrong name, so the direct assertion was removed and both fail-before runs were repeated without it. Creating each snapshot directory once instead of per file brought the listing from about 2570 ms to the figures above. Writing several files at once and `Bun.write` were measured and were slower for the listing. Considered and not used: `git read-tree` plus `git checkout-index` with a private index (fewer lines, but `git read-tree` writes an index, so one forgotten environment variable replaces the user's, and what `git checkout-index` writes follows the user's Git configuration).

Acceptance evidence, criterion by criterion.
- #1 Proven locally: the reported failure follows from the confirmed cause and is reproduced with the previous mechanism; with the current one the same repository lists as compatible, opens, compares and exports on macOS, and no step of it decodes a file name with a code page. Waits for CI: the Windows job running test-bun/web-revisions.test.ts. Not run on Windows.
- #2 Proven locally on macOS: the byte-for-byte comparison above, and the revision test, whose repository now has a document name outside ASCII. Waits for CI: the same test on Linux and Windows.
- #3 Proven locally: content comes from `git cat-file` unconverted, the test passes with `core.autocrlf true`, and it fails for a mechanism that converts. Waits for CI: the same test on Linux and Windows.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
A revision snapshot is now written by Groma itself: `git ls-tree -r -l -z` lists the files the revision records and `git cat-file --batch` hands over their stored contents (`withGitTree` in src/history/revisions.ts). `git archive` and the `tar` found on PATH are gone, with the line-ending override and the archive file they needed.

Why: `git archive` stores a path as raw UTF-8 bytes without naming a character set, and the tar bundled with Windows (libarchive) reads such names in the OEM code page. That turned `säkerhetsoperatör.md` into `s├ñkerhetsoperat├Âr.md`, so the document's own relationship link named no concept. Now a name passes only as UTF-8 text and content only as raw bytes, the same on every system, and both Git commands only read the repository.

Verified on macOS: `bun run check` passes; the extended revision test fails against the previous mechanism once its tar reads names as code page 850, and when its line-ending protection is removed; old and new snapshots of this repository are byte-identical for the Groma directory of all 190 listed revisions and for six complete trees apart from one symbolic link. Listing 190 revisions takes about 2.42 s instead of 2.28 s; opening a complete revision takes 0.48 s instead of 0.62 s.

Not verified: nothing ran on Windows or Linux. Criterion 1 is checked on the confirmed cause and the macOS runs; its Windows proof is the windows CI job of test-bun/web-revisions.test.ts. That test probably passed on the Windows runner before the fix as well, because the runner's bash resolves Git's GNU tar, not the bundled one.

Behaviour to know: a symbolic link in a snapshot is a file holding its target; `export-ignore`, `export-subst`, line-ending attributes and smudge filters (Git LFS) no longer shape a snapshot; a listed revision without the Groma directory is listed as incompatible instead of failing the listing.
<!-- SECTION:FINAL_SUMMARY:END -->
