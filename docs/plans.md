# Share architecture plans

A plan shares an intended architecture without source ownership or map layout.
Export the elements you want, then import them in another initialized Groma
project. Imported elements are ghosts under one draft record.

```sh
# In the source repository, select two components.
groma plan export checkout payments --to plans/payment-plan

# In the destination repository, use its existing application container.
groma plan import ../source/plans/payment-plan --parent application
```

On the live browser map, select several components and use **Export as plan**
beside **Group as** and **Combine into**. Enter a new directory relative to the
repository; Groma writes the same bundle as the CLI.

The directory name becomes the plan title. Export requires a new directory.
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
groma:
  parents:
    - source-application
---

Architecture to implement.
```

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
Import computes their destination paths from the destination parent, keeps
IDs and overviews, and adds `groma.draft: payment-plan`. It also creates
`drafts/payment-plan.md`. Relationships remain draft rows with concept links.

A colliding element, flow or draft ID, or a missing parent, rejects the whole
import before any architecture document is written. Import never renames IDs.

Implement the imported responsibilities in source, run `groma scan`, and use
`groma accept <id>` for each matched ghost. The existing scanner matching rules
apply; import does not invent source paths or force a match. Scanning and
accepting elements do not accept their planned relationships.

The [Markdown contract](component-markdown.md#plan-bundles) defines the format.
