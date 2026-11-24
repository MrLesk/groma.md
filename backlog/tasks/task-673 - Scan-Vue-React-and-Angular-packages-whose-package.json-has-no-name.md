---
id: TASK-673
title: Scan Vue, React and Angular packages whose package.json has no name
status: Done
assignee:
  - '@claude'
created_date: '2026-11-21T00:06:00Z'
updated_date: '2026-11-24T21:01:00Z'
labels: []
dependencies: []
references:
  - >-
    https://github.com/go-gitea/gitea/tree/47f627870da5f2cb1c4ba4d1d5a6e1232c925679
  - plugins/scanners/vue/src/index.ts
  - plugins/scanners/react/src/scan.ts
  - plugins/scanners/angular/src/scan.ts
  - plugins/scanners/typescript-project.ts
  - packages/scanner/src/index.ts
modified_files:
  - packages/scanner/src/index.ts
  - plugins/scanners/typescript-project.ts
  - plugins/scanners/vue/src/project.ts
  - plugins/scanners/vue/src/index.ts
  - plugins/scanners/react/src/project.ts
  - plugins/scanners/react/src/scan.ts
  - plugins/scanners/angular/src/scan.ts
  - test-bun/scanner-roots.test.ts
  - test-bun/vue-scanner.test.ts
  - test-bun/react-scanner.test.ts
  - test-bun/angular-scanner.test.ts
  - docs/scanners/creating-a-plugin.md
  - docs/scanners/vue/index.md
  - docs/scanners/react/index.md
  - docs/scanners/angular/index.md
  - plugins/scanners/vue/package.json
  - plugins/scanners/react/package.json
  - plugins/scanners/angular/package.json
  - packages/scanner/package.json
  - bun.lock
type: bug
ordinal: 711000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
On 2026-11-21 Alex had ten well-known open source projects scanned with the development version and said: "if scanning a repo makes groma crash, delegate to an agent to fix asap". Scanning Gitea crashes the whole scan.

Reproduction on `main` (3950bc78): clone `https://github.com/go-gitea/gitea` at commit `47f627870da5f2cb1c4ba4d1d5a6e1232c925679`, run `groma init "Gitea" --directory groma`, add the recommended scanners go, python, typescript and vue (from a development checkout by path, `groma plugin add <checkout>/plugins/scanners/<id>`, after building the vue, go and python scanners), then `groma scan`. It prints only `undefined is not an object (evaluating 'name.toLowerCase')`. The initial system record is written, no file gets an owner. Without the vue scanner the scan works.

Cause: Gitea's root `package.json` is an application manifest without a `name`, which npm requires only for publishing. The Vue scanner passes `manifest.name` on as the name of its source root, so the root has none. The scanner contract requires a name of every root, but only the JSON reader of `@groma/scanner` checks it; `createScanObservation`, which in-process scanners use, accepts the root. The reconciler then crashes in `kebabCase` while looking for a system or container with the root's name. The React and Angular scanners take `manifest.name` the same way: probing each with a nameless `package.json` returns a root without `name`.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Scanning Gitea at commit 47f627870da5f2cb1c4ba4d1d5a6e1232c925679 with the go, python, typescript and vue scanners completes, and its Vue files get owners.
- [x] #2 A Vue, React or Angular package whose package.json has no name is scanned, and its source root takes the name of its directory.
- [x] #3 A scanner that reports a source root without a name fails with a message that names the scanner and the root, and the scan still reconciles the other scanners.
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
1. Contract (`packages/scanner/src/index.ts`): `createScanObservation` refuses a root without a name, as `parseScanObservation` already does for JSON. The error names the root by id and declaring file. The registry already turns a throwing scanner into a failure named by scanner id while the other scanners reconcile, so core needs no change. The architecture names this component as the owner: "Scanner contract ... Checks these data at the plugin boundary."
2. Shared project code (`plugins/scanners/typescript-project.ts`): `packageRootName(manifest, directory)` gives the manifest's `name`, else the name of the package's directory, the way the Python, Java, Ruby, Rust, R and Elixir scanners name a project that declares no name.
3. The Vue, React and Angular scanners name their package root with it and type the parsed manifest as `Record<string, unknown>`, so the compiler rejects `manifest.name` as a root name.
4. Docs: the root name rule in `docs/scanners/creating-a-plugin.md`, and one sentence on each of the three scanner pages.
5. Verify: scan Gitea with go, python, typescript and vue; see the refusal end to end by scanning Gitea with the Vue naming still unfixed; `bun run check`.

Tests (existing coverage inspected first):
- Rule: every root has a name. Authority: `docs/scanners/creating-a-plugin.md` ("Each has an observation-local `id`, `kind`, and `name`") and `ScanRoot.name`. Wrong result detected: `createScanObservation` accepts a nameless root, which crashes the reconciler. Gap: `root hierarchy rejects invalid parentage and duplicate identities` in `test-bun/scanner-roots.test.ts` covered parents and duplicate ids only. Smallest test: one more case in that test.
- Rule: a package whose package.json has no name is scanned under its directory's name. Authority: the reproduced Gitea failure for Vue; the same nameless root reproduced for React and Angular by probing each scanner. Wrong result detected: the scanner reports a root without a name, so its files get no owners. Gap: no Vue or React test scans a manifest without a name, and the Angular cases that do never read the root's name. Smallest test: one case in each scanner's test file on its existing fixture and setup, with a manifest that has no name.
- No new registry test: `healthy scanners update overlapping evidence while failed scanners retain saved Code and relationships` in `test-bun/scanner-composition.test.ts` already proves that a throwing scanner is reported by id while the others reconcile.

