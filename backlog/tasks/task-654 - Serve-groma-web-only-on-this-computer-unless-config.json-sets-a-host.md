---
id: TASK-654
title: Serve groma web only on this computer unless config.json sets a host
status: Done
assignee:
  - '@claude'
created_date: '2026-11-12T07:14:00Z'
updated_date: '2026-11-12T08:10:00Z'
labels: []
dependencies: []
references:
  - 'https://github.com/MrLesk/groma.md/issues/142'
  - src/viewers/web/server.ts
  - src/config.ts
  - src/cli.ts
  - src/init-command.ts
modified_files:
  - src/config.ts
  - src/initialize.ts
  - src/viewers/web/server.ts
  - src/cli.ts
  - test-bun/web-startup.test.ts
  - docs/config.md
  - docs/viewers/web/index.md
  - README.md
type: bug
ordinal: 707000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
GitHub issue 142: `startWebViewer` in `src/viewers/web/server.ts` calls `Bun.serve` without a host name, so Bun listens on every network interface while `groma web` prints a `localhost` address. The live server has no sign-in: any computer that can reach the port can read the project source and architecture (`/source.json`, `/code.json`) and use the editing and plugin controls.

Decided by Alex on 2026-11-12:
- The default is loopback only, both when config.json does not say otherwise and as the value initialization writes.
- A project may set its own host in config.json. `groma web` then serves requests over the network.
- When it does, `groma web` prints a warning every time it starts.

Implementation choices made for this task, not decisions by Alex:
- The setting is a top-level string `webHost` in config.json, like the other flat project settings. There is no command-line flag for it.
- The default value is `127.0.0.1`.
- A host counts as loopback when it is `127.0.0.1`, `localhost` or `::1`. Every other value gets the warning.
- The warning goes to standard error, so the form of the `groma web at <address>` line on standard output stays as it is. Only the address in it changes.
- The printed address is one the server listens on: the configured host, `http://127.0.0.1:<port>` by default. `0.0.0.0` prints `http://127.0.0.1:<port>` and `::` prints `http://[::1]:<port>`. `localhost` is printed only when it is the configured host.
- A `webHost` this computer cannot listen on gets its own error that names the setting, instead of Bun's occupied-port error and the next-port question.
- The config.json of an existing project is not rewritten. A file without `webHost` means loopback.

Out of scope: sign-in, checking the `Host` or `Origin` header of requests, a `--host` flag, `groma export`, the terminal map, and the port rules.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 With no `webHost` in config.json, or no config.json at all, `groma web` accepts connections on the loopback address only: a request to its port through another address of the same computer is refused
- [x] #2 A project initialized by `groma init`, or by the setup that `groma web` and the terminal map run, has `"webHost": "127.0.0.1"` in config.json
- [x] #3 With `webHost` set to a host other than `127.0.0.1`, `localhost` or `::1`, `groma web` listens on that host and prints a warning at every start. The warning says that other computers can reach the server without signing in, can read the project source and use its editing and plugin controls, and names the `webHost` setting
- [x] #4 With a loopback `webHost`, `groma web` prints no warning
- [x] #5 The address `groma web` prints is one the server listens on and opens the map from this computer: the configured host, `http://127.0.0.1:<port>` by default. `0.0.0.0` prints `http://127.0.0.1:<port>` and `::` prints `http://[::1]:<port>`
- [x] #6 `docs/config.md` documents `webHost`, its default and the warning
- [x] #7 With a `webHost` this computer cannot listen on, `groma web` exits with code 1 and one message that names `webHost`, its value and the fix, without asking for the next port. An occupied port on the same address is reported as before
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
Flow: `groma web` (`openWeb` in `src/cli.ts`) calls `startWebViewer` (`src/viewers/web/server.ts`), which reads `webHost` through `src/config.ts`, listens on it and reports the address and, for a network host, the warning. The command prints both.

