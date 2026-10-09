# Play architecture history

In the live web map, choose a commit, open **compare 2 revisions**, and choose
an older start commit. **Play** walks the range from oldest to newest. The speed
selector offers 0.5×, 1×, 2×, and 4×; **Stop** leaves the current step visible.
The caption shows that step's short commit ID, subject, and local date and time.
The two revision fields keep the chosen range. Its `from` and `revision` URL
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

[`revision/control.ts`](../../../src/viewers/web/revision/control.ts) owns the
selected revision and connects the playback controls to the browser session.
[`revision/playback.ts`](../../../src/viewers/web/revision/playback.ts) owns the
clock, cancellation, speed, caption, range, and a cache of requested frames. It
loads the next two frames ahead. Stopping invalidates pending frame applications
without discarding their cached data.

The live [`map-session.ts`](../../../src/viewers/web/map-session.ts) serves
`/playback.json?from=<commit>&revision=<commit>` to identify readable frames.
[`revision/history.ts`](../../../src/viewers/web/revision/history.ts) shares
in-flight historical reads for that server session: each commit's architecture,
layout, and owned source text are loaded once. Comparisons reuse those snapshots;
source files owned only on the other side are read and cached when needed.
Compatibility checks populate the same cache used by playback. Working-tree
comparisons continue to read current files.

Playback is transient browser state, not stored architecture knowledge. It adds
no OKF metadata or C4 element type. Git commits and the existing architecture
documents remain the portable history; the browser revision selector and web
host own its playback interpretation.
