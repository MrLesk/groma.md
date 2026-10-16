# Project configuration

`<groma-root>/config.json` is the project's one groma.md configuration. Commit it:
a colleague who pulls the project gets the same plugins at the same versions.

```json
{
  "scanners": [
    { "id": "typescript", "source": "@groma/scanner-typescript@0.4.2", "include": ["**/*.ts"] }
  ],
  "workSources": [
    { "id": "backlog", "version": "1.53.0" }
  ],
  "exclude": ["/test/"],
  "useGitignore": true
}
```

## Upgrading from scanners.json

On first use, when `config.json` is absent, Groma converts an existing
`scanners.json`. Scanner sources, settings, include/exclude lists and global
options are preserved. If the Backlog.md CLI is already installed and no scanner
uses the `backlog` ID, its version is recorded too; nothing is installed or
initialized. An existing scanner keeps that ID. Groma removes the old file after
saving `config.json`.

An existing `config.json` always wins. Removing Backlog.md later stays effective;
the conversion does not run again.

## Plugins

Each section lists the plugins of one kind. No plugin runs unless the file lists
it. Ids are lowercase kebab-case; one id names one plugin across all sections.

- `scanners`: `id`, `source` and `include`, optionally `settings` and `exclude`.
  [Scanner settings](scanners/setup.md) describes them.
- `workSources`: at most one. groma.md bundles Backlog.md, id `backlog`.

A plugin with a `source` is downloaded. The source is exact: an npm
`package@version`, a `git+https://repository#tag-or-commit` (a tag is recorded as
its commit), or a local `./path` that runs from the repository.

A plugin without a `source` is bundled: it ships inside groma.md and has its
version. The Backlog.md work source reads tasks through the Backlog.md CLI; its
`version` is the lowest CLI version the project uses.

`exclude` and `useGitignore` apply to every scanner; see
[Scanners](scanners/index.md).

## Restoring plugins on another computer

When someone adds or updates a plugin, `config.json` records its version. A
colleague who pulls then finds that plugin missing: a scanner whose package at
the exact source is not on this computer, or a Backlog.md CLI that is not
installed or is older than the listed version.

Restoring downloads the scanner package, or installs the current Backlog.md CLI
with the package manager groma.md was installed with, else the first of bun, npm
and Homebrew on the PATH. A missing local scanner directory cannot be restored;
bring it back yourself.

- `groma web` opens on **Restore plugins** when a plugin is missing. **Restore**
  restores each one with its own progress mark, then opens the map. A plugin it
  cannot restore stays on the view with the reason. **Proceed without them**
  opens the map read-only: no scan runs and nothing can be edited until
  `groma web` starts again with every plugin present.
- The `groma` welcome screen names the missing plugins.
- `groma plugin install` restores them.
- The plugins screen restores a missing plugin from its row.

## Commands

```sh
groma plugin add backlog
groma plugin add @groma/scanner-go
groma plugin list
groma plugin install
groma plugin update typescript
groma plugin update backlog
groma plugin remove backlog
```

`add` takes a bundled plugin's id or a scanner source; a bare npm name selects
the newest compatible stable release and records its exact version. `update`
moves a scanner to its newest compatible release, or to the exact source given,
and updates the Backlog.md CLI to its current release; both record the new
version. `remove` keeps downloaded packages in the shared cache.

The plugins screen, **Settings → Plugins** in `groma web` or `s` on the welcome
screen, offers the same operations and lists the bundled plugins the project
does not use yet, each with **Install**.

`config.json` is operational configuration, not architecture knowledge: it adds
no OKF concept or C4 element, and a Markdown reader of the architecture sees
nothing of it.