1. `src/config.ts` owns the setting, its validation and its default. `GromaConfig.webHost` is an optional non-empty string that the parser accepts and the writer saves last in the key order. `defaultWebHost` is `127.0.0.1`. `recordDefaultWebHost` writes the default through `updateGromaConfig` and keeps a value the file already sets.
2. `src/initialize.ts`: `initializeGroma` is the one initialization that `groma init`, the browser setup and the terminal setup share (all reach it through `initializeRepository`). Where it writes a new project's `project.md` it also calls `recordDefaultWebHost`. An existing project is not touched.
3. `src/viewers/web/server.ts` owns what a host value means when listening. `startWebViewer` passes the configured host to `Bun.serve`. A project that is not initialized, or whose config.json cannot be read, is served on `127.0.0.1`, because the startup page is what reports that state. `isLoopbackWebHost` is true only for `127.0.0.1`, `localhost` and `::1` and decides the warning, whose text lives next to it. `onListening` receives `{ url, networkWarning }`. The URL is the origin Bun reports for the host (`http://127.0.0.1:<port>` by default); the two hosts that listen on every interface print the loopback address they include, `http://127.0.0.1:<port>` for `0.0.0.0` and `http://[::1]:<port>` for `::`.
4. `src/viewers/web/server.ts`, before `Bun.serve`: Bun reports every failure to listen as an occupied port. A `webHost` other than the default is first tried on a port the system picks; when that fails, `startWebViewer` rejects with a plain error that names `webHost`, its value and the fix. The error has no `EADDRINUSE` code, so the command prints it and exits with code 1 without the next-port question. The default host is not probed.
5. `src/cli.ts`: one function prints `groma web at <url>` on standard output and the warning on standard error. The direct start and the next-port retry both hand it to `startWebViewer`, which calls it once per successful start.
6. Docs: `webHost` in the `docs/config.md` example and a Web host section; one paragraph in `docs/viewers/web/index.md` linking to it; the address in the `README.md` scan example.
7. Verify: `bun run check`; real runs in throwaway repositories (default, `0.0.0.0`, `::`, `localhost`, `::1`, a host this computer does not have, an occupied port, the initialization cases, malformed config.json); prove by mutation that each new test fails without the code it covers.

Tests (rule and authority / wrong result detected / gap and smallest test):

- `test-bun/web-startup.test.ts`, new test, three starts of the empty fixture: no `webHost`, `0.0.0.0`, and this computer's own network address. Each start reports the host of the address it gives, whether that address opens the map, whether the network address does, and whether it warned. Rule: acceptance criteria 1, 3, 4 and 5, from the 2026-11-12 decision (loopback by default, a project may set a host, warning at every start). Wrong result: a project without `webHost` answers a request made through another address of the same computer; a network host is not listened on or starts without the warning; the given address does not open the map; the address given for `0.0.0.0` is `http://0.0.0.0:<port>`, which is not an address to open (on macOS a connection to `0.0.0.0` still reaches the local machine, so only the reported host shows this). Gap: no test starts the server with a host or connects through anything but the address it gives. Skipped on a computer without a non-loopback IPv4 address, where there is nothing to observe.
- `test-bun/web-startup.test.ts`, new test on `isLoopbackWebHost`. Rule: the task's loopback definition, which errs toward warning. Wrong result: a loosened match (for example `127.0.0.2` or `localhost.example.com`) silences the warning for a host that may serve the network, or `localhost` and `::1` get a false warning. Gap: the server test covers only the default and network values, and `::1` cannot be bound on every CI machine.
- `test-bun/web-startup.test.ts`, one assertion added to the existing browser setup test after `/initialize`, which runs the shared `initializeRepository`. Rule: acceptance criterion 2. Wrong result: a newly initialized project has no `webHost`, or not `127.0.0.1`, in config.json. Gap: initialization tests assert only `project.md` and the index.
- `test-bun/web-startup.test.ts`, new test: a project whose `webHost` is `203.0.113.7` (reserved for documentation, so no computer has it). Rule: acceptance criterion 7. Wrong result: `startWebViewer` rejects with Bun's occupied-port error (`EADDRINUSE`), which makes the command ask for the next port and try every port, or the error does not name `webHost`. Gap: no test starts the server on a host it cannot listen on.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
`webHost` is operating configuration of the web viewer. It is not architecture knowledge: it adds no OKF metadata and no C4 element, and the decision does not depend on the scanned project or its language.

