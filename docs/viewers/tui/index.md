# Terminal viewer

Run `groma view` to scan the repository and inspect its architecture in a
terminal. If the architecture directory, index, or project record is missing, an
interactive terminal offers initialization and scanner selection before scanning. Plain inspection
instead prints one actionable initialization message and exits.
A successful scan with no components points to `groma scanner setup` for a
coverage review. Source scanning uses the plugins selected for this project. Existing architecture stays navigable, and watched
source changes update the map. Startup failures report the actual issue without
a stack trace.
The screen has a header, a hierarchy pane, a map, a details pane, and
a footer. Panes reserve their columns and never cover the map. They start folded
by width so the map, which already draws the hierarchy, keeps the room: details
open from 140 columns and the hierarchy joins from 180. `t` opens and focuses
the hierarchy; `d` opens and focuses details. Pressing the focused pane's key
again folds it and returns to the map. Live resizing folds an inactive pane when needed
to keep forty map columns. An explicitly opened pane receives keys; the other
pane folds if both do not fit. Inside a container map the header shows the scope path with
the component count.

## Map scopes

The terminal draws the shared sheet of the web 2D view as a terminal plan. The
plan keeps the sheet's nesting, and neighbours keep their order along the axis
that separates them: side by side, one above the other, or, for diagonal
neighbours, usually by columns. It does not keep proportions: each axis is
stretched only where a name, a frame or the ground between neighbours needs
cells. Zooming in changes what is drawn open, not where neighbours stand.

Root draws the actor, system and external islands. Containers stand collapsed
on their system, each with its name and component count, and island buildings
(actors, external systems, components without a container) stand on their
islands. Enter on a container zooms into it and selects its first component.
That container opens: its groups show their components, while every other
container, island and island building stays collapsed where it stands around it.
Backspace zooms back out with the container selected. Escape returns focus to
the map without changing scope or selection. Both zooms animate: the opened
container grows out of its collapsed box while its neighbours glide outward.

An open container shows every group when it fits the map. Otherwise only the
selected component's group is open; the other groups stand collapsed with their
name and component count, and an arrow onto one opens it on the member nearest
the component the arrow left. The open group follows the selection.

Each component is a box with its name centered on one or two lines; a long name
wraps at its middle space. Source files and declarations remain in How. Draft
buildings and routes use dashed lines. Selection draws heavy in the brand green.

## Camera and selection

A map that fits the map pane stays centred. A larger one follows the selection,
moving only as far as it takes to keep it a few cells from the edges, and never
past the map's edges. Entering a container frames its open group when the pane
holds it. Each depth remembers its own camera. The mouse wheel scrolls the map
(Shift or a sideways wheel scrolls it sideways) and dragging pans it; the moved
camera stays until the selection changes.

At root, each arrow chooses the nearest box that lies in the pressed direction:
a container, an island building, or a system with nothing on it. Inside a
container, each arrow chooses the nearest component or collapsed group that way.
When nothing remains that way, the arrow opens the neighbouring container in that
direction on its first component. Arrows never leave component scope or pane
focus. Proximity uses box rectangles, including a one-row overlap, rather than a
cone between their centres. Stepping a flow reveals its visible destination
without changing selection or map scope.

The hierarchy and `/` search can select architecture outside the current scope.
Selecting a component opens its parent container; selecting any outer element
returns to root. The hierarchy uses `●` actor, `■` system, `▱` container, and `▪`
component glyphs, with `▾` and `▸` disclosure and `▌` for the current item.

## Revision history

`h` gives the hierarchy pane to the current branch commits that changed the
architecture directory, newest first. Each row shows the subject, short hash, and date.
Commits without the current groma.md project profile remain visible as Unsupported
but cannot be opened. `h` or Escape closes the list.

Enter opens a compatible commit as a read-only world. The header names that
revision, source inspection reads from the same commit, and Backlog work is
absent. Escape returns to Current; the live architecture and work watchers then
resume updating the map.

The root architecture is vertically centered in the map canvas when it fits;
larger sheets use the camera to reveal selection.

## Details and flows

