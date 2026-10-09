# Project plugin settings

`<groma-root>/plugins.json` explicitly selects project plugins. A missing file
selects none. No plugin is loaded just because its package or CLI is installed.
The file has one section per kind: `scanners` and `workSources`. This revision
supports at most one work source, whose id is `backlog`. Plugin ids are lowercase
kebab-case. `exclude` and `useGitignore` apply to scanners at the top level.

```json
{
  "scanners": [
    { "id": "typescript", "source": "./plugins/scanners/typescript", "include": ["**/*.ts"] }
  ],
  "workSources": [
    { "id": "backlog", "source": "./plugins/work-sources/backlog" }
  ],
  "exclude": ["/test/"],
  "useGitignore": true
}
```

Scanner entries require `id`, `source`, and `include`, and may contain `settings`
and `exclude`. Work-source entries contain only `id` and `source`. Sources use
an exact npm `package@version`, a local `./path`, or a
`git+https://repository#tag-or-commit`; adding a bare npm name selects a compatible
stable release and stores its exact version. Git tags are pinned to a commit.

```sh
groma plugin add @groma/work-source-backlog
groma plugin list
groma plugin install
groma plugin update backlog
groma plugin remove backlog
```

These commands manage both kinds; scanner commands remain available for scanner
setup, discovery, readiness, and existing scanner selections. Web and terminal
settings group selections by kind. Package availability and readiness are
separate: a missing package needs restoration; an incompatible Groma version
blocks loading; a found Backlog adapter needs the `backlog` CLI on PATH.
Its readiness reports `bun i -g backlog.md` when that CLI is missing. Without a
Backlog selection, neither the welcome screen nor either viewer invokes it.
Choosing Backlog during interactive `groma init` installs the adapter and records
its selection before initializing Backlog.

A work-source package declares its id, relative entry and host compatibility:

```json
{ "groma": { "workSource": {
  "id": "backlog", "entry": "./src/index.ts", "compatibility": { "groma": ">=0.6.6" }
} } }
```

Its default export implements the work-source contract: `id`, `readiness()`, and
`create(repositoryRoot)`. The created source owns task reads and its closeable
watch. Package loading and installation reuse the scanner package resolver.

Plugin selection is operational configuration, not an OKF concept or C4 element.
Ordinary Markdown and OKF readers retain the same architecture records and links;
Groma's plugin management owns selection and loading, while each adapter owns
its external tool interaction.


Open **Plugins** from the groma.md splash screen (`s`), the terminal map
(`Shift+S`), or **Settings → Plugins** in the web toolbar.
`groma scanner settings` opens the same terminal
screen; without a terminal it prints the shared settings snapshot as JSON.

Within **Scanners**, the screen groups **Installed**, **Missing on this computer**,
and **Recommended**. **Work sources** lists the selected task adapter. Empty groups are hidden. Search filters the list by
scanner name, package or technology. Web rows keep the scanner name, version,
origin and available action together. **Matching files** expands the source
detection evidence; **Scanner details** reveals diagnostics for failures.
The web offers bulk installation when a group has multiple installable scanners. A single
recommendation has one **Install** button; multiple recommendations also offer
**Install all**. Settings is always available in live web.
A warning appears only when scanning needs attention and opens the affected
plugin in Settings. Potential duplicates belong to the separate Project review.

**Install** selects a published stable release for this groma.md version and
computer, saves its exact version, and scans. **Install recommended scanners**
performs that flow for all current recommendations. **Install missing scanners**
restores the exact selections shared by the team and scans. Both actions keep
successful installations if another package fails; Retry attempts the remaining
work. Existing selections are never silently upgraded.

**Add plugin** accepts a package name, exact npm version, Git source or local
package path. Bare names use the same published-release selection. For a missing
local package, restore its directory. **Remove from project** keeps saved
architecture. For npm scanners, **Update** installs the newest compatible stable
release and saves its exact version. Opening web settings checks for newer
compatible releases and shows the installed and available versions with **Update**
on the row. The button installs that shown version. An available upgrade does not
raise a scan warning. Update check errors appear in Details without changing scan
readiness. **Remove from project** and **Choose version** are in Details.
**Choose version** accepts an exact version of the same package. Git updates
require a tag or commit in the same repository.

The CLI uses the same release selection:

```sh
groma scanner update typescript
groma scanner update typescript @groma/scanner-typescript
groma scanner update typescript @groma/scanner-typescript@0.1.2
```

Scanners validate project requirements when scanning. A failed scanner shows its
error and **Retry** after fixing the problem. Download and release-selection
failures show the affected package, the next step and **Retry installation**.
Full error output is available inline through Details; the web shows **Needs
attention** on the row and keeps the full diagnostic in **Error details**. groma.md does
not install project dependencies or development tools on the user's behalf.

In the terminal, `i` installs recommended scanners, `m` installs missing scanners,
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
already saved in the project keep their pinned versions and are not reinstalled.

Run the journey again after project technologies change:

```sh
groma scanner setup
```

Only selected additions are installed through the existing exact-version
installer. `plugins.json` in the selected architecture directory records their
exact package versions. Disable an existing scanner explicitly with
`groma scanner remove <id>`.

## Package availability and project readiness

`groma scanner discover` reads declarations and reports project matches and official candidates;
it does not run plugins or install anything. Detection offers a package name.
Install resolves a published release for groma.md and this computer; the scanner
then validates source inputs and language support.

`groma scanner list` reports whether each configured package is found or missing without executing it. `groma scanner check` separately loads
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

Install a chosen, qualified release explicitly with
`groma scanner add <package>@<exact-version>`. Use the exact source provided by
the verified release; the catalog does not invent published versions. For a
project whose scanner configuration is already committed, CI restores and
checks it with:

```sh
groma scanner install
groma scanner check
groma scan
```

Local scanner paths remain available for development through `scanner add`;
they do not establish that an official public release exists.
Bulk install also checks local selections and fails with the missing directory
when one is unavailable. To share a local scanner with colleagues, commit its
runnable package and select a path relative to the repository.

Scanner selection and readiness are operational configuration, not OKF
concepts or C4 elements. Ordinary Markdown and OKF readers keep the same
architecture records and links. groma.md's existing scanner module management
owns package selection; each language plugin owns its source inputs and bundled analysis tools.