Bun 1.4.4 on macOS 27.2, measured. The official documentation for this version (`node_modules/bun-types/docs/runtime/http/server.mdx` and `serve.d.ts`) says `hostname` defaults to `"0.0.0.0"`.
- No `hostname`, and also an empty one: one IPv6 socket on `*:<port>` that accepts IPv4 too. The server answered through 127.0.0.1, ::1 and the LAN address. This is the reported exposure, and the reason the parser refuses an empty `webHost`.
- `127.0.0.1`: IPv4 loopback only. The LAN address is refused at once (ECONNREFUSED, curl exit 7).
- `localhost`: only the first address the name resolves to (`::1` here), so it is not a portable default. `::1`: IPv6 loopback only. `0.0.0.0`: every IPv4 address. `::`: every address.
- `server.url.origin` is a valid URL for a specific host, with brackets for an IPv6 literal (`http://[::1]:<port>`), so no formatting code was written for those. For `0.0.0.0` and `::` it names the every-interface host, which is not an address to open, so those two print the loopback address they include.
- A connection to `0.0.0.0` reaches the local machine on macOS. A test that only checks whether the given address answers therefore cannot see a printed `http://0.0.0.0:<port>`; the test compares the host of the address.
- Every failure to listen is reported as `EADDRINUSE`, "Failed to start server. Is port <n> in use?", with `errno` 0: an occupied port, an address this computer does not have, and a name that does not resolve look the same. Only an attempt on a port the system picks tells them apart.
- A listener on a specific address and one on every interface do not conflict on the same port, and `localhost` resolves to `::1` first.

Behavior kept: with a malformed config.json the server still starts and the startup page answers 500 with the parser's message (`JSON Parse error: Unexpected EOF`), compared before and after the change. It now listens on 127.0.0.1 in that case. `groma web` in an uninitialized repository serves the setup form on 127.0.0.1. An occupied port on the same address gives the same message, the same next-port question and the same `--port 0` hint as before, for the default host and for `0.0.0.0`. `groma init` on an existing project leaves its config.json as it is.

Corrections during the work:
- Criterion 5 first said that loopback hosts print `http://localhost:<port>`. `localhost` can open another program that holds the same port on another address, so the printed address became the one the server listens on. A review then reproduced the same problem for `0.0.0.0` with `http://localhost:<port>` and another program on `[::1]:<port>`, so the two every-interface hosts now print their loopback address and `localhost` is printed only when it is the configured host. `README.md` shows the new default address.
- Criterion 7 was added after the listen-failure finding: with a `webHost` this computer does not have, `groma web` showed the occupied-port message, and on a terminal a yes to "Use the next available port?" tried every port up to 65535 (about 21 seconds) before failing. The host is first handled in a try/catch around `Bun.serve`; after review it is probed before `Bun.serve`, which keeps that call in its original shape. The default host is never probed, so a project without `webHost` cannot be told that its `webHost` is wrong.
- The first initialization write had its own lock, existence check and `scanners.json` comment. After review it is one call to `updateGromaConfig`, which already reads, converts and locks. A new project that already has a config.json without `webHost` now receives the default as well; a value the file sets is kept.
- `isLoopbackWebHost` moved from `src/config.ts` to `src/viewers/web/server.ts`, next to the warning and the every-interface hosts, so that what a host value means when listening is in one place. The server's host reader is named `listeningHost` so that it does not share a name with the parser's `configuredWebHost`.

