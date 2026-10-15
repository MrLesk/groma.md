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
or six-digit hexadecimal RGB. An accent keeps its colour in light, dark and
blueprint themes and draws the element's outline. The element's surfaces are
the theme's paper mixed with the accent, and its title is the accent mixed
toward the theme's text colour, so titles stay readable on those surfaces in
every theme. The legend below the hierarchy lists each colour in use with
the number of elements that have it; a name and its hexadecimal value are the
same colour.

Icon names resolve through installed packs in configured order. Use `pack:name`
to select a particular pack. An unknown name draws no icon and `groma lint`
reports the element and name. A resolved pack icon travels with the map as its
SVG, so an exported page or a cover shows it without the pack and without
network access. An emoji needs no pack: the map draws it as text in the
reader's own emoji font. Covers show pack icons only, because the cover
renderer has no emoji font; the room of a hidden emoji stays, so a building's
name sits one line lower and a system's or container's name slightly right of
centre. The details panes list the icon's name, or the
emoji, and the colour; the web pane also draws a pack icon beside the title.

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
colours, and vector shapes; external files and fonts are not bundled. A pack
declares no entry: Groma reads only the SVG files it declares, as images, and
runs no code from it.

Install a development pack with `groma plugin add ./path/to/pack`. An npm or
pinned Git pack is installed like any plugin package, so the dependencies its
package.json declares are downloaded too, with install scripts disabled:
`groma plugin add my-architecture-icons@1.0.0` or
`groma plugin add git+https://example.com/icons.git#v1.0.0`.
Selections live in the `icons` array of `<groma-root>/plugins.json`, in the
order they answer an icon name that names no pack. A pack id cannot repeat the
id of another pack, a scanner or a work source:

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

The official pack is `plugins/icons/architecture`. It supplies server, vm,
function, container, package, block-storage, database, cache, queue, document,
scheduler, mail, load-balancer, router, switch, dns, firewall, lock, cloud,
user, desktop, laptop, mobile and image. Its isometric artwork is MIT licensed,
with the notice in `icons/LICENSE`. Every shape carries a role class (`gi-t`
top face, `gi-s` side face, `gi-d` shaded face, `gi-l` line fill, `gi-k` line
stroke), and each file's own style gives the roles grey defaults. Its build function copies the manifest, SVGs and project
licence; the existing scanner release workflow stages it as `icons-architecture`
on each host, carries it through assembly and publishes it with the scanner
packages. It needs no platform-specific build. Follow the existing
[release procedure](scanners/publishing.md), bumping its version when its
contents change. Publication requires the same npm access or trusted-publisher
configuration as other official packages.
