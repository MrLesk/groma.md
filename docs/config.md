# Project configuration

`<groma-root>/config.json` is the project's one groma.md configuration. Commit it:
colleagues who pull the project get the same selected plugins and project settings.

```json
{
  "scanners": [
    { "id": "typescript", "source": "@groma/scanner-typescript@0.4.2", "include": ["**/*.ts"] }
  ],
  "workSources": [
    { "id": "backlog", "version": "1.53.0" }
  ],
  "exclude": ["/test/"],
  "useGitignore": true,
  "automaticUpdates": true
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

Each section lists the plugins of one kind. No scanner or work source runs
unless the file lists it. Ids are lowercase kebab-case; one id names one entry
across all sections, [themes](#themes) included.

- `scanners`: `id`, `source` and `include`, optionally `settings` and `exclude`.
  [Scanner settings](scanners/setup.md) describes them.
- `workSources`: at most one. groma.md bundles Backlog.md, id `backlog`.

A plugin with a `source` is downloaded. An npm `package@version` records the
release last selected; scanning refreshes it automatically. A
`git+https://repository#tag-or-commit` keeps its declared revision (a tag is
recorded as its commit), and a local `./path` runs from the repository.

A plugin without a `source` is bundled: it ships inside groma.md and has its
version. The Backlog.md work source reads tasks through the Backlog.md CLI; its
`version` is the lowest CLI version the project uses.

## Themes

`themes` lists the UI themes the web map offers, in picker order. A theme owns
the interface and the map background: surfaces, text, grid, controls, and what
each [named color](component-markdown.md#colors) looks like. It never changes
which color an element has.

```json
{
  "themes": [
    { "id": "light" },
    { "id": "dark" },
    { "id": "midnight", "source": "./groma/midnight.theme.json" }
  ]
}
```

- An entry without a `source` is a bundled theme: `light`, `dark` or `blueprint`.
- An entry with a `source` is a theme file in the repository, at a path relative
  to the repository root.
- Without a `themes` list a project offers the three bundled themes. With one,
  the picker offers exactly the listed themes, after a reload.

Bundled themes and theme files have one shape and one loader
([`src/themes/`](../src/themes/definition.ts)). A theme file is JSON:

| Field | Meaning |
| --- | --- |
| `title` | The name the picker shows. |
| `scheme` | `light` or `dark`: the system appearance the theme suits. |
| `chromeOpacity` | Share of the paper colour in the translucent panels, from 0 to 1. |
| `palette` | Every colour of the interface and the map, each as `#RRGGBB`; `hover` may be any CSS colour. |
| `palette.colors` | One value for each named color: `red`, `orange`, `yellow`, `blue`, `violet`, `pink`. |

A theme file must define every value; one that does not fails to load with the
name of the missing field. A theme file sets colours and panel opacity. The
bundled Dark and Blueprint also carry a few line treatments of their own, such
as Blueprint's underlined keywords in the source view, which a clone does not
take. **Auto** shows the first listed theme whose `scheme`
matches the system appearance, so the order of the list decides which light and
which dark theme Auto uses. A theme chosen by name stays chosen.

To make your own theme, clone one and edit the file:

```sh
groma plugin clone dark midnight
```

This writes `<groma-root>/midnight.theme.json` with every value of Dark and adds
it to `themes`. `groma plugin add blueprint` or `groma plugin add ./theme.json`
enables a theme, `groma plugin remove dark` takes one out of the picker, and
`groma plugin list` shows the enabled themes.

`exclude` and `useGitignore` apply to every scanner; see
[Scanners](scanners/index.md).

## Automatic scanner updates

`automaticUpdates` defaults to `true`. Set it to `false` to disable background
updates and their follow-up scan. The Plugins screen offers **Automatic updates**
(web checkbox or terminal `t`). Explicit plugin update commands still work.

Scans and live terminal or web maps start with the scanner versions already on
this computer. They check for newer compatible stable npm releases in the
background, without waiting for registry access or a startup timeout. Offline
scans keep using the installed versions.

After the updates finish, groma.md records the completed selections in
`config.json` and runs the normal scan again. An open map refreshes from that
scan through its ordinary architecture watcher. Opening Plugins checks again in
the background, sharing any check already running in that session. Scanner settings and
include/exclude lists stay as the project set them. Already installed releases
are reused, and Git and local scanners keep their declared sources.

Manual plugin changes also save against the current configuration after downloads,
so another plugin change or settings edit is preserved. If the same scanner's
selection changed during a manual update, Groma reports the conflict.

Missing packages still need the normal plugin installation or restoration flow.

## Restoring plugins on another computer

When someone adds or updates a plugin, `config.json` records its version. A
colleague who pulls then finds that plugin missing: a scanner whose package at
the exact source is not on this computer, or a Backlog.md CLI that is not
installed or is older than the listed version.

Restoring selects the newest compatible npm scanner and records its release;
Git scanners restore their declared commit. It installs the current Backlog.md
CLI with the package manager groma.md was installed with, else the first of bun,
npm and Homebrew on the PATH. A missing local scanner directory cannot be
restored; bring it back yourself.

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
version. An explicit npm version is eligible for automatic background updates unless
`automaticUpdates` is false. `remove` keeps downloaded packages in the shared cache.

The plugins screen, **Settings → Plugins** in `groma web` or `s` on the welcome
screen, offers the same operations and lists the bundled plugins the project
does not use yet, each with **Install**.
