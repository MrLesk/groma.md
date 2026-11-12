---
id: TASK-654
title: Serve groma web only on this computer unless config.json sets a host
status: To Do
assignee: []
created_date: '2026-11-12T07:14:00Z'
labels: []
dependencies: []
references:
  - 'https://github.com/MrLesk/groma.md/issues/142'
  - src/viewers/web/server.ts
  - src/config.ts
  - src/cli.ts
  - src/init-command.ts
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
- The warning goes to standard error, so the `groma web at <address>` line on standard output stays as it is.
- Existing config.json files are not rewritten. A file without `webHost` means loopback.

Out of scope: sign-in, checking the `Host` or `Origin` header of requests, a `--host` flag, `groma export`, the terminal map, and the port rules.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 With no `webHost` in config.json, or no config.json at all, `groma web` accepts connections on the loopback address only: a request to its port through another address of the same computer is refused
- [ ] #2 A project initialized by `groma init`, or by the setup that `groma web` and the terminal map run, has `"webHost": "127.0.0.1"` in config.json
- [ ] #3 With `webHost` set to a host other than `127.0.0.1`, `localhost` or `::1`, `groma web` listens on that host and prints a warning at every start. The warning says that other computers can reach the server without signing in, can read the project source and use its editing and plugin controls, and names the `webHost` setting
- [ ] #4 With a loopback `webHost`, `groma web` prints no warning
- [ ] #5 The address `groma web` prints opens the map from this computer: `http://localhost:<port>` for a loopback host or one that listens on all interfaces (`0.0.0.0`, `::`), otherwise the configured host
- [ ] #6 `docs/config.md` documents `webHost`, its default and the warning
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Acceptance criteria have objective verification evidence.
- [ ] #2 Relevant checks pass and changes remain task-scoped.
- [ ] #3 Public contracts or documentation are updated when behavior changes.
- [ ] #4 Implementation Plan reflects the final approach; correction history and verification are recorded in Implementation Notes.
<!-- DOD:END -->
