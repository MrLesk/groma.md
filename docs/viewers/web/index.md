# Web viewer

The web plugin shows groma.md's world in a browser. `groma web` starts it.

If the architecture directory, index, or project record is missing, the local server
shows browser setup for the project name and architecture folder. An existing
folder keeps its location. **Continue** uses the shared initialization operation,
then shows **Set up plugins** with one section per kind:

- While `config.json` lists no work source, **Tasks** comes first with Backlog.md:
  checked and locked when its CLI is installed, or offered with **Install**
  (preselected) when it is missing. It is added to `config.json` and initialized
  after the scanners.
- **Scanners** has one selection row per scanner with detected versions and
  installation state. Detection paths stay in collapsed, searchable details;
  declarations without a version do not create a warning. Scanner problems appear
  before ordinary choices.

**Install & scan** installs the selected additions; with nothing to install, the
action is **Scan project**. Both open the map at the same address after preparation.

Opening an initialized project first checks the plugins `config.json` lists.
When a configured plugin is missing on this computer, the startup card shows
**Restore plugins** with one row per missing plugin and two choices:

- **Restore** installs the missing plugins one at a time and opens the map when
  all are present.
- **Proceed without them** opens the map read-only: no scan or source watch runs,
  the header says **Read-only: plugins missing**, and the map offers no write
  controls or plugin settings, as for a historical view.

[`startup/restore.ts`](../../../src/viewers/web/startup/restore.ts) presents the
rows; [`plugins/management.ts`](../../../src/plugins/management.ts) decides what is
missing and restores it. See [Project configuration](../../config.md).

While scanning, each active scanner has its own row and activity indicator so
parallel work stays visible. An initialized project runs one scan, then builds its
first map once from the reconciled architecture before opening. The live process
starts the same watch as `groma scan --watch` before scanning, so source edits
during startup are retained. [`server.ts`](../../../src/viewers/web/server.ts)
owns temporary startup state and streams updates through `/startup-events`;
[`startup/page.ts`](../../../src/viewers/web/startup/page.ts) and
[`startup/progress.ts`](../../../src/viewers/web/startup/progress.ts) present the
forms and live progress.

If startup reports an occupied port, an interactive terminal asks whether to try
the next available port above the requested port (`4748`, `4749`, and onward for
the default `4747`). Without an interactive terminal, it exits with an instruction
to run `groma web --port 0` for an available port.

The shared viewer rules live in [Viewers](../index.md).

## Static publication

`groma export <directory>` reads stored architecture and writes the web view as
static HTML, JavaScript, snapshot, and generation files. The read-only page
includes the project profile, architecture, flows, and source inspection. Every
export excludes tasks, task pins, task search results, and editing controls. It
does not contact Git, Backlog, or a groma.md server.

The export is a public disclosure boundary: every project description, diff, and
source file copied into the output can be read by anyone who can access the static
host. Publish the directory only through a static host whose access rules match
the project.

Export does not run a scanner; run `groma scan` first when source changes need to
be reflected in the stored architecture. By default, export captures the working
tree, including uncommitted source changes.

Use an explicit commit to capture its architecture, source, and commit metadata
regardless of the current checkout:

```sh
groma export ./site --revision HEAD
```

Use two explicit commits to export a comparison:

```sh
groma export ./site --from "$BASE_SHA" --revision "$HEAD_SHA"
```

The site opens the comparison from the older commit to the newer one, whichever
order `--from` and `--revision` name. Closing the comparison opens the newer
commit, and the revision picker offers the two exported commits.
`web/export.ts` packages the shared history comparison, map layout, source
contents, and outlines; `web/data.ts` selects those bundled views through the
same read boundary used by the live viewer.

### Social previews

Export also writes `cover-light.png`, `cover-dark.png`, and `cover-blueprint.png`
at 1200x630 pixels. Each cover uses the actual map, the graph-paper grid, and a
footer with the project title and groma.md attribution.

Set the public directory URL when publishing so the initial HTML contains
absolute Open Graph page and image URLs:

```sh
groma export ./site/architecture/blueprint --url https://example.com/architecture/blueprint/
```

