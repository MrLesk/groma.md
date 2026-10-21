# Project plugin settings

[`config.json`](../config.md) lists the project's plugins; its page explains how a colleague
restores them. This page covers the plugins screen and scanner setup.

Open **Plugins** from the groma.md splash screen (`s`), the terminal map
(`Shift+S`), or **Settings → Plugins** in the web toolbar.
`groma scanner settings` opens the same terminal
screen; without a terminal it prints the shared settings snapshot as JSON.

Within **Scanners**, the screen groups **Installed**, **Missing on this computer**,
and **Recommended**. **Work sources** lists Backlog.md: listed, or offered with **Install**. Empty groups are hidden. Search filters the list by
scanner name, package or technology. Web rows keep the scanner name, version,
origin and available action together. **Matching files** expands the source
detection evidence; **Scanner details** reveals diagnostics for failures.
The web offers bulk installation when a group has multiple installable scanners. A single
recommendation has one **Install** button; multiple recommendations also offer
**Install all**. Settings is always available in live web.
A warning appears only when scanning needs attention and opens the affected
scanner in Settings. Potential duplicates belong to the separate Project review.

**Install** selects a published stable release for this groma.md version and
computer, saves its exact version, and scans. **Install recommended scanners**
performs that flow for all current recommendations. **Install missing plugins**
selects the newest compatible releases of configured npm scanners, restores
other missing plugins, and scans. Both actions keep successful installations if
another package fails; Retry attempts the remaining work.

Scans and live maps start immediately with installed scanners. The project's
`automaticUpdates` setting defaults to `true`; **Automatic updates** in Plugins
(web checkbox or terminal `t`) changes it. Opening Plugins rechecks in the
background without waiting for the registry. `false` disables background
updates and their follow-up scan. npm update checks run in the background; offline use keeps the installed versions working. Once
updates finish, Groma records their versions and runs the normal scan again, so
the open map refreshes through its existing architecture watcher. Project
settings and include/exclude lists stay unchanged. File edits alone do not
check npm.

**Add plugin** accepts a package name, exact npm version, Git source or local
package path. Bare names use the same published-release selection. For a missing
local package, restore its directory. **Remove from project** keeps saved
architecture. For npm scanners, **Update** installs the newest compatible stable
release and saves its exact version. Opening web settings checks for newer
compatible releases and shows the installed and available versions with **Update**
on the row. The button installs that shown version. An available upgrade does not
raise a scan warning. Update check errors appear in Details without changing scan
readiness. **Remove from project** and **Choose version** are in Details.
**Choose version** selects an exact version of the same package. With
`automaticUpdates` enabled, background updates can replace it. Git updates
require a tag or commit in the same repository and keep that revision.

Release selection and download both use the package manager built into groma.md,
so they follow the same npm settings. They read the default registry
(`registry=`), a scope's registry (`@scope:registry=`) and registry tokens
(`//host/:_authToken=`) from the `.npmrc` in your home directory, and the
`npm_config_registry` environment variable. A proxy comes from the `HTTP_PROXY`
and `HTTPS_PROXY` environment variables, including credentials in the proxy URL.
The `proxy` and `https-proxy` keys of `.npmrc` are not read, and neither is a
`.npmrc` inside the project.

Native Git's fallback is the filtered OS system CA store. Configure
`http.sslCAInfo` / `http.sslCAPath` or `GIT_SSL_CAINFO` / `GIT_SSL_CAPATH` for a
private CA or a custom Git build with a different CA store. This keeps native Git
trust separate from Node's bundled and `NODE_EXTRA_CA_CERTS` authorities. Per-URL
CA selection follows Git's effective rewritten URL.

Native Git downloads temporarily reject proxy URLs starting with `https://`,
including private HTTPS proxies. Git cannot isolate their fallback CA directory, which can still trust
compromised keys despite a filtered CAfile. This restriction applies to Git
scanner sources and Git dependencies installed by the package manager. An unusable
proxy CA path beneath an owned regular file stops the connection before authentication. Direct
HTTPS and HTTP CONNECT proxies retain origin certificate verification and authentication.
`HTTPS_PROXY=http://...` therefore continues to work.

The CLI uses the same release selection:

```sh
groma plugin update typescript
groma plugin update typescript @groma/scanner-typescript
groma plugin update typescript @groma/scanner-typescript@0.1.2
```

Scanners validate project requirements when scanning. A failed scanner shows its
error and **Retry** after fixing the problem. Download and release-selection
failures show the affected package, the next step and **Retry installation**.
Full error output is available inline through Details; the web shows **Needs
attention** on the row and keeps the full diagnostic in **Error details**. groma.md does
not install project dependencies or development tools on the user's behalf.