Verification:
- `bun run check` passes after the last change: Biome reports 2 warnings and 2 infos, all in files this task does not touch; TypeScript passes; 26 Node tests pass; 948 Bun tests pass, 65 skipped, 0 failed.
- Mutations, each restored afterwards: without the probe the unusable-host test fails (message "Failed to start server. Is port 0 in use?"); printing `server.url.origin` for every host fails the reachability test (`host` `0.0.0.0` instead of `127.0.0.1`); without `hostname` in `Bun.serve` it fails (`throughNetwork: true`, `host` `localhost`).
- Real runs in throwaway repositories with `bun src/cli.ts`: no config.json (`groma web at http://127.0.0.1:<port>`, listening `127.0.0.1:<port>`, LAN address refused, no warning, file not rewritten); `0.0.0.0` (`http://127.0.0.1:<port>`) and `::` (`http://[::1]:<port>`), each with the warning on standard error and the LAN address answering; the next-port retry on a pseudo-terminal (one address line, one warning); `localhost` (`http://localhost:<port>`) and `::1` (`http://[::1]:<port>`), both without warning; `203.0.113.7` (one message naming `webHost`, exit code 1, the same with and without a terminal, no question). Initialization: a new project receives `"webHost": "127.0.0.1"`; a new project with a config.json that lacks it receives it and keeps its other settings; a config.json that sets `0.0.0.0` keeps it. The browser setup and the terminal map setup wrote the default too, and adding Backlog.md afterwards kept it.
- No scan ran in the worktree, so `groma/` is unchanged. New imports: `src/initialize.ts` and `src/viewers/web/server.ts` now import `src/config.ts`.

Known limit, observed on macOS 27.2 only (Linux and Windows not checked): a `groma web` on the default host and one with `webHost` `0.0.0.0` both start on the same port without the occupied-port question, because a listener on a specific address and one on every interface do not conflict. `http://127.0.0.1:<port>` and `http://localhost:<port>` then open the first one, since the specific address wins; only the network address opens the second, so the address the second one prints opens the first. `http://[::1]:<port>` is refused. The same holds for any other program that holds the port on `127.0.0.1`.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
`groma web` now listens on `127.0.0.1` unless config.json sets `webHost`. Before, Bun listened on every network interface while the command printed a `localhost` address, so any computer that could reach the port could read the project source and use the editing and plugin controls without signing in.

- `src/config.ts` owns the setting: the optional `webHost` string, its validation, its default, and the write of that default for a new project.
- `initializeGroma` records `"webHost": "127.0.0.1"` for a new project, which covers `groma init`, the browser setup and the terminal map setup. The config.json of an existing project is never rewritten for it.
- `src/viewers/web/server.ts` owns what a host means when listening. `startWebViewer` listens on the configured host and reports the address and, for a host other than `127.0.0.1`, `localhost` and `::1`, a warning. `groma web` prints the address on standard output and the warning on standard error at every start, including after the next-port retry.
- The printed address is one the server listens on, `http://127.0.0.1:<port>` by default. `0.0.0.0` prints `http://127.0.0.1:<port>` and `::` prints `http://[::1]:<port>`.
- A `webHost` this computer cannot listen on ends `groma web` with code 1 and a message that names the setting, instead of Bun's occupied-port error and the next-port question.
- `docs/config.md` has a Web host section, `docs/viewers/web/index.md` links to it, and `README.md` shows the new address.

Verified by `bun run check`, by tests that connect through this computer's network address and that start on an address no computer has (each fails under the mutation of the code it covers), and by real runs of every start and initialization path in throwaway repositories. Linux and Windows are verified only by CI.

Known limit, observed on macOS only: a `groma web` on the default host and one with `webHost` `0.0.0.0` can both start on the same port without the occupied-port question. The loopback addresses then open the first one, and only the network address opens the second, so the address the second one prints opens the first.
<!-- SECTION:FINAL_SUMMARY:END -->
