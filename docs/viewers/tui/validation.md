# TUI map validation

The TUI world is a map inside fixed chrome: a one-row header, a
hierarchy pane, the map pane, a details pane, and a one-row footer,
with one blank row above the header and below the footer.
Panes reserve width; they never overlay the map. The map is a terminal plan of
the shared sheet: nesting and the order of neighbours along the axis that
separates them match the web 2D view, while sizes follow the text each box holds.

- The details pane shows the current architecture selection, except while an
  explicitly focused flow, work record, source, diff, profile or help view is open.
- Root draws islands, collapsed containers with their component counts and island
  buildings, and no component inside a container.
- Enter opens a container on its first component; every other container stays
  collapsed in its direction. Backspace returns to root with the container
  selected. Arrows never change scope. Both changes animate.
- An open container too large for the map opens only the selected component's
  group; the others stand collapsed with their counts and open when an arrow or
  click reaches them.
- Components with an unidentified container stand inside their system. Selecting one through the hierarchy opens its system surface and the
  Unidentified container group; Backspace returns to that system at root.
- Arrowing selects the nearest box by its rectangle, including slight overlap.
  Map arrows never move pane focus. The camera keeps the selection clear of the
  edges and never shows space beyond the map; the wheel and dragging pan it.
- Within one depth, boxes and routes keep their world cells across selection and
  pane changes; only the camera moves.
- Routes leave their source with a tee, end in an arrowhead at their target and
  go around boxes. A run that rounds onto a frame line moves to a free line within
  two cells. Selection routes are green and still; only a lit flow's routes pulse.

The automated terminal procedure requires `tui-test` on `PATH` in the
shell running it, plus Bun and the installed project dependencies.
Check availability with `Get-Command tui-test` in PowerShell or
`command -v tui-test` in Bash. It is a separate validation tool, not
a dependency required to run groma.md.

Drive `groma view` with `tui-test`. Read the terminal, send keys, and
capture a screenshot.
Compare world geometry across arrow moves within one depth; the camera may pan,
but boxes and labels must not rearrange. The map rests once zooms and pans
finish, except while a flow is lit, so wait for idle or for text. Do not wait
for a human screenshot.

### Windows (PowerShell)

```powershell
$gromaTuiSession = "groma-view-$PID"
$gromaTuiArtifacts = Join-Path ([System.IO.Path]::GetTempPath()) ("groma-tui-test-" + [guid]::NewGuid())
New-Item -ItemType Directory -Path $gromaTuiArtifacts | Out-Null
try {
    tui-test run --session $gromaTuiSession --cols 120 --rows 36 --cwd (Get-Location).Path bun src/cli.ts view
    tui-test wait idle --session $gromaTuiSession --timeout 10000
    tui-test text --session $gromaTuiSession
    tui-test press --session $gromaTuiSession Enter
    tui-test wait idle --session $gromaTuiSession --timeout 10000
    tui-test screenshot --session $gromaTuiSession (Join-Path $gromaTuiArtifacts 'frame.svg')
} finally {
    tui-test close --session $gromaTuiSession
}
```

### macOS and Linux (Bash)

```bash
GROMA_TUI_SESSION="groma-view-$$"
GROMA_TUI_ARTIFACTS=$(mktemp -d /tmp/groma-tui-test.XXXXXX)
trap 'tui-test close --session "$GROMA_TUI_SESSION" >/dev/null 2>&1 || true' EXIT
tui-test run --session "$GROMA_TUI_SESSION" --cols 120 --rows 36 --cwd "$PWD" bun src/cli.ts view
tui-test wait idle --session "$GROMA_TUI_SESSION" --timeout 10000
tui-test text --session "$GROMA_TUI_SESSION"
tui-test press --session "$GROMA_TUI_SESSION" Enter
tui-test wait idle --session "$GROMA_TUI_SESSION" --timeout 10000
tui-test screenshot --session "$GROMA_TUI_SESSION" "$GROMA_TUI_ARTIFACTS/frame.svg"
tui-test close --session "$GROMA_TUI_SESSION"
trap - EXIT
```

Look at the root view, details, a container, and a large size such as 200x60.
