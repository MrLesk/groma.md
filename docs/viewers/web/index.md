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

The server listens on this computer only. A project can set another host with
[`webHost` in `config.json`](../../config.md#web-host); `groma web` then warns at
every start that the map is served without sign-in.

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

### Filtered exports

`--include-filter` and `--exclude-filter` take comma-separated
[OKF tags](../../component-markdown.md#tags) and export the part of the
architecture meant for one audience:

```sh
groma export ./site --include-filter payments --exclude-filter internal
```

- `--include-filter` keeps what the tags select, with the parents that hold it.
  Without it the export starts from the whole architecture.
- `--exclude-filter` removes what its tags select, and wins when both filters
  name the same element.
- A relationship is exported when both of its ends are. A flow is exported
  when all of its steps are and it carries no excluded tag. A group is exported
  when one of its members is, so a group with an excluded tag goes with its members.

An excluded element is absent, not dimmed: the map is laid out for the subset,
and the element's descriptions and source files are not written to the output.
A filter that leaves no element fails instead of writing an empty site. So does
a filter that names a tag nothing carries: the tag is most likely mistyped, and
a mistyped exclude would publish what it was meant to leave out.
The [worked example](../../component-markdown.md#exporting-a-subset) shows the
rule, which is `subsetByTags` in
[`src/tag-selection.ts`](../../../src/tag-selection.ts). Exporting never changes
the stored architecture.

### Social previews

Export also writes one `cover-<theme id>.png` per enabled theme, such as
`cover-light.png`, at 1200x630 pixels. Each cover uses the actual map, the graph-paper grid, and a
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

### Reading and editing

One rule decides where a write lives in the web map:

- **Reading never writes.** Whatever a person clicks or types while reading the
  map or a pane only selects, navigates, or changes the view: selection, lit
  flows, tag focus, filters, theme, and camera. That state lives in the URL or
  the browser, never in the architecture.
- **A pane writes only from a view the person opens.** On a live current map a
  reading pane holds write entries in its header: buttons that open such a view
  and store nothing themselves. It holds no other control that writes and no
  input.
- **Every write is approved the same way.** A write view holds one write. It
  shows what the write needs, its fields or, for a write that needs none, one
  line that says what it will do. It ends with the approval bar at the bottom
  of the pane: **Cancel**, then the button that approves the write. Only that
  button writes, once, and returns the pane to reading; Enter in a field
  presses it. Cancel and Escape return to reading and leave the stored data
  alone. While the write is in flight the view waits, and a failed write leaves
  the view as it was with its message in the bar. No write has a layout or an
  approval step of its own. The dialogs that write (Add, a draft or a group
  drawn on the map, a drafted relationship, the project editor) end with the
  same approval bar.
- **Unsaved input keeps the selection.** While a write view holds input that
  is not stored, nothing else can be selected: a click on the map, in the
  hierarchy, on a task, a flow or a search result, and the pane's close button
  change nothing, and the view asks for the changes to be saved or cancelled
  first. Cancel and Escape in the view drop them. The view answers this
  through `mayLeaveWriteView` in
  [`organisms/write-view.ts`](../../../src/viewers/web/organisms/write-view.ts).
  Whoever would show something else in the pane asks it first: every function
  of `render.ts` that changes the selection for a person's gesture, and the
  code reader before it opens a file.
- **The approving button says Save.** It says something else only where
  another word tells better what happens: **Add**, **Accept**, **Remove**,
  **Combine**, and **Create group**.
- **A record has one write entry, Edit.** It opens the Edit view of the
  selected element, relationship, group, or flow: every field a person can set
  on the record in the web map, and nowhere else can they change. Picking and
  typing store nothing.
  **Save** sends the changed fields as one `groma edit`.
- **A record's other writes are entries of its Edit view.** **Accept**,
  **Remove** and, for a container, **Add component** stand above the fields. Each opens its own write view in place of
  the Edit view. They act on the stored record: while the fields hold unsaved
  changes they do not open and ask for the changes to be saved or cancelled
  first.
- **Several selected elements share one Edit view.** It offers Tags, Color and
  Icon. A selection made entirely of components also offers **Group** and **Combine**.

| Write | Entry | The view shows | Approving button |
|---|---|---|---|
| Edit an element or relationship | Edit, in its pane | the fields | Save |
| Add a virtual component | Add component, in the container's Edit view | Name, Description and Overview | Add |
| Edit a group or flow | Edit, in its pane | Title, Description, Overview and Tags | Save |
| Edit several elements | Edit, in the selection pane | Tags, Color and Icon | Save |
| Accept a draft | Accept, in the Edit view | one question | Accept |
| Remove an element, group, draft relationship, or current relationship with a virtual component | Remove, in its Edit view | one question | Remove |
| Group components | Group, in the pane of several components | a field for the group name | Create group |
| Combine components | Combine, in the pane of several components | a list to pick the component that stays | Combine |

Every write of a pane is one function in
[`organisms/commands.ts`](../../../src/viewers/web/organisms/commands.ts) that
only describes it: the label of its entry, what its approving button says, its
fields or question, and the writer it calls.
[`organisms/write-view.ts`](../../../src/viewers/web/organisms/write-view.ts)
paints every one of them, so a new write cannot bring its own controls: it is
one more function in `commands.ts`, added to the entries of the pane or of the
Edit view that offers it. **Add component** resolves to the new component's
ID, and the pane then selects that component; the camera stays where it is. Every form that writes, in a pane or a dialog, is a
write form: one atom,
[`atoms/write-form.ts`](../../../src/viewers/web/atoms/write-form.ts), gives
its fields one look (the class `write-form`: a small label over its control)
and builds its approval bar, which holds Cancel and the approving button, runs
one write at a time, and shows a failed write's message. A form that writes
styles no field and builds no approval button of its own. A new editable field
is one entry in its Edit view's field list. For an element this is `elementFields` in
[`organisms/details.ts`](../../../src/viewers/web/organisms/details.ts). For a group
or flow it is `wordingAndTagFields` in [`organisms/commands.ts`](../../../src/viewers/web/organisms/commands.ts). Put a
field that several elements can share in `sharedElementFields`; the core's
`fieldsOfSeveralElements` in [`src/edit.ts`](../../../src/edit.ts) decides which fields
several elements take. The
code that paints what a person reads receives no write hook: `paintDetails`
takes what the pane reads and the write hooks
([`PaneWrites`](../../../src/viewers/web/organisms/writes.ts)) as two arguments,
and hands the hooks only to the function that paints the Edit entry.

The plugin source form of Settings (**Add plugin** and **Choose version**) is a
write form as well: the same label, field and approval bar. The Plugins screen
runs its write the way it runs every plugin action, so the form closes when its
button is pressed and a failed action shows above the plugin list.

- **Element fields:** `title`, `description`, `overview`, `technology`, `parent`
  (where the component can move), tags, `color`, and `icon`. Empty optional
  values clear the field. The Tags field is one box that holds the tags as
  chips and the text being typed: Enter or a comma turns the typed text into
  a chip, Backspace in the empty text takes the last chip off, and the × on a
  chip takes that one off. The tags already in use are offered under the box,
  narrowed by what is typed. Save sends the tags added and the tags removed
  (`addTags`, `removeTags`), not the list. The Color field offers no color and
  each named color; the Icon field offers no icon and each named icon.
- **Relationship fields:** `description` and `technology`.
- **Flow steps** are edited with `groma edit <flow-id> --steps`.
- **Acceptance and removal:** The Edit view of a matched draft element or
  a draft relationship offers **Accept** (`groma accept`). **Remove** is offered
  only where `groma remove` would succeed: an unreferenced actor, external
  system, ghost or virtual component, a group, and a draft relationship or a
  current relationship with a virtual component that no flow uses. Each asks in its own view and
  writes when its approving button is pressed. Removing a group leaves its members in place.
- **Conflict checking:** A single record's form submits changed values with
  their original values. Tag additions and removals merge with the current tags.
  If another edit changed one of the conflict-checked fields concurrently,
  **Save** preserves the unsaved input and shows the original,
  current, and proposed values without writing.
- **Several selected elements:** Shift-clicking elements selects them together,
  and the pane lists them in place of one element's details, each component
  with the group it is in
  ([`organisms/selection-details.ts`](../../../src/viewers/web/organisms/selection-details.ts)).
  The map gives every selected component the focus look and softly accents the
  components one hop from any of them. A click on a listed element selects it
  alone. A shift-click drops it from the selection. On a live current map,
  **Edit** offers Tags, Color and Icon. A partial tag chip shows how many
  elements carry it. Press its name to add it to all, or × to remove it from
  all. A shared color or icon starts selected. A mixed field starts with no
  choice. Picks preview on every selected element. **Save** applies the changes
  to all in one edit, without checking opening values. When every selected
  element is a component the pane also offers **Group** (name them as one group, `groma add
  group`) and **Combine** (fold them into the one the person picks, `groma edit
  --combine`). Changing the selection returns the pane to reading; an open
  view that holds unsaved input keeps the selection instead.

Historical and exported maps are read-only and expose no write controls.

### Header, search, and controls

The top header groups the groma.md lockup, project title from `project.md`,
system/container/component counts, the revision picker, **Search**, and the view
controls (**Fit**, `-`, zoom readout, `+`, **Settings**, **Help**, and **Info**):

- **Iso**, **2D**, and **Layers** sit in the projection bar at the top left of
  the map, above the C4 filter. `F2` toggles **Layers**, `F1` hides the controls
  for a map-only view, and `F3` toggles the performance/debug panel.
- **C4 filter bar:** The floating icon bar beside the hierarchy toggles **Actors**,
  **Systems**, **Containers**, **Components**, and **Relationships** on the map.
  Choices persist in `localStorage` and URL parameters.
- **Tags** appears beside the view switch when an element, group, or flow carries
  a tag. Open it with a click or `T`. The list shows tags alphabetically and
  counts the records that carry each tag directly. Type to find a tag. Point at a row or use ↑ and ↓
  to preview a toggle. Click or press Enter to keep it and frame the matches.
  Escape or a click outside closes the list. Details chips toggle the same focus.
  - With two or more focused tags, **any** matches elements and flows with at
    least one, and **all** requires every tag on the same element or flow.
    A component in a `payments` container that carries `internal` itself matches
    `payments` and `internal`. A `payments` component that is a step end of a
    flow tagged `checkout` matches `payments` and `checkout`.
  - **not** excludes a tag. With just **not internal**, everything outside
    `internal` stays lit. The bar shows a filled chip for each focused tag and
    an outlined chip for each exclusion. Click × to remove one.
  - The map, the hierarchy rows, the actors and flows under **Actors** and the task pins recede together. A group's
    tag lights its members. A flow's tag lights its step ends. A preview leaves
    the camera and URL in place. Clearing the last chip frames the current selection.
    [Tag matching and example](../../component-markdown.md#focusing-on-tags).

  [`tags/tag-focus.ts`](../../../src/viewers/web/tags/tag-focus.ts) owns the focus and the bar, and
  [`tags/tag-list.ts`](../../../src/viewers/web/tags/tag-list.ts) owns the list.
  [`flow/list.ts`](../../../src/viewers/web/flow/list.ts) keeps the flow rows' emphasis across repaints.
- **Colors:** The Edit form of an element has a **Color** field: no color, then
  each [named color](../../component-markdown.md#colors) in the current theme's
  values. The map mixes the saved color into the element's surfaces and outline;
  selection, lit flows, task marks and drafts keep their own look over it, and a
  comparison switches authored colors off because color means change there.
  While the form is open the map shows the picked color on that element; it is
  stored only by **Save**, and stays on the map from the pick until the saved
  map arrives
  ([`editing/appearance-preview.ts`](../../../src/viewers/web/editing/appearance-preview.ts)).
- **Icons:** The Edit form of an element has an **Icon** field: no icon, then
  each [named icon](../../component-markdown.md#icons). The element's name makes
  room for the saved icon, so the map lays itself out again. While the form is
  open the map shows the picked icon in the room the element has now.
  - In the Iso and Layers views the icon is a small object standing before the
    name: on the roof of an actor, external system or component, and on the
    ground before the title of a system or container. Objects are built from
    the map's own boxes and cylinders, so they turn with the map, take the
    element's authored color and follow selection.
  - In the 2D view the object gives way to the icon's flat glyph, which also
    marks the element's row in the hierarchy and its title in the details.
  - The icon before a system's or container's title is a landmark: it never
    gets smaller than a readable size on screen, so a zoomed-out map still
    shows what its large parts are. An icon on a roof shrinks with the map
    and fades out when it would be a smudge; its inner lines fade out first.
  - [`icons/objects.ts`](../../../src/viewers/web/icons/objects.ts) holds the
    objects, [`icons/glyphs.ts`](../../../src/viewers/web/icons/glyphs.ts) the
    glyphs, and [`iso/painting/icons.ts`](../../../src/viewers/web/iso/painting/icons.ts)
    draws both; [`iso/painting/icon-camera.ts`](../../../src/viewers/web/iso/painting/icon-camera.ts)
    holds the rules by which an icon follows the camera. Adding an icon means
    adding its name to [`src/icons.ts`](../../../src/icons.ts), one object, one
    glyph, and its name in the [contract's table](../../component-markdown.md#icons).
- **Search (`/` or `Cmd/Ctrl+K`):** Ranks architecture elements and stored groups
  together with task IDs and titles from the configured work source. A group is
  found by its title or id and is listed with the path of its members' container.
  `Up`/`Down` preview matches; `Enter` opens the selected element, group or task;
  `Escape` restores the prior selection and camera.
- **Themes:** **Settings -> Theme** offers **Auto** and the
  [themes `config.json` enables](../../config.md#themes): the bundled **Light**,
  **Dark** and **Blueprint** unless the project lists its own. **Auto** follows
  the system appearance.

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
at once. When a flow carries tags, its reader shows a **Tags** row after the
description and overview
([`flow/reader.ts`](../../../src/viewers/web/flow/reader.ts)). Press a tag to toggle the map's focus.

Click anywhere on a group's zone to select the group alone; a building in the zone still
selects its component. The group's pane shows the description, overview, tags, and links to
its members. Click a member to select that component. The pane of a component in a group
names the group, and that name selects the group.
Opening a group link frames its members. A group without members draws no zone; its link or its search result opens it
([`organisms/group-details.ts`](../../../src/viewers/web/organisms/group-details.ts)).

The right details pane opens when an element, relationship, group, flow, or task is
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
- **Virtual components:** A stable component without a source file stands on
  its container as a flat plate, lower than any building. Its details pane
  and search results say **Component · virtual**.
- **Origin and state:** Observed elements and current relationships use solid
  lines, as do virtual components. Draft ghosts and draft relationships use dashed lines.

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
- `actor=<id>`, `system=<id>`, `container=<id>`, `component=<id>`, `group=<id>`,
  `relationship=<source>/<target>`, `flow=<id>`, `step=<number>`, and `task=<id>`
  restore selections.
- `tab=how|tasks`, `file=<path>`, and `line=<number>` open the corresponding
  details tab and source location.
- `tag=<tag>` focuses a tag. Repeat it for more tags. The default is **any**.
- `match=all` requires every focused tag.
- `not=<tag>` excludes a tag. Repeat it for more exclusions. Opening the link
  frames the matches. Tags absent from this architecture are ignored.
- `view=iso|2d|layers`, `hide=...`, `theme=auto|<theme id>`, `hud=off`, and
  `inset=<pixels>` configure projection and chrome. A theme id the project does
  not enable is ignored, so the link falls back to the saved choice.

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