Without `--url`, the export remains portable with a relative light-cover link and
no canonical Open Graph URL. `groma web` emits metadata using the request URL and
serves the same PNGs, generated on the first image request and refreshed after
architecture changes, using bundled `resvg` WebAssembly and DejaVu fonts.
The `web/sharing` domain (`cover.ts`, `images.ts`, `metadata.ts`) owns cover and
Open Graph generation for both export and live delivery.

## Layout and panels

### Empty states and first-scan curation

- An empty world shows a welcome card with the project name and **Set up scanners**
  (which opens the Plugins settings dialog in live web delivery).
- A world with existing architecture but no components shows a dismissible notice
  pointing to `groma scanner setup`.
- When components exist but no element has a description or overview, the
  dismissible **First scan** notice offers **Copy prompt**, which copies an agent
  prompt pointing to `groma agent-instructions`. It disappears once any element
  has a description or overview.

### In-place editing

On a live current map, **Edit** switches the selected element or relationship
from reading to a form:

- **Element fields:** `title`, `description`, `overview`, `technology`, and `parent`
  (where the component can move). Empty optional values clear the field.
- **Relationship fields:** `description` and `technology`.
- **Draft acceptance and removal:** A matched draft element or a draft relationship
  exposes **Accept** (`groma accept`). **Remove** appears only where `groma remove`
  would succeed (an unreferenced actor, external system, ghost, or draft
  relationship).
- **Conflict checking:** Element, relationship, and project forms submit changed
  fields together with their original values. If another edit changed one of those
  fields concurrently, **Save** preserves the unsaved input and shows the original,
  current, and proposed values without writing.
- **Multi-select actions:** Shift-clicking sibling components offers **Group as**
  and **Combine into**.

Historical and exported maps are read-only and expose no write controls.

### Header, search, and controls

The top header groups the groma.md lockup, project title from `project.md`,
system/container/component counts, the revision picker, **Search**, and the view
controls (**Fit**, `-`, zoom readout, `+`, **Settings**, **Help**, and **Info**):

- **Projection bar:** **Iso**, **2D**, and **Layers** sit in a floating bar at the
  top center of the map (`F2` toggles **Layers**; `F1` hides the HUD chrome for a
  map-only view; `F3` toggles the performance/debug panel).
- **C4 filter bar:** The floating icon bar beside the hierarchy toggles **Actors**,
  **Systems**, **Containers**, **Components**, and **Relationships** on the map.
  Choices persist in `localStorage` and URL parameters.
- **Search (`/` or `Cmd/Ctrl+K`):** Ranks architecture elements together with task
  IDs and titles from the configured work source. `Up`/`Down` preview matches;
  `Enter` opens the selected element or task; `Escape` restores the prior selection
  and camera.
- **Themes:** **Settings -> Theme** offers **Auto**, **Light**, **Dark**, and
  **Blueprint**.

### Time machine and revision comparison

The revision picker in the header starts at **Current working tree** and searches
current-branch commits by hash, subject, or body. Selecting a commit loads the
architecture and source measurements from that Git snapshot in read-only mode.

Choosing **or compare 2 revisions** opens a side-by-side `A vs. B` revision box
(`web/revision/view.ts` and `web/revision/control.ts`), always ordered from the
older revision (`A`) to the newer one (`B`):

- Components are matched by their stable IDs and marked **Added**, **Modified**,
  or **Removed** based on their own architecture or owned-source changes;
  relationships carry independent change statuses. Unchanged elements recede on
  the map so changes stand out.
- The hierarchy opens on **Changes** (`web/comparison/tree.ts`), listing changed
  components under their systems and containers followed by changed relationships,
  while the bottom changes bar (`web/comparison/control.ts`) filters by status and
  steps through changes with `J`/`K`.
- Comparison details (`web/comparison/details.ts`) highlight prose changes in
  **What it does** and open unified file diffs (`web/source/diff-view.ts`) in
  **How it's built**.

### Hierarchy, details, and flows

The collapsible left hierarchy pane contains **Actors** (with each actor's
authored flows nested beneath it) and **Structure** (internal systems, containers,
and components, followed by **External systems**). Clicking a flow row checks it,
highlights its ordered route path with animated directional dashes on the map, and
opens the flow reader in the right details pane. Multiple flows can stay checked
at once.

