# Play architecture history

In the live web map, choose a commit, open **compare 2 revisions**, and choose
an older start commit. **Play** walks the range from oldest to newest. The speed
menu offers 0.5×, 1×, 2×, and 4×; **Stop** leaves the current step visible.
The caption shows that step's short commit ID, subject, and local date and time.
The two revision fields keep the chosen range, including while editing an
endpoint after Stop. Play waits for a chosen endpoint to finish loading. Its
`from` and `revision` URL
parameters reopen the range without starting playback automatically.

Only commits readable by the current architecture reader are visited, in the
same Git order as the revision picker. Both endpoints must be readable. The
working tree is not a playback endpoint. Playback is available only in the live
web map; static exports and the terminal viewer keep their existing behavior.

The first frame shows the start snapshot. Each later frame uses the comparison
from the previous readable commit to the next, including retained removed
elements and their parent context. The map's existing keyed geometry transition
moves shared buildings and routes and grows new ones. Reduced motion applies
each frame immediately. When playback finishes, the original start-to-end
comparison returns with its changes bar and stepper. A person can pan and zoom
while playback continues.

## In the browser

[`revision/control.ts`](../../../src/viewers/web/revision/control.ts) owns the
selected revision and connects the playback controls to the browser session.
[`revision/playback.ts`](../../../src/viewers/web/revision/playback.ts) owns the
clock, cancellation, speed, caption, range, and a cache of the frames it has
requested, so a replay does not ask the host again. Stopping invalidates pending
frame applications without discarding their cached data.

Play first asks `/playback.json?from=<commit>&revision=<commit>` for every
commit of the range, oldest first. The walk then requests one frame per commit
from `/world.json` and loads the next two frames ahead. A commit the current
reader cannot read is skipped, and the next frame is the comparison from the
last commit shown. Any other failure stops playback and shows its message.

## In the web host

[`map-session.ts`](../../../src/viewers/web/map-session.ts) serves both routes.
`/playback.json` reads only the two endpoints, so a long range answers at once.
A request that names a commit whose architecture the current reader cannot read
is answered with status 422 (`UNREADABLE_REVISION_STATUS` in
[`payload.ts`](../../../src/viewers/web/payload.ts)), and the browser data source
turns that status into `UnreadableRevisionError`. This status is the only signal
for an unreadable commit. A Git error, a full disk, or any other failure is
answered with status 500.

[`revision-archives.ts`](../../../src/viewers/web/revision-archives.ts) opens the
commits. Opening one extracts the whole repository at that commit into a
temporary folder and reads its architecture. Once no request is reading, at
most four commits stay open (`OPEN_ARCHIVES`): the two a frame compares and the
two the browser preloads. Beyond that, the least recently used commit that no
request is reading is closed and its folder deleted. A commit that failed to
open is not kept, so the next request tries again. Code outlines and source details read the open
folder of their commit. An ordinary map layout is prepared on the first request
for a snapshot view and kept while the commit stays open; comparisons prepare
their own layouts. Closing the server session deletes the remaining folders. A
host process that is killed cannot delete the folders open at that moment; they
stay in the system's temporary directory, named `groma-revision-*`.

`compareSnapshots` in
[`history/snapshots.ts`](../../../src/history/snapshots.ts) assembles every
comparison from two loaded snapshots. Working-tree comparisons call it through
`readComparison`, which reads current files and removes its archive afterwards.

Playback is transient browser state, not stored architecture knowledge. It adds
no OKF metadata or C4 element type. Git commits and the existing architecture
documents remain the portable history; the browser revision selector and web
host own its playback interpretation.
