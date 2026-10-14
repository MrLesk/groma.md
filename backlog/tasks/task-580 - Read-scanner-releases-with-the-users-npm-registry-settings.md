---
id: TASK-580
title: Read scanner releases with the user's npm registry settings
status: Done
assignee:
  - '@claude'
created_date: '2026-10-11 15:46'
updated_date: '2026-10-11 20:43'
labels: []
dependencies: []
references:
  - 'https://github.com/MrLesk/groma.md/issues/125'
  - src/scanner/modules/published.ts
  - src/scanner/modules/package.ts
  - src/scanner/modules/inventory.ts
  - src/scanner/modules/settings.ts
  - scripts/scanner-release.ts
  - scanner-package-registry
documentation:
  - docs/scanners/setup.md
modified_files:
  - src/scanner/modules/package-manager.ts
  - src/scanner/modules/package.ts
  - src/scanner/modules/published.ts
  - src/scanner/modules/settings.ts
  - scripts/scanner-release.ts
  - src/scanner/modules/inventory.ts
  - test-bun/scanner-recommendations.test.ts
  - test-bun/scanner-update.test.ts
  - test-bun/scanner-upgrades.test.ts
  - test-bun/scanner-installation.test.ts
  - docs/scanners/setup.md
  - groma/systems/groma-md/containers/cli/components/package.md
type: bug
ordinal: 656000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
GitHub issue 125: on a machine whose `~/.npmrc` points npm at an internal registry with a token, `groma scanner setup`, the web setup screen and `groma scanner add <name>` fail with "package registry returned HTTP 407", while `npm install -g` of the same packages works.

Installing a scanner by bare package name has two steps with two different owners of "how to reach the registry". The release lookup (`readPublishedScanners` in `src/scanner/modules/published.ts`) is a raw `fetch` to `npm_config_registry` or registry.npmjs.org, so it ignores `.npmrc` registries, scoped registries and tokens. The download (`installDependencies` in `src/scanner/modules/package.ts`) runs Bun's package manager, which honors them. The settings upgrade check and the release script use the same raw lookup.

Measured with Bun 1.4.3 against a local fake registry and proxy: `bun pm view <name> --json` reads the default and scoped registry and `_authToken` from the project and the user `.npmrc`, needs a package.json in its directory or an ancestor (without one it exits 1 with "No package.json was found"), works through `BUN_BE_BUN=1`, accepts `--registry`, and returns one release manifest plus the list of all version numbers (a range returns only its highest match). Bun honors the `HTTP_PROXY` / `HTTPS_PROXY` environment variables, including credentials in the proxy URL, and does not read the `proxy` / `https-proxy` keys of `.npmrc`.

The scanned repository's own `.npmrc` is not read by the download today, and that stays out of scope: the lookup must match the download, not exceed it.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 With a `.npmrc` that points the default registry or the package scope at a registry that requires its `_authToken`, adding a scanner by bare name, updating one, installing recommendations and the settings upgrade check read release metadata from that registry with that token, as the download does.
- [x] #2 Release selection keeps its result: the newest stable release that supports this computer and this Groma version, and a distinct message for no stable release, no release for this platform, and Groma too old.
- [x] #3 A failed lookup names the package and the next step and includes the registry or proxy error text.
- [x] #4 One owner reaches the registry for scanner packages: lookup, download, upgrade check and the release script go through the package manager, and no raw registry fetch remains.
- [x] #5 `docs/scanners/setup.md` states which registry, token and proxy settings scanner installation honors, and that the `.npmrc` proxy keys are not read.
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
Measured first (Bun 1.4.3, local fake registry, probes in the session scratch directory):
- `bun pm view <name> --json` refuses to run without a package.json in its directory or an ancestor ("No package.json was found", exit 1). It works with an empty `{}` package.json, also from a compiled executable started with `BUN_BE_BUN=1`.
- `bun pm view` and `bun install` read `.npmrc` from the same two places: the directory of the nearest package.json and the user's home (`~/.npmrc`, also `$XDG_CONFIG_HOME/.npmrc`). Neither reads a parent directory's `.npmrc`. Both honor `npm_config_registry` and `NPM_CONFIG_TOKEN`.
- `--registry` replaces only the default registry. A scope's registry in the user's `.npmrc` still wins for packages of that scope.
- Failures: unknown package, non-2xx status and unreachable registry exit 1 with text on stderr ("404 Not Found: <url>", "503 Service Unavailable: <url>", "407 Proxy Authentication Required: <url>", "ConnectionRefused: view request failed to send"). A version the registry does not list, or a package without versions, exits 1 with JSON on stdout: `{ "error": "No matching version found" }`.
- The request is the full packument (`Accept: application/json`), so the printed manifest keeps `groma`, `os` and `cpu`. The manifest is printed as the registry sent it.