The right details pane opens when an element, relationship, flow, or task is
selected (and can be expanded for wider source and diff reading):

- **What it does:** Shows the element's description, overview, peer
  **Relationships** (grouped by ordered endpoint pair, expandable when multiple
  file relationships share a pair), **Flows** touching the element, and direct
  children. Selecting a component highlights its directly connected neighbor
  components on the map.
- **How it's built:** Shows declared `groma.technology` chips and the **Code**
  source outline (files and top-level functions, types, constructors, and methods
  per the [source outline contract](../../scanners/creating-a-plugin.md#source-outline)).
  Clicking a file or declaration opens the read-only source viewer at that line.
  Methods with duplicate-logic findings from `groma lint` show a **possible
  duplicates** warning that expands the matching operations and their `file:line`
  locations.
- **Tasks:** Appears on a component when at least one Backlog task touches it
  through a modified file or reference, grouped into **To do**, **In progress**,
  and **Done**.

## Map geometry and visual encoding

Core composes one shared `SheetScene` in grid cells (islands, container slabs,
component buildings, group zones, and orthogonal channel routes), and the browser
projects that fixed scene into SVG for **Iso**, **2D**, or **Layers**:

- **Islands and slabs:** Actors stand on the west island, internal systems in the
  center, and external systems on the east island. Inside each system, container
  slabs and component buildings are packed and relaxed so connected peers sit near
  each other with straight routes and clear channels.
- **Building dimensions:** Component file counts map to 1-5 stacked floors;
  lines of code map to floor height (`1-4` units); incoming and outgoing file
  interactions determine width and depth; and the dominant file extension selects
  the facade window pattern.
- **Origin and state:** Observed elements and current relationships use solid
  lines; draft ghosts and draft relationships use dashed lines.

The browser keeps the viewport-sized background grid outside the moving camera
group so pan, zoom, trackpad inertia, and smooth transitions between **Iso**,
**2D**, and **Layers** do not repaint the grid together with the scene.

## Live work and Backlog pins

When `config.json` enables the Backlog work source, mapped tasks appear as pins
on the element each task touched last (the owner of its newest modified file, or
its first referenced element) and in the bottom-center **Backlog.md Tasks** bar:

- Each pin shows the assignee's badge (or a Backlog mark when unassigned), a
  progress ring for acceptance criteria, and the task ID.
- The bottom bar filters pins and task chips by configured workflow status
  (default and in-progress statuses start shown; the terminal status starts
  hidden).
- Clicking a pin or chip activates the task, highlights every element and outgoing
  route the task touches, and loads the full Backlog task record (including
  acceptance criteria, plan, references, and modified-file diffs) in the details
  pane. Multiple tasks can stay active together.

## URLs, iframe embedding, and live watches

The URL query string tracks the current view so any state can be shared by link:

- `from=<commit>` and `revision=<commit>` select history snapshots or comparisons.
- `actor=<id>`, `system=<id>`, `container=<id>`, `component=<id>`,
  `relationship=<source>/<target>`, `flow=<id>`, `step=<number>`, and `task=<id>`
  restore selections.
- `tab=how|tasks`, `file=<path>`, and `line=<number>` open the corresponding
  details tab and source location.
- `view=iso|2d|layers`, `hide=...`, `theme=auto|light|dark|blueprint`, `hud=off`,
  and `inset=<pixels>` configure projection and chrome.

An embedding page (such as a slide deck or docs site) can drive an iframe without
reloading by posting `{ gromaView: '?component=<id>&tab=how' }` to the iframe
after receiving `{ gromaReady: true }`.

In live mode (`groma web`), watched source changes trigger the matching scanners
and smoothly blend the map into the updated placement without a page reload;
architecture Markdown edits and Backlog task updates refresh the world and work
pins over the same event stream.

## Settings and project review

- **Settings -> Plugins** (live web only) groups installed scanners, missing team
  selections, and detected recommendations (`groma scanner discover`), allowing
  you to install, restore, update, remove, or retry scanners without restarting
  `groma web`. See [Select scanners and check project readiness](../../scanners/setup.md).
- **Project review** lists duplicate-logic findings from scanner token evidence
  so you can compare similar operations side by side and navigate to their owning
  components on the map.
