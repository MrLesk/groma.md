# Architecture Markdown contract

groma.md stores its architecture as an application profile inside an Open
Knowledge Format (OKF) v0.2 bundle. The bundle remains ordinary Markdown:
standard OKF fields describe each concept, the nested `groma` mapping carries
groma.md-only architecture metadata, and the body explains the concept. A supporting Markdown record holds authored
relationships.

groma.md supports this explicit architecture profile. It does not load an
unmarked, generic OKF bundle as a groma.md project.

## Bundle and project profile

The bundle root is the `groma/` or `.groma/` directory selected by
`groma init`. groma.md resolves that choice once and every architecture command
uses the same root. In the paths below, `<groma-root>` means that selected
directory. Its reserved `index.md` declares the OKF version and lists the
directory's immediate contents. A newly initialized bundle starts with:

```markdown
---
okf_version: "0.2"
---

# Contents

- [project.md](<project.md>)
```

Groma maintains this root index from the actual Markdown filenames and
subdirectories, sorted by name. Links are relative to the bundle root; the
index does not list itself or non-Markdown files. Initialization regenerates
the listing, and document writes and removals refresh it when a top-level
entry changes. Nested documents remain behind their directory link rather
than being repeated in the root index. Other directory indexes are optional
and are not generated or overwritten.

The index is OKF navigation, not a C4 element. Ordinary Markdown readers can
browse its links; Groma's architecture model still reads concept metadata.
`<groma-root>/project.md` identifies the application profile:

```markdown
---
type: Groma Project
title: Shop
description: Architecture of the shop service
groma:
  profile: architecture
---

The shop service accepts orders and tracks fulfilment.
```

`title` is required. `description` is an optional concise standard OKF field.
The normal Markdown body is the complete project overview, starts with prose,
and has no level-one heading copied from `title`.

Any other `index.md` or `log.md` in the bundle is reserved context Markdown,
never a concept, and the scanner never gives an element one of those names.

## Local updates

Local CLI and web authoring operations and scanner reconciliation share one
filesystem access boundary. `GromaFileSystem.withAccess` owns the project lock,
waits up to five seconds, and releases it after the operation. Architecture
readers use the same boundary so they do not load a structural change halfway
through. Nested storage calls reuse the current operation. New write entry
points use the shared `writes` API in `src/authoring.ts`.

The lock covers reading the current architecture, checking the change, and
writing its result. Each file is replaced by renaming a completed temporary
file beside it. CLI edits overwrite only the requested fields on that latest
architecture; they take no original-value option. Web forms also compare the
original values of changed fields, returning a conflict before any write when
another edit changed one of them. An already-applied value succeeds.

Lock timeout and field conflicts make no architecture changes. Domain validation
and conflict checks are independent of storage.

This protects cooperating local Groma processes. Separate clones and direct
file editors do not share this boundary. Changes across several files are not
an all-or-nothing transaction after a process crash. A killed process can leave
`<groma-root>/.groma.lock`; remove it only after confirming its operation has
stopped. There is no automatic stale-lock recovery.

## One tree and draft identity

Every C4 concept lives in one tree under `<groma-root>`. Its lifecycle is the
standard top-level `status`: `draft` for a concept that does not exist yet,
`stable` for everything else. A document never moves when its status changes.

A draft is a record at `<groma-root>/drafts/<draft-id>.md`:

```markdown
---
type: Draft
title: Checkout v2
groma:
  id: checkout-v2
---

Customers pay with a saved card.
```

The file name is its immutable lowercase kebab-case ID and the body prose is
the outcome. Concepts that belong to the draft carry `groma.draft: checkout-v2`;
a drafted concept has `status: draft`, and a stable concept may carry the tag
too when the draft touches it. A draft with no `status: draft` concept left is
complete, and its record remains.

groma.md does not invent `generated`, `verified`, source provenance, or other
human trust claims.

## Files and containment

Every C4 concept uses its canonical ownership path:

```text
actors/<actor-id>.md
externals/<system-id>.md
systems/<system-id>/system.md
systems/<system-id>/containers/<container-id>/container.md
systems/<system-id>/containers/<container-id>/components/<component-id>.md
systems/<system-id>/components/<component-id>.md
```

