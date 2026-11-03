# Architecture colors

Select an architecture item or group on the map, choose **Edit**, then choose
its **Color**. Eight muted swatches provide a starting point: Sage, Teal,
Blue, Violet, Rose, Coral, Amber and Slate. Use the custom color picker or
enter a six-digit hex color such as `#5B9A7C`. **Save** applies the change;
**Cancel** leaves the saved appearance alone.

**Automatic** clears the authored color and returns the item to the map's
normal appearance. It does not inherit a parent or group color. An actor,
system, container, component or narrative group owns its own color.

## CLI and Markdown

```sh
groma edit order-store --color '#5B9A7C'
groma edit group shop/payments --color '#8875C5'
groma edit order-store --color ''
```

A group address combines its parent ID and kebab-case group name. The empty
value clears a color. Setting or clearing a color preserves the item's
[icon](icons.md); icon changes also preserve the color.

Groma stores one optional opaque `#RRGGBB` value in `groma.color`. A group's
color belongs to its parent's `groma.groupAppearance`, keyed by the exact
authored group name:

```yaml
groma:
  color: '#5B9A7C'
  groupAppearance:
    Payments:
      icon: groma:group
      color: '#8875C5'
```

See the [Markdown contract](component-markdown.md) for placement within an
element document. Ordinary Markdown and OKF readers still have the title,
description, body and links. Groma alone interprets these optional fields as
map appearance. Colors do not change C4 levels, relationships or membership;
a narrative group remains a grouping of existing elements.

## Appearance and themes

An authored color gives its owner a restrained tint and an icon accent.
Members keep their own appearance. Titles keep the theme's readable ink,
and selection, work, comparison and draft states keep their own signals.

UI themes control the map's overall appearance. Changing between Light,
Dark and Blueprint does not rewrite authored colors. Groma adjusts the
rendered accent for readability against each theme while preserving the
stored choice. Live and static maps use these rules in both isometric and 2D views.
Isometric covers use the same paint calculation.