In the terminal, `i` installs recommended scanners, `m` installs missing plugins,
and `r` retries a failed installation. `/` edits search, Enter keeps the filter, and Escape clears it
while editing. `d` toggles details; Page Up/Down scrolls the open details or moves
through the list. Web details expand inside the selected row.

A warning means no available selection matches detected source projects. A quiet
hint means some detected technology support is missing or its project match is unknown. Actual
scanner failures show their error. No detected source project is neutral, so a
project used only to read saved or hand-written architecture needs no scanners.
Unknown metadata or compatibility remains unknown; a match never promises complete
architecture coverage. Official and third-party plugins use the same rules.

The live session starts its source watch before the first scan. Edits made during
that scan wait for the current batch to finish.
The live session watches relevant source declarations through the scanner adapter,
including with no scanner selected so new projects can appear in settings. Only
installed project selections without known metadata incompatibilities execute scans.
An incompatible groma.md API version blocks the plugin before its
code is loaded, including preparation checks. Settings show the reason; other
eligible scanners can still run. An empty observation set does not
write architecture. Missing packages do not prevent available scanners from
running. Partial scans keep Code and relationships from absent scanners, including
relationships that need several scanners. An active scanner failure keeps that scanner's
saved result while successful scanners update theirs. Each failed scanner shows
its own error. Setup reports readiness problems and continues to the scan. Package changes and exclusion lists update
subscriptions without restarting. Architecture and Backlog updates have separate
subscriptions.

## Initialization and command-line setup

`groma init` reviews scanner support before its first scan. The terminal shows
project declarations, evidence locations, package availability, and coverage
gaps, then offers the installable packages in one selection. The browser saves
project settings first, then shows the same proposal with package checkboxes
before scanning. Existing scanner selections are retained. Clear a new package selection to decline it.
Browser windows share a pending setup step. Submitting it from two windows runs
installation and the first scan once; both windows wait for the same result.
If an installation fails, setup keeps successful installations and refreshes
the browser selection. Submit the remaining selection again to retry; scanners
already saved in the project stay selected. Their installed versions run immediately,
and background checks download available npm updates when enabled.

Run the journey again after project technologies change:

```sh
groma scanner setup
```

Setup adds only selected scanners. `config.json` in the selected architecture
directory records their resolved package versions; background checks refresh npm
selections automatically when enabled. Disable an existing scanner explicitly with
`groma plugin remove <id>`.

## Package availability and project readiness

`groma scanner discover` reads declarations and reports project matches and official candidates;
it does not run plugins or install anything. Detection offers a package name.
Install resolves a published release for groma.md and this computer; the scanner
then validates source inputs and language support.

`groma plugin list` reports whether each listed plugin is on this computer without executing scanner code. `groma scanner check` separately loads
enabled plugins and runs their source-readiness checks:

- `ready`: the source-readiness check passed; the scan can still report a
  syntax or analysis error.
- `blocked`: scanner assets or supported source inputs are missing or invalid. The
  plugin's concrete instructions are printed and the command fails.
- `unchecked`: the plugin has no readiness hook. It remains enabled and its
  scan establishes whether the project is supported.

Java and C# check their bundled workers and runtimes plus source project
inputs. Framework scanners use their own compiler tools. A supported fresh
checkout needs no installed project dependencies, build output, or separately
installed language SDK. Missing external types remain unresolved facts.

If scanner assets are missing, reinstall the scanner package. Correct invalid
source or unsupported configuration according to its diagnostic. Failed scanners
retain their saved evidence while successful scanners update architecture.
Missing or unselected packages do not prevent other selections from running.

## Noninteractive use

Without a terminal, initialization and `groma scanner setup` report the
proposal and readiness without asking for input or installing packages.
`groma scanner setup --no-interactive` requests this behavior explicitly.
Discovery can also run before initialization in an existing Git repository:

```sh
groma scanner discover --json
groma init 'My project' --directory groma
groma scanner setup --no-interactive
```

Install a scanner with `groma plugin add <package>`; it selects a published
compatible release. For a project whose scanner configuration is already
committed, CI prepares the current npm scanners and checks them with:

```sh
groma plugin install
groma scanner check
groma scan
```

Local scanner paths remain available for development through `plugin add`;
they do not establish that an official public release exists.
Restoring also checks local selections and fails with the missing directory
when one is unavailable. To share a local scanner with colleagues, commit its
runnable package and select a path relative to the repository.

Scanner selection and readiness are operational configuration, not OKF
concepts or C4 elements. Ordinary Markdown and OKF readers keep the same
architecture records and links. groma.md's existing scanner module management
owns package selection; each language plugin owns its source inputs and bundled analysis tools.