The path makes the architecture easy to browse and says which systems are
external, but `groma.id` and `groma.parent` are authoritative for identity and
containment. Every ID is unique in the tree and every parent must resolve. A
drafted concept may name a stable parent. An external system has no
containers.

| Type | Parent |
| --- | --- |
| `C4 Actor` | none |
| `C4 System` | none |
| `C4 Container` | a `C4 System` under `systems/` |
| `C4 Component` | a `C4 Container`, or its internal `C4 System` when the container is unidentified |

A component stored directly under its system has incomplete placement. This is
a groma.md application-profile rule, not another C4 containment level. Its Markdown
still carries its responsibility and source links. groma.md draws these components
in one **Unidentified container** group within that system. The group is derived
for display and is never stored as a container or treated as an application
boundary. Its detail panel explains the missing container.

## Concept frontmatter

Each C4 concept has these standard top-level fields:

| Field | Required | Meaning |
| --- | --- | --- |
| `type` | yes | Exactly `C4 Actor`, `C4 System`, `C4 Container`, or `C4 Component`. |
| `title` | yes | The readable concept name. |
| `description` | no | A concise standard OKF description. |
| `tags` | no | The standard OKF list of short strings that name cross-cutting categories. |
| `status` | yes | `draft` for a concept that does not exist yet; `stable` otherwise. |

groma.md-only fields live together under `groma`:

