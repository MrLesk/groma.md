---
id: TASK-653
title: Keep the live map running when a change arrives through a symlinked path
status: Done
assignee:
  - '@claude'
created_date: '2026-11-11T22:55:00Z'
updated_date: '2026-11-11T23:28:00Z'
labels: []
dependencies: []
references:
  - 'https://github.com/MrLesk/groma.md/issues/201'
  - src/scanner/source-watch.ts
modified_files:
  - src/scanner/source-watch.ts
  - test-bun/scanner-source-watch.test.ts
  - docs/scanners/index.md
type: bug
ordinal: 706000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
GitHub issue 201: `groma web` exits with `RangeError: path should be a path.relative()d string, but got "../../../../../Projects/my-repo/CLAUDE.md"` as soon as a file is saved through a symlinked spelling of the repository path. The reporter has a root-level symlink from `/etc/synthetic.conf` (`/Projects` to `/System/Volumes/Data/Projects`) and an editor that opens the repository through `/Projects`, so the live map stops on the first save.

The watcher resolves the repository root once, then relates every event path to it (`subscribeSources` in `src/scanner/source-watch.ts`). macOS can report an event under a different spelling of the same directory, which yields a relative path that starts with `../`. The `ignore` package throws on such a path, inside the watcher callback, and the process exits. Shown on macOS with the watcher alone: subscribed on `/System/Volumes/Data/private/tmp/<repo>`, an edit is reported under `/private/tmp/<repo>` and relates to `../../…/src/core/other.ts`; `ignore().ignores("../x")` throws the same RangeError. The `synthetic.conf` setup itself was not recreated (it needs a system setting and a restart).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A change to a repository file that the watcher reports under another spelling of the repository path is scanned as that repository file, the same as a change reported under the resolved path
- [x] #2 A change reported for a path outside the repository starts no scan and leaves the watcher and groma web running
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
1. src/scanner/source-watch.ts gains repositoryFile(root, eventPath): the one place that turns an absolute watcher event path into a repository file (relative to the root, with / separators), or undefined when the path is not a file inside the repository.
   - A path under the root as given is related as today: one path.relative, no file system access.
   - Any other path is searched upward for the nearest directory that is the root under another spelling, such as a symlink to it. Two paths spell one directory when the file system gives them the same device and inode numbers, so the rule does not depend on how any one system resolves paths. The file is related to that directory. Only directories are looked up, never the file, so a removed file is still named.
   - No such directory, or the root directory itself: undefined.
2. subscribeSources reports only repository files. The @parcel/watcher branch maps each event through repositoryFile and drops undefined. The Windows fs.watch branch keeps receiving names relative to the root and drops an empty name itself. The scan-queue listener loses its empty-name guard, so the registry rules, the callers' watchesFile and the queue receive nothing but repository files.
3. Test, added to test-bun/scanner-source-watch.test.ts (one test of repositoryFile with a temporary repository and an ordinary symlink to it):
   - Rule and authority: acceptance criteria 1 and 2 of this task (GitHub issue 201). An event path under another spelling of the repository root names the same repository file, also when the file's folder was removed; a path outside the repository names no file.
   - Wrong result it detects: the previous relation returns ../link/src/changed.ts and ../outside.ts, the paths the ignore package rejects with the RangeError that stops groma web. It also fails a fix that looks up the changed file or its folder on disk, which would lose removed files.
   - Coverage gap: the existing watcher test only receives real events under the resolved root, and a real watcher cannot be made to report another spelling on every CI platform. The test is skipped on Windows, where the watcher branch receives relative names and never calls repositoryFile, and where creating symlinks may be unavailable.
4. docs/scanners/index.md, Source watching: one sentence stating that a change reported through another path to the repository counts as the same file and a change outside the repository triggers nothing.
5. Verification: the new test fails against the previous relation and passes with the rule; the real watcher's differently spelled paths on macOS go through the rule; one real groma web run in a scratch repository (save and remove a source file, the map updates and the server keeps running); bun run check.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Cause, confirmed: the path that stopped groma web reaches the registry's discovery watch patterns (compileWatchPatterns in src/scanner/watch-patterns.ts), which pass it to the ignore package. `compileWatchPatterns(['**/*.md'])('../../../../../Projects/my-repo/CLAUDE.md')` throws the reported RangeError.

