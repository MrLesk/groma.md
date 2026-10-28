# Architecture icons

Groma includes one original SVG family. Choose an icon in an element's or
group's edit form, or assign its name with the CLI:

```sh
groma edit order-store --icon groma:database
groma edit group shop/payments --icon groma:group
groma edit order-store --icon ''
```

Group addresses use the parent ID and the group's kebab-case name, so the
address for a group named `Payments` is `shop/payments`. An empty icon value
clears the assignment. Icons are optional; Groma does not infer them from a
project's language or technology.

## Embedded family

| Category | Icon names |
| --- | --- |
| People | `groma:person`, `groma:team` |
| Architecture | `groma:system`, `groma:external`, `groma:component`, `groma:group` |
| Applications | `groma:application`, `groma:browser`, `groma:mobile`, `groma:service`, `groma:worker` |
| Infrastructure | `groma:database`, `groma:queue`, `groma:cache`, `groma:storage`, `groma:gateway`, `groma:repository`, `groma:cloud`, `groma:identity`, `groma:mail` |

An icon describes a responsibility without changing the architecture level.
For example, a database can be a container and a repository can be an external
system. Their C4 types, boundaries and relationships remain the same. Groups
remain narrative clusters, not another C4 level.

Groma stores an element's choice in `groma.icon`. A group's choice belongs to
its parent in `groma.groupAppearance`, keyed by the authored group name. The
[Markdown contract](component-markdown.md) defines these fields. Ordinary
Markdown and OKF readers still have the element's title, description, body
and links; only Groma interprets the optional icon as map presentation.

## Artwork and rendering

[`src/architecture-icons.ts`](../src/architecture-icons.ts) owns the drawings,
labels and categories shared by the chooser and map. Each drawing uses a
24-unit view box and two path roles: an outline and a quiet wash. Viewers
supply the color, stroke width and wash opacity. The artwork contains no
fixed colors, external images, fonts or downloaded icon-pack assets.

Generic symbols follow the map's ink and sit beside the title, on the same
plane in isometric and 2D views. Their shape carries the meaning even without
color. Keep titles and C4 boundaries visible when adding or changing icons;
the symbol supplements them.

Names identify the embedded family (`groma:database`). Adding a drawing means
adding one catalog entry with original path data. The namespace distinguishes
the family; it does not require an icon plugin or installation step.

## Vendor identification

This family contains generic architecture symbols, not vendor logos. For a
GitHub external system, use the Repository icon and the title `GitHub`.
Do not draw an Octocat imitation or label a generic drawing as an official
GitHub mark.

GitHub's [official logo guidance](https://brand.github.com/foundations/logo)
permits identification of integrations but restricts changes to its marks.
Any future official mark needs separate rendering: retain its supplied
shape, approved monochrome color and upright proportions. Do not skew it
onto the map plane, apply an authored accent or add visual effects. The
recolorable original symbols in this family avoid those restrictions.