The details pane describes the current architecture selection or the open
flow. A focused hierarchy flow row previews its purpose and ordered steps.
While normal element details has focus, Tab cycles through What and How, plus
Tasks for a component. Opening another element always starts on What. What describes responsibility, relationships and authored
Flows; How shows technology and source; Tasks groups related
work by status. In the
How tab the Code section lists each file with its line count and the declarations
under it in authored order; Enter on a declaration opens the source read-only at
that line. A method with possible copies lists the other operations beneath it,
each with its name and file:line; similar copies note that they are not identical. A task record's modified files open their unified diff. Escape returns.
Task records, source and diffs share a reading layout with up to 80 text columns.
An open task keeps that width across focus changes when the hierarchy and a
readable map also fit.
When the terminal cannot fit a readable map beside it, the reader temporarily
takes that space. Closing the reader restores the normal pane layout.

The hierarchy lists authored flows above the architecture tree. Up and Down
browse their meaning without changing the map. Space or Enter opens one flow's
purpose and ordered steps. Opening another replaces it. The map shows only
its authored routes, with unrelated architecture quieter and task emphasis
suppressed. Opening or stepping a flow does not change map scope or geometry.

In the flow reader, Up and Down select steps; Up before the first step returns
to the complete path. `s` advances to the next step from anywhere. Enter
inspects the selected step's To endpoint; Left inspects its From endpoint.
Escape from endpoint inspection returns to the same flow and step. Normal
source inspection still works. `x` clears flow focus. Each endpoint is marked on the box that draws it: its component inside an open container, else the collapsed group or container holding it. Selecting a step does not expand its connections.

## Work focus

The map always shows compact task markers on visible architecture anchors. A reserved
centered, bordered Backlog strip beneath it summarizes current work and points to
`w`. It shows per-status counts when they fit and a total count at narrow widths. Neither treatment
covers or changes the architecture canvas.

`w` gives the hierarchy and details panes to Backlog tasks without changing the
stored architecture selection, map scope, camera, flow, or map layout. Tasks
follow the configured workflow statuses. Group headings show status. Rows show the full title and acceptance progress
as a pie glyph beside the exact completed/total count. To Do comes first and starts folded; In Progress starts
expanded and Done folded. Up and Down browse visible headers and tasks. Left and
Right fold or open a status group; Enter on a header toggles expansion. Folding a
selected task moves the cursor to its header. Enter on a task opens its full record.
The component Tasks tab opens that same record and map highlight. Within a
record, Up and Down move a visible reading cursor through every row, including
long definitions and notes. A file
or architecture reference becomes selectable when its row is reached. Enter
opens that file diff or architecture element. Escape from a diff restores the
same reading row. Both record
entry points show title, description, acceptance criteria and Definition of Done
before execution status, assignees, plan, modified files, notes and comments.
Modified files show A (added), D (removed), M (modified), or · (unchanged), with
added/removed line counts and a Shared mark when another active task lists the
same file. The record and file reader use one task diff snapshot. Diff rows show
old/new line numbers, red/green change gutters and the same syntax tokens as the
web reader.

The selected task accents every element touched by its modified files and References
containing exact element IDs or repository-relative source files, plus routes leaving
those elements. If all touched elements
belong to one container, Work temporarily opens that component map. Otherwise it uses
the root navigation scope. A marker stands on the box that draws its element: the
component itself, or the collapsed group or container holding it. The camera
reveals the touched set when it fits; otherwise it starts at the first touched
element. Closing Work focus
with `w` or Escape restores the saved architecture view and focuses the map.

Every touched slab or building carries its task in a corner: the selected task
when it touches the element, else the first shown task in work order, with +N for
the other shown tasks; future work has a quiet diamond marker and dim text, in
progress uses the brand green, done is dim, and the selected task is bold. A component task stands on its component where it is drawn and on its collapsed group or container elsewhere; a system carries only
tasks that touch the system. The Work focus list has
one toggle per status with a mapped task: Space on its header shows or hides those
tasks on the map without changing the selection, scope or camera; the default and
intermediate statuses start shown, while the final status starts hidden. List
folding and map visibility are independent.
The component Tasks tab shares browsing, folding and record opening, but has no
visibility controls. `t` focuses the hierarchy to change visibility. Escape
returns from a diff to its record; Escape from the record closes Work and returns
to the map. `w` also closes Work.

## Appearance

Every colour is the terminal's own: its default foreground and background, its
bright black for quiet frames and draft elements, palette red/green for diff
changes, and palette colors for code syntax. The brand green `#1D9E75` is used
for the selection, active flows, their endpoints, and active work. Nothing is
sampled from the palette, so switching the terminal theme recolours the viewer
live.

