# Architecture icons and colours

Give any architecture element an icon and a fixed accent through its details
form or the CLI. These are Groma presentation fields on the existing OKF
concept, not C4 types or additional architecture boundaries. Ordinary Markdown
readers retain the concept's title, prose, links and readable field values.

```sh
groma plugin add @groma/icons-architecture
groma edit storage --icon architecture:database --colour blue
groma edit storage --icon "📦" --colour "#397ed1"
groma edit storage --icon "" --colour ""
```

Colours accept the names documented in [the Markdown contract](component-markdown.md)
or six-digit hexadecimal RGB. They keep the same accent in light, dark and
blueprint themes. The legend below the hierarchy lists each colour in use with
the number of elements that have it; a name and its hexadecimal value are the
same colour.

Icon names resolve through installed packs in configured order. Use `pack:name`
to select a particular pack. An unknown name draws no icon and `groma lint`
reports the element and name. The map, the web details pane, exported pages
and covers embed a pack icon as its SVG, so showing it needs neither the
installed pack nor network access. An emoji needs no pack: the map draws it as
text in the reader's own emoji font. Covers show pack icons only, because the
cover renderer has no emoji font. The details panes list the icon's name, or
the emoji, beside the colour.

## Make a pack

A pack is a normal npm package with SVG files and this package.json metadata:

```json
{
  "name": "my-architecture-icons",
  "version": "1.0.0",
  "files": ["icons"],
  "groma": {
    "icons": {
      "id": "my-icons",
      "icons": { "database": "./icons/database.svg" }
    }
  }
}
```

The pack id and icon names use lowercase kebab-case. Each value names an SVG
file inside the package. Use self-contained SVG with a viewBox, explicit
colours, and vector shapes; external files and fonts are not bundled. Groma
reads these assets as images and does not execute a pack entry point.

Install a development pack with `groma plugin add ./path/to/pack`. npm packages
and pinned Git sources use the same resolution as scanner plugins:
`groma plugin add my-architecture-icons@1.0.0` or
`groma plugin add git+https://example.com/icons.git#v1.0.0`.
Selections live in the `icons` array of `<groma-root>/plugins.json`:

```json
{ "scanners": [], "workSources": [], "icons": [
  { "id": "my-icons", "source": "my-architecture-icons@1.0.0" }
] }
```

`groma plugin list`, `remove`, `install` and `update` manage the selection;
Settings lists installed icon packs alongside scanners and work sources.

## Publish

Publish a third-party pack using `npm publish --access public` after choosing
its package name, version and licence. Include every declared SVG in `files`.

The official pack is `plugins/icons/architecture`. It supplies database, queue,
cache, browser, mobile-app, service, scheduler, file-store, mail, identity,
gateway and search. Its build function copies the manifest, SVGs and project
licence; the existing scanner release workflow stages it as `icons-architecture`
on each host, carries it through assembly and publishes it with the scanner
packages. It needs no platform-specific build. Follow the existing
[release procedure](scanners/publishing.md), bumping its version when its
contents change. Publication requires the same npm access or trusted-publisher
configuration as other official packages.