Approach:
1. New `src/scanner/modules/package-manager.ts`, the one place in `src/` that reads scanner releases from a registry or downloads them. It holds the single spawn of Bun's package manager (`process.execPath`, `BUN_BE_BUN=1`, optional `--registry`) and the two things Groma asks of a registry: `readPublishedRelease(name, { version, registry })` (`bun pm view --json`) and `installDependencies(directory, source, registry?)` (`bun install --ignore-scripts`, moved from package.ts). The lookup runs in a fresh temporary project that holds only an empty package.json, because Bun needs a project and such a project adds no `.npmrc` of its own; the download's cache directory is the same kind of directory, so both see exactly the user's configuration and environment. The reader throws for an unknown package and for registry and network errors, returns undefined for an unlisted version, and returns the manifest unvalidated.
2. `published.ts`: delete `readPublishedScanners` (the raw fetch). `selectPublishedScanner(name, registry?, host?)` becomes a walk: one read returns the registry's latest release plus all version numbers; keep stable versions, newest first, read a further release only when the walk reaches it, stop at the first release for this computer and this Groma. Two explicit flags record "a scanner release exists" and "a release supports this computer", so the three outcomes and their messages stay. `publishedScannerSource` keeps its signature, so inventory.ts call sites do not change.
3. `settings.ts` (`withScannerUpgrades`) and `scripts/scanner-release.ts` (`waitForPublishedScanner`) use the same reads. The release script asks for the exact uploaded version and keeps waiting while the registry does not list it.
4. `inventory.ts`: one doc comment on the `registry` option (it replaces only the default registry and does not isolate a run from the user's npm settings; only tests pass it). No CLI or web option is added.
5. `docs/scanners/setup.md`: which registry, token and proxy settings are honored, and that the `.npmrc` proxy keys and the project's own `.npmrc` are not read.
6. `bun run check`, then an end-to-end proof in the scratch directory (old code in a detached worktree against new code).

Test decisions:
- New, in test-bun/scanner-installation.test.ts. Rule and authority: acceptance criterion 1 and GitHub issue 125, the release lookup uses the registry and token of the user's `.npmrc`, as the download does. Wrong result caught: `groma scanner add <bare name>` fails, or asks another registry, or asks without the token, when the registry is named only in `~/.npmrc` and rejects requests without its token. Gap: every existing installation test passes `registry` explicitly to a fake registry that accepts anonymous requests, so none notices a lookup that ignores `.npmrc`. Smallest test: one run of the real CLI in the existing fixture with a temporary home directory (child process environment only, as scanner-fresh-checkout.test.ts already does), no `process.env` or real home mutation.
- Changed, test-bun/scanner-recommendations.test.ts (selection). Rule and authority: acceptance criterion 2, selection keeps its result and its three distinct messages. Wrong result caught: the walk picks a prerelease, a release for another platform or one that needs a newer Groma, or reports the wrong reason. Gap: the existing test hands every manifest to the function in memory, an input the code no longer has; the same cases are now served by a fake registry so the walk that reads one release at a time is what runs.
- Changed assertions only: scanner-update.test.ts and scanner-upgrades.test.ts anchor the lookup failure on the registry's own status text ("503") instead of the deleted "HTTP 503" wording (acceptance criterion 3). scanner-upgrades.test.ts expects two registry reads instead of one: its newest release needs a newer Groma, so the walk reads exactly one more, which still proves that local, Git and missing entries read nothing and that releases are not read eagerly (three exist).
- test-bun/scanner-release.test.ts is unchanged: its two wait tests run against the new reader as they are.
- No other new tests: the installation, update, upgrade and release tests already run lookup and download against a fake registry through the `registry` option and fail if either step breaks.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented (uncommitted in the shared tree, task left In Progress):
- `src/scanner/modules/package-manager.ts` (new) is the one place in `src/` that reads scanner releases from a registry or downloads them: `runPackageManager` is the only spawn of Bun's package manager (`process.execPath`, `BUN_BE_BUN=1`, optional `--registry`), `readPublishedRelease(name, { version, registry })` runs `bun pm view <name>[@version] --json`, and `installDependencies` (moved from package.ts, same command and error text) runs `bun install --ignore-scripts`.
- `published.ts`: the raw `fetch` (`readPublishedScanners`) is deleted. `selectPublishedScanner(name, registry?, host?)` walks the stable versions newest first through `stableReleases`, which reads a further release only when the walk reaches it and reuses the manifest of the first read. The three outcomes and their messages are unchanged. `publishedScannerSource` keeps its signature, so the `addScanner` and `updateScanner` call sites in inventory.ts did not change.
- `settings.ts` (`withScannerUpgrades`) and `scripts/scanner-release.ts` (`waitForPublishedScanner`) use the same reads. The release script asks for the exact uploaded version; an unlisted version keeps the wait going, any other failure stops it, as before.
- A failed lookup now reads "<name>: could not read its published releases. Check the package name, your connection and registry access, then retry." followed by the package manager's own error text (for example "407 Proxy Authentication Required: <url>").
- `docs/scanners/setup.md` states the honored registry, token and proxy settings.

Correction history:
- The task description first said `bun pm view` works in a directory without a package.json. Measured false with Bun 1.4.3: it exits 1 with "No package.json was found" unless the directory or an ancestor has one (the earlier probe directory had a package.json one level up). The description is corrected, and the lookup runs in a fresh temporary project that contains only `{}` as package.json.
- `bun pm view` and `bun install` read `.npmrc` only from the directory of the nearest package.json and from the user's home (`~/.npmrc`, also `$XDG_CONFIG_HOME/.npmrc`), never from a parent directory. The download's `<cache>/<hash>/` directory and the lookup's temporary project are both Groma-made projects without a `.npmrc`, so both steps see the user's configuration and the environment, nothing else.
- Bun itself honors `npm_config_registry` (and `NPM_CONFIG_TOKEN`) for both commands, so the old environment override keeps working without code.
- `--registry` replaces only the default registry: with `@groma:registry=` in the home `.npmrc`, a `@groma/...` package is still read from that scope's registry. An earlier note here said tokens still come from `.npmrc` by host under `--registry`; that was only measured when the `.npmrc` default registry is the same host, so it is withdrawn.
- `bun pm view` requests the full packument (`Accept: application/json`) and prints the release manifest as the registry sent it, including `groma`, `os` and `cpu`; it does not add or correct `name`. It also works from a compiled executable started with `BUN_BE_BUN=1`.
- Unknown package, non-2xx status and unreachable registry: exit 1, text on stderr. A version the registry does not list, or a package without versions: exit 1, JSON `{ "error": "No matching version found" }` on stdout (the only JSON error of `pm view` without a property path, per Bun's source).

Cold junior-maintainer review (no blocking defect), accepted findings applied:
1. `readPublishedRelease` takes `(name, { version, registry })`, so a registry can no longer be passed where the version was expected (`readPublishedRelease(name, registry)` is now TS2559). Call sites in published.ts and scripts/scanner-release.ts updated.
2. The `registry` option comment in inventory.ts now says it replaces only the default registry and does not isolate a run from the user's npm settings.
3. `selectPublishedScanner` records "a release supports this computer" in its own boolean; the comment that explained the inference from the Groma requirement is deleted.
4. test-bun/scanner-release.test.ts is back to its HEAD text (1000 ms deadline, no comment) and removed from the modified files. It never failed at 1000 ms here; the wider window was a guess about slower machines.
5. The doc of `readPublishedRelease` states what throws, what returns undefined, that the release script's wait relies on undefined, and that Bun's "No matching version found" text identifies that case.
6. The header of package-manager.ts claims only reading and downloading scanner releases in `src/`, and names the release script's own `npm` use.
7. The generic stays; the doc says the manifest is returned as the registry sent it, unvalidated, and callers check the fields they use.
8. `release.name !== name` is deleted from `selectPublishedScanner`, together with the `{ ...item, name }` fixture detail that existed only for it (the selection test passes without it).
9. The task description sentence is corrected.

Verification after the review changes:
- The five scanner test files alone (`bun test --timeout 20000 test-bun/scanner-installation.test.ts test-bun/scanner-recommendations.test.ts test-bun/scanner-release.test.ts test-bun/scanner-update.test.ts test-bun/scanner-upgrades.test.ts`): 11 pass, 0 fail.
- `bun run check` in the shared tree: exit 0 (Biome reports nothing for the changed files, tsc clean, node tests 16 pass, bun tests 777 pass, 51 skip, 0 fail).
- Before the review: the new test "a bare package name is selected and downloaded with the registry and token of the user .npmrc" (test-bun/scanner-installation.test.ts) was seen failing on HEAD 7b9f3c09 in a detached worktree (the old lookup asked registry.npmjs.org, selected the public 0.2.1, and the download then failed at the fake registry) and passing on the new code.
- Before the review, end-to-end proof outside the suite (session scratch `task-580/e2e.ts`, output `e2e.out`): a fake registry that logs requests and answers 401 without its token, named only in a home `.npmrc`. Old code: `groma scanner add @groma/scanner-react` exits 1, the lookup never reaches the registry; with `npm_config_registry` exported the old lookup arrives with `authorization=null` and fails with HTTP 401. New code: add, the settings upgrade check, update and install-recommended all reach the registry with `Authorization: Bearer <token>` for lookup and download; the same holds for a scoped `@groma:registry=` line and through `HTTP_PROXY` with credentials (`Proxy-Authorization` on lookup and download); the `.npmrc` keys `proxy=` / `https-proxy=` are not read; 407, 404 and DNS failures keep the package manager's error text. The review changes are renames, deletions and comments, so the proof was not rerun.

Findings outside this task (not implemented):
- Download staleness, unchanged by this task: `bun install` answers from its manifest cache, so installing a release that was published after this computer last cached that package's manifest fails with "No version matching ... (but package exists)" until the cache entry expires. Reproduced in the proof (update seconds after publishing). `--no-cache` on the install command makes the download read a fresh manifest (measured), at one extra request per install.
- When no release fits, the walk reads every stable manifest once, one package-manager call each, before it reports the reason. The usual install costs one call.
- After review finding 8, `publishedScannerSource` still builds the source from `release.name`, which Bun prints as the registry sent it. A registry whose release manifest has no name now ends in "scanner source must be an exact package@version ..." instead of "no published stable scanner release", and one whose manifest carries another name would make `addScanner` install that other package (the check in package.ts compares against the same source string). Real registries always send the asked name. Building the source from the asked `name` would close it in one line; not done, it was not an accepted finding.
- Architecture, for the commit: `src/scanner/modules/package-manager.ts` is code of the existing component `package` (Plugin packages), not a new C4 element. Its stand-alone component from the next scan should be folded with `groma edit package --combine <id>`, and the two `package` rows to `scanner-package-registry` ("Reads scanner releases", HTTP registry API, from published.ts; "Downloads scanner packages" from package.ts) now both originate in package-manager.ts through Bun's package manager. No `groma/` file was changed in this session.
- Not verifiable here: the new test's home override on Windows (it sets HOME, USERPROFILE and XDG_CONFIG_HOME for the child process only).

After the review fixes the orchestrating session changed one line in `src/scanner/modules/published.ts`: `publishedScannerSource` builds the source from the package name that was asked for, and the registry supplies only the version. With the `release.name` check deleted (review finding 8), a registry manifest carrying no name or another name could otherwise have produced a wrong source. Verified: the five scanner registry test files pass (11 tests), Biome lint on `published.ts` and `package-manager.ts` reports nothing, `bun run typecheck` passes.

Verified again on the combined working tree with every TASK-592 change present: `bun run check` exits 0 (Node 16 pass; Bun 785 pass, 53 skip, 0 fail).

Architecture: a scan made `package-manager.ts` a stand-alone component; it was moved to the `cli` container and combined into `package` (Plugin packages), and the relationship row from `published.ts` to `scanner-package-registry` now names the package manager as its technology instead of the HTTP registry API.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Fixes GitHub issue 125. Reading a scanner release and downloading it now have one owner, `src/scanner/modules/package-manager.ts`, which runs the package manager built into Groma, so both steps honor the same `.npmrc` registry, scoped registry and token and the same proxy environment variables; the raw registry `fetch` is gone. `selectPublishedScanner` in `published.ts` keeps its rule and its three messages and reads releases newest first, one registry read in the usual case. The settings upgrade check and the release script wait use the same owner, and `docs/scanners/setup.md` states which settings are honored (the `.npmrc` proxy keys are not read). Verified by a test that runs the real CLI against a registry answering 401 without the token from a home `.npmrc` (it fails on the old code), an end to end run of add, update, install-recommended and the upgrade check, and a cold review whose findings are applied. Not verified: Windows, and the reporter network. Open, outside this task: the install step can answer from a stale manifest cache right after a release is published; when no release fits, every stable release is read once before the error; open pull request 117 edits the same function.
<!-- SECTION:FINAL_SUMMARY:END -->