A quiet dotted grid covers the ground; islands are plain paper on it. Frames
weigh by depth: an island quiet and rounded, a container in the foreground and
rounded, a group dim and square, a component square, and actors and external
systems rounded like their round and pill buildings. An open surface writes its
name centred in its front (bottom) edge, as the web plan writes it below the
boundary, and steps it aside where a route crosses or ends there. A collapsed
container or group holds its name over its component count. Component names are
centred. The selection draws heavy in the brand green.

Observed architecture uses solid frames and routes; drafts use dashed ones.
Core routes the relationships of the depth being drawn on its terminal cells: a
collapsed container or group is one end and one obstacle, so each pair of drawn
ends gets one route carrying every relationship it stands for, and opposite
relationships share one route with an arrow at both ends. Routes sharing a
channel close up into one line that branches where they part. Frames and routes
are drawn as one set of lines, so a route leaves its source with a tee on the
frame and crosses frames and other routes with junctions; a filled arrowhead
points at the target frame. Routes are quiet and thin. The selection's routes
draw in the brand green and stay still; a flow or task draws its routes bold in
the brand green and accents both ends, and everything off a traced flow recedes.
Only a lit flow moves: pulses travel its routes from source to target for as long
as it is lit. When six or fewer
routes are lit, each shows the first words of its description on free ground
beside its longest run. The details pane lists each
ordered pair of the selection and a peer at its depth once, with the distinct
descriptions of every relationship it combines. A highlighted row lists each
of those relationships beneath it with its exact ends and lights all of them
on the map. Browsing a relationship row moves only its cursor. Space toggles
its highlight; Enter first highlights it, then selects the peer the row names.

## Keys

- Arrow keys move selection or the focused side-pane cursor. They never move map focus into a side pane.
- Enter opens a container, task or flow, inspects a flow endpoint, or folds a task status group.
- Space toggles a flow, or a task status's map visibility in the hierarchy only. Left/Right also fold task groups.
- Backspace returns from a container map to root.
- Tab changes the focused details pane's tabs. Escape returns focus to the map; a source file or diff first returns to its preceding view.
- `/` searches architecture; Enter keeps a match and Escape restores the prior view.
- `h` lists groma.md revisions; Enter opens one and Escape returns to Current.
- `t` focuses the hierarchy and `d` focuses details; pressing the focused pane's key again folds it.
- `w` toggles Work focus, `s` steps a flow, and `x` clears it.
- `p` shows the project profile read-only in the details pane; `p` or Escape returns to the selection.
- `?` shows the keys box in the details pane, opening it if folded; `?` or Escape closes it.
- A mouse click on a hierarchy row or a map box selects it; a click on a collapsed group opens it on its first component. The wheel scrolls the map and dragging pans it.
- `r` refreshes and Ctrl+C exits.

Refresh preserves valid architecture and task selections, map scope, pane state,
and camera. A depth's layout stays the same across repaints; resizing only opens
or folds an open container's other groups as they start or stop fitting. An
architecture update morphs the map into its new layout the way a zoom does.

The focused pane has an accented border and a heading that identifies where keys
go. The selected architecture stays green when another pane has focus. The footer
shows bracketed actions for the active pane and always exposes Help. See the
[interaction review examples](interaction-spec.md) for visual acceptance checks.

Up/Down and k/j move the same selection or reading cursor. The viewport stays
still while that row is visible and follows only at its top or bottom edge.
Returning from a source or diff keeps the parent reading position.

## Saved architecture without scanners

Opening an existing project always reads saved architecture. Available selected
scanners can refresh their evidence while missing or removed scanners' Code and
relationships remain saved. With no installed selections, scanning does nothing.
A failed active scanner reports its error and leaves the previous scan result.
Architecture edits and Backlog updates remain live independently.

Press `Shift+S` in the map, or `s` on the splash screen, to open **Scanners**. A warning means no installed scanner matches the detected project; a quiet
hint means some detected support is missing or uncertain. Settings show matched
files, package state and readiness. Add an exact npm/Git/local source, install a
confirmed recommendation, restore a missing package, remove a project selection,
check readiness or update a version explicitly. Successful changes update source
subscriptions without reopening the viewer. Removal keeps saved architecture.
See [scanner settings](../../scanners/setup.md) for status details.