| Field | Required | Meaning |
| --- | --- | --- |
| `id` | yes | Stable lowercase kebab-case ID, unique in the tree. |
| `parent` | for containers and components | ID of the containing system or container. |
| `draft` | no | ID of the draft record this concept belongs to or that touches it. |
| `technology` | no | Free text naming implementation technology, comma-separated. |
| `color` | no | One named map color: `red`, `orange`, `yellow`, `blue`, `violet`, or `pink`. |
| `icon` | no | One named map icon, such as `database`; see [Icons](#icons). |
| `code` | no | Scanner-produced source evidence. |

Architecture IDs use lowercase Unicode words separated by hyphens. Each word
starts with a letter or digit and keeps its letters, digits, and combining
marks. For example, `Студент` receives `студент` and `Вход студента` receives
`вход-студента`. Elements, parent references, draft records, the `groma.draft`
field, and flows use this same Groma naming rule; it does not add an OKF or C4
requirement.

There is no `kind` field. The standard `type` carries the C4 type, and the
body does not repeat `title` as a level-one heading.

groma.md owns only the fields above. It tolerates other OKF metadata and unknown
concept types inside an explicitly marked groma.md package, and preserves
unowned fields during supported edits. It remains strict about its own nested
fields, C4 containment, and relationships. This preservation makes a groma.md
package usable by OKF tooling; it is not a generic OKF import contract.

A [group](#groups) of components is stored in its own record, not in a field
of its members. `groma edit --combine`
folds unique Code references from empty scan records into one component, and
`groma edit --parent` moves an empty scanned component without changing its
identity. Scanning can also complete a component's unidentified placement: positive
execution evidence can move it from its system into an application container.
This preserves its ID, source ownership and authored meaning, and rebases incoming
and outgoing Markdown links. An existing container assignment is never replaced.

The architecture model owns IDs. groma.md assigns an ID when it drafts a concept
or when a scan finds a previously unknown source. A drafted concept keeps its
ID and its file when accepted. Architecture IDs live in Markdown, not
application source.

For new scanned components, core compares the complete batch of unowned
source files before allocating IDs. It starts with the file stem, then the
container ID and stem. Collisions add source parent directories, nearest
first, before the container ID and stem. For example, repeated build files
under a `scanner` container can become `vue-scanner-build` and
`react-scanner-build`. Remaining collisions climb further source parents.
Reserved document names and the command word `relation`, which the CLI reads
as an address, follow the same qualification rule.

If all readable context still collides after lowercase kebab normalization,
core appends the first eight hexadecimal digits of SHA-256 of the exact
repository-relative source path, including its extension before normalization.
Matching hash prefixes grow until the IDs are unique. Contents and scanner
identity do not enter that hash. Titles use the readable name without the
hash. An already owned source keeps its stored ID on later scans, including
when another scanner reports it.

### Tags

`tags` is the OKF field for categories that cut across the hierarchy, such as a
business area, an owning team, or a quality like `legacy`. It is authored
project vocabulary. Groma never derives tags from source and scans keep them.

```markdown
---
type: C4 Container
title: Checkout API
status: stable
tags:
  - payments
  - legacy
groma:
  id: checkout-api
  parent: shop
---
```

Any OKF reader sees the two categories. Groma reads the list on actors, systems,
external systems, containers, and components, and shows it with the concept. A
tag adds no C4 element, parent, or relationship, and it is unrelated to the
`groma.draft` field that links a concept to a draft record. There is no
`groma.tags` field and no separate tag catalog.

`groma edit <id> --tags payments,legacy` replaces the concept's list, and an
empty value removes the field. The web Edit form has the same Tags field. Groma
writes tags without commas, blanks, or repeats, and reads any list of non-empty
strings that another OKF tool wrote.

#### Focusing on tags

The web map can focus on one or more tags. One rule decides what a set of tags
selects, [`selectByTags`](../src/tag-selection.ts):

- An element matches when it carries any of the tags.
- A match takes everything inside it.
- The systems and containers that hold a match are its parents, and stay with it.

For example, system `shop` holds containers `checkout-api`, tagged `payments`,
and `storefront`. Component `cart` in `storefront` is tagged `payments` too, and
component `catalog` is not. Focusing on `payments` gives:

| Part | Result |
| --- | --- |
| `checkout-api` and all its components | Match. |
| `cart` | Match. |
| `shop` and `storefront` | Parents: they stay, because they hold a match. |
| `catalog` | Recedes. |

The map then decides what it draws around those elements
([`IsoMap.focusTags`](../src/viewers/web/iso/painting/map.ts)): a group stays
when one of its members matches, and a relationship stays when both of its ends
match.

Focusing changes emphasis only. Positions, containment and the stored
architecture stay as they are.

#### Exporting a subset

`groma export --include-filter <tags> --exclude-filter <tags>` uses the same
selection to decide what a static export contains. Include keeps the matches and
their context. Exclude then removes its own matches and wins over include.

Continue the example: component `refunds` in `checkout-api` is tagged `internal`.
`--include-filter payments --exclude-filter internal` exports:

| Part | Exported |
| --- | --- |
| `checkout-api` and its other components | Yes. |
| `refunds` | No. Exclude wins, although its container is included. |
| `cart` | Yes. |
| `shop` and `storefront` | Yes, as the parents of exported parts. |
| `catalog` | No. |
| A relationship from `cart` to a component of `checkout-api` | Yes: both ends are exported. |
| A relationship from `catalog` to `cart`, or to `refunds` | No: one end is absent. |
| A flow with a step over an absent relationship | No. |

### Colors

`groma.color` gives a concept one named color so the large parts of a map can be
told apart at a glance. It is Groma presentation metadata: it adds no C4 element,
parent, or relationship, and an ordinary Markdown or OKF reader still has the
title, description, body and links.

```yaml
groma:
  id: checkout-api
  parent: shop
  color: violet
```

The document stores only the name. Every UI theme says what each name looks
like, so one authored color reads well in Light, Dark and Blueprint, and a hex
value is never stored. No name is green, because green marks selection and lit
flows. [`src/colors.ts`](../src/colors.ts) holds the list.

`groma edit <id> --color violet` sets the color of an actor, system, external
system, container, or component, and an empty value removes it. The web details
pane offers the same names as a row of swatches that applies at once. Nothing is
colored automatically, a color is not inherited by what the element contains,
and scans keep it. A [group](#groups) record carries no color.

### Icons

`groma.icon` gives a concept one named icon that says what kind of thing it is,
so a reader finds "the database" or "the web app" on the map without reading
names. Like a color it is Groma presentation metadata: it adds no C4 element,
parent, or relationship, and an ordinary Markdown or OKF reader still has the
title, description, body and links.

```yaml
groma:
  id: order-store
  parent: shop
  icon: database
```

The document stores only the name. The names are generic kinds of software
parts and people, never a vendor or a programming language:

| | Names |
| --- | --- |
| People | `person`, `agent` |
| Applications | `browser`, `mobile`, `desktop`, `terminal` |
| Running parts | `service`, `worker`, `gateway`, `scheduler` |
| Data | `database`, `cache`, `queue`, `storage`, `document`, `search` |
| Other | `repository`, `package`, `cloud`, `lock`, `mail`, `chart`, `board` |

[`src/icons.ts`](../src/icons.ts) holds the list. `groma edit <id> --icon
database` sets the icon of an actor, system, external system, container, or
component, and an empty value removes it. The web details pane offers the same
names as a grid that applies at once. No icon is assigned automatically, an
icon is not inherited by what the element contains, and scans keep it. A
[group](#groups) record carries no icon.

The [web map](viewers/web/index.md) draws each name twice: as a small object
standing beside the element's name in the tilted views, and as a flat glyph in
the 2D view, the hierarchy and the details. Plain terminal output prints the name.

### Code references

`groma.code` is a list. Each entry contains only:

| Field | Required | Meaning |
| --- | --- | --- |
| `scanner` | yes | Scanner that found the reference. |
| `file` | yes | Exact repository-relative source file. |
| `symbol` | no | Relevant symbol or entry point; omitted when the complete file is useful. |

Multiple scanners may contribute references to one element. Code references
appear in details; they are not C4 concepts or another viewer level. Later scans
may refresh supported symbols but preserve curated file membership, unowned
metadata, and authored Markdown. The exact source path has one owner across
scanners. Separate scanner contributions do not create duplicate owners. Core
compares overlapping source-unit declarations to associate explicitly related
files on a fresh scan or attach new unowned members to an existing component.
Conflicting proposals retain established ownership and report a review
diagnostic. These declarations and review messages are temporary evidence, not
stored fields or another architecture level. Core also compares overlapping
operation claims at source locations; conflicting certain providers remain scan
diagnostics and cannot establish a derived relationship. Source offsets and
those conflict details are not stored in Code references.

Raw imports, call graphs, provider alternatives, and inference inputs stay in
memory during scanning. They are not Code-reference metadata. Core saves only
selected interactions in the relationship document. Reloads and exports use
those statements without running the scanner. Runtime footprint counts come
from distinct stored file interactions and are not written into Code references.

## Markdown body

Consecutive prose paragraphs at the start of a C4 concept body form its long
groma.md `overview`. The overview may be empty, which is useful for a concept
created from scan evidence. A named section ends the leading overview.

These level-two sections are supported:

- `## Requirements` states constraints the result must satisfy.
- `## Technology` explains implementation technology in prose.

Other named sections remain authored Markdown. groma.md preserves them when it
edits overview or owned metadata.

## Relationships

Authored and automatically derived outgoing relationships live in the source
C4 element document: a component for a source file, or the named element for
an actor/external-system declaration. They use ordinary Markdown tables and
links inside the existing OKF concept. There is no separate relationship
concept, C4 element, parent, or map level.

For example, a component document may contain:

```markdown
## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [Checkout client](../../../../../../src/checkout-client.ts) | [Payment endpoint](../../../../../../src/payment-endpoint.ts) | Requests payment authorization | HTTPS |
```

An actor document stores its outgoing concept-addressed declarations in the
same table, with links relative to that actor document. Both endpoints remain
explicit even when the source file belongs to the containing component.

Code-to-code declarations require exact repository-relative source files with
known component owners. They never use internal component, container, or
system IDs as endpoints. This includes interactions without imports, such as
an HTTP client and its endpoint. An actor or external-system declaration may
use C4 concept links. Each ordered endpoint pair has one authored row.
`Description` states the interaction; `Technology` states its mechanism or a
required constraint. Both cells are required and non-empty. A stored row may
name a file that currently has no component owner, for example after a detach:
the row stays in its previous document and stays off the map. Once a scan gives
that file an owner, it transfers the row into the new owner document and the
relationship joins the map again. Incoming rows stay with their own source;
their target file links continue to resolve through current ownership. An empty
former owner cannot be removed while it holds these waiting rows; scan first
to place them, then remove the empty component.

`groma add relation <source-file> <target-file> --description <text>
--technology <text>` declares a current interaction. `groma edit relation`
changes its text. The web editor selects the participating source files;
relationship details distinguish derived interactions from authored rows. Editing
a derived interaction creates authored text for that exact endpoint pair.
An actor or external-system declaration accepts its concept IDs instead.

Planned interactions use the same columns under `## Draft relationships`.
`groma draft relation <source-file> <target-file> --description <text>
--technology <text>` creates a planned row. Edits keep its status. `groma accept
relation <source-file> <target-file>` explicitly accepts it; only draft rows
may be removed. This lifecycle is independent of the endpoint statuses.
Finding a source dependency does not accept a draft interaction.

Core writes selected current interactions under `## Derived relationships`,
using the same four columns. The derived Technology cell lists contributing
scanner IDs, separated by commas. This is groma.md application-profile meaning;
ordinary Markdown readers see the source links, interaction and its attribution.
A scan replaces only rows whose contributing scanners all supplied observations.
Rows depending on absent scanners, their endpoint Code references, and authored
sections remain intact. An empty observation set writes nothing. A failed scanner does not start reconciliation. Raw
source dependencies never become rows merely because their endpoints resolve.
The current [inference rules](relationship-inference.md#current-inference-rule)
cover concretely supplied named callbacks and certain HTTP requests; other
interactions may be authored. One derived row states every selected
interaction for its file pair, with statements separated by semicolons.

A current authored row takes precedence over a derived row for the same exact
file pair. Editing a derived row takes authorship of its text. Subsequent scans
may record the underlying derived interaction again, but the map uses the
current authored statement. A draft row stays separate and is never accepted
by a scan. This is authorship precedence, not a claim that the scanner verified
the authored description.

### Ownership and map projection

In groma.md's current profile, each source file has one component owner. This is
an application constraint, not a universal OKF or C4 rule. Many other files
may use it. A scan preserves curated membership and never follows dependencies
to claim ownership. Source ownership does not establish runtime placement.

Core projects file connections through their current owners. Several file
pairs become one directed component connection while retaining their exact
endpoints and individual claims. Connections inside one component add no map self-link. Regrouping preserves
the stored claims and transfers outgoing rows into the surviving source owner; the next scan omits derived interactions whose providers
now have the same owner. Moving or
combining empty components changes this projection while preserving the exact
file endpoints and claim text. Document moves rebase outgoing links.

Relationship placement uses a lookup from each endpoint to its current owner.
A scan groups stored and refreshed rows by their destination document and only
rewrites documents whose relationship claims changed. It preserves authored
rows and rows from unavailable scanners, including temporarily unowned rows.
This ownership rule and the lifecycle sections belong to the Groma application
profile; OKF supplies readable links and C4 supplies the element boundaries.

At container and system levels, an interaction keeps its original statement.
A callback across assigned containers is still a source-code callback; it does
not establish a network request or inter-process boundary. Core does not invent
transitive edges or turn aggregated paths into executable workflows.

For two-way derived interactions between components, the map points toward
the direction with more distinct supporting file pairs. Equal counts keep
both directions visible. Details retain both directions and their counts.
Authored interactions keep their declared direction. This display rule does
not change the underlying interaction claims.

An ordinary Markdown reader can follow the file and concept links and read
each authored interaction. groma.md interprets ownership, authorship, and
the relationship sections to project the map. Source inventory and inferred
placement are not proof of cohesive C4 responsibilities; curated ownership
provides those boundaries.

## Flows

A relationship may carry a derived or authored interaction. A flow supplies
the scenario meaning and order; the existence of an interaction alone does
not establish execution order. A flow uses an
explicit, ordered subset of the directed relationships. It is an OKF concept with type `Groma Flow`, stored at
`<groma-root>/flows/<id>.md`. It is not a C4 element and has no parent,
Code references, footprint, or routes of its own.

```markdown
---
type: Groma Flow
title: Place an order
description: Record a customer's order.
groma:
  id: place-order
---

The customer submits an order. Ordering checks the payment before recording it.

## Steps

| From | To | Action |
| --- | --- | --- |
| [Customer](../actors/customer.md) | [Ordering][ordering] | Submit the order |
| [Ordering][ordering] | [Payments][payments] | Authorize this payment |

[ordering]: ../systems/shop/containers/api/components/ordering.md
[payments]: ../systems/shop/containers/api/components/payments.md
```

`title`, a unique stable `groma.id`, overview prose, and the Steps table are
required. `description` is optional. From and To accept normal inline or
reference-style Markdown links to C4 documents. Each row must resolve exactly
one existing directed relationship in the loaded revision. Missing endpoints,
missing relationships, and ambiguous endpoint pairs are errors.

Table order is execution order. A relationship may occur more than once.
Action explains what happens in this scenario; the relationship remains the
owner of the general collaboration and technology. Core never follows other
outgoing connections to extend a flow.

`groma add flow <title> --overview <prose> --steps <markdown-table>` authors a
record. The table may include Markdown link definitions. `groma edit <flow-id>`
accepts `--title`, `--description`, `--overview`, and `--steps`;
`groma remove <flow-id>` removes it. A referenced relationship or endpoint
cannot be removed while a flow still uses it. Live, historical, and static
viewers all read these same records.

## Groups

A group names components that belong together inside one container, such as
`Map painting` or `Scan lifecycle`. People and agents create groups; scanners
never do, and scans keep them. A group is an OKF concept with type
`Groma Group`, stored at `<groma-root>/groups/<id>.md`. It is not a C4 element
and not another containment level: it never becomes a parent, owns no Code
references, and is never a relationship end. The maps draw it as a zone around
its members.

```markdown
---
type: Groma Group
title: Order checks
description: What runs before an order is placed.
groma:
  id: api-order-checks
---

Both checks must pass before Ordering records an order.

## Members

- [stock](../systems/shop/containers/api/components/stock.md)
- [fraud-check](../systems/shop/containers/api/components/fraud-check.md)
```

`title` and a unique stable `groma.id` are required. `description` and the
overview prose are optional. The Members section holds one bullet list and
nothing else, and each bullet is one normal Markdown link to a component
document. An ordinary Markdown or OKF reader sees a titled page that links to
its members. groma.md reads those links as membership and applies these rules:

| Rule | Reason |
| --- | --- |
| Every member is a component: never an actor, a system, a container, or another group. | A zone is drawn around buildings on a container. |
| All members have the same container. A component whose container is unidentified cannot be a member. | One group draws one zone. |
| At most one group lists a component. | Zones do not overlap. |

A group that breaks a rule, or links to a document that does not exist, stops
the architecture from loading with an error that names the group file. A group
without members is valid and draws no zone.

The record is the only place that stores membership; a component document says
nothing about its group. Core resolves the links
([`resolveGroups`](../src/group-model.ts)) and gives every view the groups
and, on each member, the ID of its group: a view finds a group's members among
the elements whose `group` is that ID, as it finds children by `parent`.

`groma add group <name> <component-id...>` creates a record and prints its ID:
the container's ID followed by the kebab-case name, so two containers can each
have a group of the same name. `--description` and `--overview` add its
meaning. When the container already has a group with exactly this title, the
components join that group instead, which is how Group as in the web map adds
to an existing group. `groma edit <group-id>` accepts `--title`, `--description`, and
`--overview`. `groma edit <component-id> --group <group-id>` puts a component
in an existing group and takes it out of the group it was in; `--ungroup` only
takes it out. `groma remove <group-id>` deletes the record and leaves its
members in place. `groma view <group-id>` prints the record.

Other commands keep every group loadable:

| Command | Effect on groups |
| --- | --- |
| `groma remove <component-id>` | The component leaves its group. |
| `groma edit <id> --id <new-id>` | Member links follow the renamed component or container. |
| `groma edit <container-id> --parent <system-id>` | Member links follow the components that move with their container. |
| `groma edit <component-id> --parent <container-id>` | The component leaves its group, which stays in its container. |
| `groma edit <id> --combine <component-id>` | Refused while a group lists the absorbed component. |

The group commands live in [`src/group.ts`](../src/group.ts). The effects in
the table live where each command is implemented: `leavingWrites` in that file
serves removal and moves, and `groupWritesForMoves` in
[`src/curate.ts`](../src/curate.ts) decides between leaving and following.

## Component example

```markdown
---
type: C4 Component
title: Ordering
description: Order lifecycle coordinator
status: stable
groma:
  id: ordering
  parent: commerce-api
  code:
    - scanner: typescript
      file: packages/orders/src/orders-service.ts
      symbol: OrdersService
---

Owns the lifecycle of an order from placement through completion.

## Technology

TypeScript, NestJS, and PostgreSQL.

```

The live [groma.md system](../groma/systems/groma-md/system.md) and
[project record](../groma/project.md) are a complete package example.