6. Package versions: `@groma/scanner` 0.2.4, Vue scanner 0.2.8, React scanner 0.2.6, Angular scanner 0.2.7, with their `bun.lock` entries, so the next release publishes the changed packages. The release script skips a version that is already published.

7. Refresh the Angular, React and Vue package versions against current main. Use Angular 0.2.8, React 0.2.7 and Vue 0.2.9. Repeat the Gitea scan and the repository check before merging.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Reproduced on `main` 3950bc78 with Gitea 47f627870da5f2cb1c4ba4d1d5a6e1232c925679 and the go, python, typescript and vue scanners: the scan printed only `undefined is not an object (evaluating 'name.toLowerCase')`. Gitea's root `package.json` has no `name`; the Vue observation carried the root `vue-project` without a name, the Go observation had none.

With the contract check alone and the Vue naming still unfixed, the same scan completed: `created 2280` and the report line `vue: root has no name: vue-project (package.json) (saved scanner data kept)`. That is the refusal of criterion 3, seen end to end: the scanner and the root are named, the other scanners are reconciled.

With the whole fix the scan gave `created 2398, refreshed 0, matched 0, findings 626`. All 26 tracked `.vue` files have exactly one owner. Code references per scanner: go 2095, typescript 181, vue 299.

Probing the React and Angular scanners with a package.json that holds only a dependency returned a root without `name` before the fix and a root named after the directory after it.

The four new or extended test cases fail on the source before the fix (name `undefined` for Vue, React and Angular; `createScanObservation` did not throw) and pass after it.

Scanning this repository with its own CLI changed no file under `groma/`: the fix adds no source file.

Correction: `packageRootName` first took `(manifest, repositoryRoot, directory)`. It now takes one absolute directory, so two path arguments cannot be swapped; the Angular scanner resolves its repository-relative directory before the call.

Not part of this task: version bumps of the Vue, React and Angular scanner packages and of `@groma/scanner`, which release tasks carry. A published scanner bundles its own copy of the contract, so installed scanners get the fix with their next release. Core still does not check an observation that a plugin built without `createScanObservation` or `parseScanObservation`.

Final state: `bun run check` passed (Biome and TypeScript clean for the changed files; Node suite 26 of 26; Bun suite 961 passed, 67 toolchain-gated skipped, none failed). The Go-gated `test-bun/go-scanner.test.ts` passed its 14 tests with `GROMA_TEST_GO` set. The Gitea scan was repeated with the Vue scanner rebuilt from the final source: `created 2398`, all 26 tracked `.vue` files owned, and a second scan ran clean.

Correction after the automated review of pull request 233 (one finding, P1): the first commit left the package versions alone, on the reading that release tasks bump them, as TASK-660 changed the Rust scanner without a bump. That reading was wrong. `CLAUDE.md` says scanner packages need their own version bump when their contents change, and `publishPackage` in `scripts/scanner-release.ts` skips an exact version that is already published, so the next release would have kept the old Vue, React and Angular scanners. Bumped the three scanners and `@groma/scanner` by a patch version each and refreshed `bun.lock` (four version lines), following TASK-629 and TASK-548. The other scanners bundle the contract too but behave as before, so they keep their versions, as in TASK-548.

After the version bumps `bun run check` passed again: Node suite 26 of 26; Bun suite 961 passed, 67 toolchain-gated skipped, none failed. `bun install --frozen-lockfile` accepts the refreshed lockfile.

2026-11-24. Gitea at 47f627870 still fails on main ecc1f7e0 with the original name.toLowerCase error. With Go, Python, TypeScript and the built Vue 0.2.9 package, the scan created 2,398 records and all 26 tracked Vue files had exactly one owner. A separate CLI check reported an unnamed root by scanner and root ID while JavaScript still assigned an owner to app.js. Current main already used the prior proposed version numbers, so the built packages now use Angular 0.2.8, React 0.2.7 and Vue 0.2.9 with matching lockfile entries.

The repository check passed on Bun 1.4.4 and Node 26.12.1, including the three unnamed-package regression tests. The Bun suite reported 956 passes, 67 skips for optional tooling, and zero failures.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
The Vue, React and Angular scanners now name a package whose package.json has no `name` after its directory, through one shared `packageRootName`. `createScanObservation` refuses a root without a name, as the JSON reader already did, so a scanner that reports one fails by name while the other scanners are reconciled. `@groma/scanner` and the three scanners carry a patch version bump, so the next release publishes them.

Verified on Gitea 47f627870da5f2cb1c4ba4d1d5a6e1232c925679 with the go, python, typescript and vue scanners (2398 records, all 26 Vue files owned) and by four test cases that fail on the source before the fix.

Not started, for Alex to decide: whether core should check an observation again when it receives it from a plugin that did not build it with the contract. Installed scanners carry their own copy of the contract and get the fix with the next release.
<!-- SECTION:FINAL_SUMMARY:END -->
