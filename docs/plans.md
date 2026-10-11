# Share architecture plans

A plan shares an intended architecture without source ownership or map layout.
Export the elements you want, then import them in another initialized Groma
project. Imported systems, containers and components arrive as ghosts. People
and external systems arrive as stable declarations, because those are declared
and never drafted. One draft record tags everything a plan brought in.

```sh
# In the source repository, select two components.
groma plan export checkout payments --to plans/payment-plan

# In the destination repository, use its existing application container.
groma plan import ../source/plans/payment-plan --parent application
```

On the live browser map, select several components and use **Export as plan**
beside **Group as** and **Combine into**. Enter a new directory inside the
repository; Groma writes the same bundle as the CLI and confirms where it went.
The command line may export to a new directory anywhere.

The directory name becomes the plan title. Export refuses a directory that
already exists or lies inside the Groma directory.
The bundle contains an OKF `index.md`, a `plan.md` record, selected element
Markdown files, and flows whose steps stay entirely inside the selection.
Unselected parents are referenced by ID and must already exist at import.
`--parent` replaces these references with an existing destination parent;
normal C4 containment rules still apply. To carry a complete architecture into
an empty initialized project, explicitly select its system and containers as
well as its components.

An example `plan.md`:

```markdown
---
type: Groma Plan
title: payment-plan
---

Architecture to implement.
```

Export writes that body as a placeholder. Replace it with the outcome the plan
is for before you share the bundle: import copies it into the draft record.

The selected `checkout` document remains normal architecture Markdown:

```markdown
---
type: C4 Component
title: Checkout
status: draft
groma:
  id: checkout
  parent: source-application
---

Collects an order and asks Payments to authorize it.

## Draft relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [checkout](checkout.md) | [payments](payments.md) | Requests authorization | HTTPS |
```

Both component documents live together at their source architecture paths
inside the bundle. Their parent is an ID reference, not a copied container.

A plan carries each document's Markdown body as written: the overview with its
formatting and links, and sections such as `## Requirements`. It replaces only
the status, leaves out code ownership, the group and an earlier draft tag, and
rebuilds the relationship sections from the relationships inside the selection.
Import computes the destination paths from the destination parent, keeps IDs
and bodies, and adds `groma.draft: payment-plan`. It also creates
`drafts/payment-plan.md`. Relationships remain draft rows with concept links.

A colliding element, flow or draft ID, or a missing parent, rejects the whole
import before any architecture document is written. Import never renames IDs.

Implement the imported responsibilities in source, run `groma scan`, and use
`groma accept <id>` for each matched ghost. The existing scanner matching rules
apply; import does not invent source paths or force a match.

An imported relationship stays a draft row between its two element IDs.
Scanning and accepting the elements do not change it. Use those IDs to edit,
remove or accept it:

```sh
groma edit relation checkout payments --description "Requests a refund"
groma remove relation checkout payments
groma accept relation checkout payments
```

Accepting needs exactly one current relationship from a source file of the
first component to a source file of the second, which a scan records once the
code exists. The planned description and technology move to that file pair.
With none or more than one, the command says how many it found and the draft
stays as it is. A relationship with a person or an external system needs no
code.

The [Markdown contract](component-markdown.md#plan-bundles) defines the format.