Correction history: the first version of the rule compared resolved paths (the directory's realpath equal to the resolved root). It was replaced by comparing device and inode numbers. Reasons: it needs no assumption that the root was resolved or that two resolve functions agree; it also unifies the one mismatch this Mac can produce (see below), which resolving cannot when the root is given in that spelling; and it is about four times cheaper per event (5,000 events four folders deep under another spelling: 64 ms, against 274 ms).

Verification so far (macOS 27.2, Bun 1.4.4):
- `bun test --timeout 20000 test-bun/scanner-source-watch.test.ts` with repositoryFile holding the previous relation: the new test fails, received "../../../../../../../../var/folders/…/link/src/changed.ts" where "src/changed.ts" is expected. With the rule: 2 pass, 0 fail.
- Real watcher, rule under real mismatched paths: @parcel/watcher subscribed on /System/Volumes/Data/private/tmp/<dir> reports changes under /private/tmp/<dir>. For a created file and for files removed with their folder, the previous relation made the watch patterns throw the RangeError; repositoryFile returned src/changed.ts each time.
- Paths under the resolved root are named exactly as before (nine shapes compared, including ..notes.ts and the root itself) and cost the same: 5,000 events take 2.2 ms before and after, with no file system access.
- Real flow: `bun src/cli.ts web --port <free port>` from this worktree inside a scratch Git repository with the TypeScript scanner. Saving src/tax.ts published a new world that owns the file; removing it published a world without it; GET /world.json answered 200 afterwards; SIGINT ended the process with exit code 0 and no error line. Same result when the save and the removal went through a symlink to the repository. On this Mac both spellings are reported under the resolved path, so this run shows the ordinary flow still works; it does not exercise the other-spelling branch.
- Not reproduced: the reporter's /etc/synthetic.conf setup (system setting plus restart). Criterion 1 rests on the rule test and the real-watcher run above for that environment.

Verification through watchObservations itself, in scratch harnesses outside the repository, each run against the previous source-watch.ts (HEAD) and against the rule:
- Criterion 1, real watcher under a genuine mismatch: the root was kept as /System/Volumes/Data/private/tmp/<dir> (resolution switched off in the harness, because on this Mac the resolved path is the reported one) and a file was saved. macOS reported it under /private/tmp/<dir>. HEAD: the RangeError of the issue, thrown from the watcher callback through the real watch patterns. Rule: one scan started with ["src/changed.ts"].
- Criterion 2, event source replaced to report <parent>/elsewhere/outside.ts: HEAD throws the RangeError. Rule: no scan starts, nothing is thrown, and a later change inside the repository starts a scan with ["src/inside.ts"].

What is proven and what is not:
- Proven here: the rule (repository test), the whole watcher path under a real spelling mismatch produced by macOS, the outside path, and the ordinary groma web flow.
- Rests on the reporter's environment: groma web under the /etc/synthetic.conf symlink. There the resolved root is /System/Volumes/Data/Projects/my-repo and events arrive under /Projects/my-repo; /Projects/my-repo reaches the same directory through the symlink, which is the case the repository test builds with an ordinary symlink.

Checks: `bun run check` exit 0. Biome reports the same 2 warnings and 2 infos as before, all in files this task does not touch; typecheck clean; Node suite 26 pass; Bun suite 945 pass, 64 skip, 0 fail. `bun src/cli.ts scan` in this worktree leaves groma/ unchanged, so the commit has no architecture files.

Observed, not changed (outside the acceptance criteria): under another spelling macOS still withholds the contents of the skipped top-level folders (.git, groma, .groma, node_modules), because the watcher also hands them to the system as exclusion paths. Only an event for such a folder itself (creating or removing node_modules, for example) gets past the watcher's own prefix check, and it now names the folder, which no scanner selection reads. Seen with the watcher alone under the data-volume spelling; not seen on the reporter's setup.

Cost of the other-spelling branch: about 13 microseconds per event four folders deep (64 ms per 5,000 events), paid only by events that are not under the resolved root.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
groma web and every other live watch now keep running when the operating system reports a change under another spelling of the repository path, and the change is scanned as the same repository file.

What changed: src/scanner/source-watch.ts has one function, repositoryFile, that turns a watcher's absolute event path into a repository file or into nothing. A path under the resolved root is related as before, without touching the disk. Any other path is searched upward for the directory that is the root under another spelling (same device and inode), and the file is named relative to it; removed files are still named because only directories are looked up. A path with no such directory names no file, so the registry rules, the callers' watchesFile and the scan queue only ever receive files inside the repository. The Windows branch still receives names relative to the root. docs/scanners/index.md states the rule in one sentence.

Why: the watcher related every event to the resolved root. A path under another spelling became ../../…, and the ignore package behind the discovery watch patterns throws on such a path, inside the watcher callback.

Verification: the new repository test fails against the previous relation and passes; through watchObservations, a save that macOS reports under another spelling than the root's starts one scan with src/changed.ts where HEAD throws the reported RangeError, and a path outside the repository starts no scan; a real groma web run in a scratch repository reacted to a save and a removal and stopped cleanly; bun run check passes.

Not verified: the reporter's /etc/synthetic.conf setup itself. Their case is a symlink above the repository, which the repository test builds with an ordinary symlink.

Follow-up for a decision, not done: events for a skipped top-level folder itself (.git, groma, .groma, node_modules) are dropped by the watcher only under the root's own spelling; their contents stay excluded either way.
<!-- SECTION:FINAL_SUMMARY:END -->
