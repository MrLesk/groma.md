---
id: TASK-658
title: Draw the web map in an embedding page's colours
status: Done
assignee:
  - '@claude'
created_date: '2026-11-15T10:43:00Z'
updated_date: '2026-11-15T12:09:00Z'
labels: []
dependencies: []
references:
  - src/viewers/web/atoms/theme.ts
  - src/viewers/web/page.ts
  - src/viewers/web/url.ts
  - test-bun/web-page-inset.test.ts
documentation:
  - docs/viewers/web/index.md
modified_files:
  - src/viewers/web/atoms/theme.ts
  - src/viewers/web/page.ts
  - src/viewers/web/url.ts
  - src/viewers/web/render.ts
  - test-bun/web-page-palette.test.ts
  - docs/viewers/web/index.md
  - src/viewers/web/iso/painting/appearance.ts
  - src/viewers/web/iso/painting/map.ts
type: feature
ordinal: 702000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
A slide deck that shows the live map in an iframe has its own colours. Next to a branded slide the map's white or dark paper looks like a foreign window. The deck already tells the map how far to keep its chrome from the frame (inset); it needs the same kind of control over the page colours.

Trigger: the Cafe Compute Vienna deck (Cerebras colours) shows the live agents demo on this map on 2026-12-12. The demo project uses the element icons and colors of this branch line, so the work starts from codex/personalization-colors and is merged into the stage build like PRs 194 and 195.

This is presentation of the page only. It adds no OKF concept and no C4 element, and it does not change authored element or group icons and colors. The newer themes work (TASK-636) lets a project own complete theme files; that line does not open the demo project, so this task stays a small link setting on this line.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A link that names palette colours, such as paper=FFEEDB and ink=2E180F, opens the map with those colours on top of the selected theme, and the map grid follows a given paper and line
- [x] #2 A value that is not six hex digits and a name that is not a palette colour are ignored, and a link without colours renders the page exactly as before
- [x] #3 The colours stay in the links the map writes, so a synchronized view that is reloaded keeps them
- [x] #4 The web viewer documentation describes the link colours beside the embedding inset
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Acceptance criteria have objective verification evidence.
- [x] #2 Relevant checks pass and changes remain task-scoped.
- [x] #3 Public contracts or documentation are updated when behavior changes.
- [x] #4 Implementation Plan reflects the final approach; correction history and verification are recorded in Implementation Notes.
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. atoms/theme.ts owns the link palette beside the theme palette: which palette colours a link may set, reading them from the one palette setting (palette=<name>:<hex>,...), the CSS that draws them over a theme, and the value that writes them back. The grid mix moves into one helper that the theme blocks and the link palette share.
2. page.ts writes that CSS as the root element's style, the way it writes the embedding inset on the body. The root is where each theme sets its palette, so an inline style there wins over the selected theme.
3. url.ts carries the palette in the view state: readView reads it, writeView writes it back, and render.ts passes the opened palette when it synchronizes the link, as it does for inset.
4. docs/viewers/web/index.md: one paragraph after the inset paragraph.

Tests (authority: acceptance criteria 1 to 3), in test-bun/web-page-palette.test.ts beside the inset test.
- A link with a palette renders the root style, grid included, and keeps the palette through readView and writeView. Wrong result caught: colours lost when the view is synchronized and reloaded.
- Invalid values and unknown names render the page exactly as without a palette, and write nothing back. Wrong result caught: text from a link reaching the page's style.
No tests of how the colours look.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Decisions: one namespaced link setting, palette=<name>:<hex>,..., instead of one setting per colour, because a colour named line would collide with the source line setting. The colours are written by the server as the root element's inline style, like the embedding inset on the body: the root is where each theme sets its palette, so no browser code is needed and the selected theme, Auto included, stays the base. Hover is left out because it is the one palette value that is not a hex colour. The grid mix moved into gridCss, shared by the theme blocks and the link palette.

Verification: bun run check passed (Biome, scrollbar lint, typecheck, 26 Node tests, 950 Bun tests, 64 environment-dependent skips, 0 failures). test-bun/web-page-palette.test.ts covers the root style with the grid, the round trip through readView and writeView, a grid that needs both paper and line, and ignored names and values including markup in a value. In a browser: the stage build with this change, serving the Cafe Compute demo project inside the deck's slide, answered palette=paper:FFEEDB,ink:2E180F,line:9B674A with those root variables and drew the map, header and grid in them, in the light and dark base themes.

Correction after the first stage run (Alex, 2026-11-15): authored element colours stayed on white. The browser's appearance rules mix each authored colour into every theme's own paper as explicit values, so a link's paper did not reach them. The rules now start from the theme's palette with the link palette over it (withLinkPalette in atoms/theme.ts); createMap takes the link palette from the opened view and passes it to appearanceCss. Covers are unchanged: they have no link.

Verification of the correction: bun run check passed (26 Node tests, 951 Bun tests, 64 environment-dependent skips, 0 failures; one earlier run failed only on two scanner tests whose downloads from nasm.us and Maven Central dropped). A new test asserts that with a link paper every theme's rule mixes the authored colour into that one paper. In a browser, on the stage build with this change and the Cafe Compute demo project, the system rule for #5B9A7C read --item-top: #faebd8 with paper FFEEDB (it was a white mix before), and the system and container planes drew in the deck's cream and espresso papers.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
A page that embeds the web map can set palette colours in the map's link: palette=paper:FFEEDB,ink:2E180F. The server draws them over the selected theme on the root element, the grid follows a given paper and line, and the map keeps the setting in the links it writes. Unknown names and anything that is not six hex digits are ignored. Authored element and group icons and colors are untouched. Started from codex/personalization-colors because the Cafe Compute demo project needs that line's icons, colors and group appearance; the same source diff applies cleanly to the aidevcon-stage build. Open decision for Alex: the newer themes line (TASK-636) solves custom colours with theme files, so this setting is meant for the stage line and should not be merged into that line as is.
<!-- SECTION:FINAL_SUMMARY:END -->
