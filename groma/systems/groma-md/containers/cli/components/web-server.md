---
type: C4 Component
title: Web host
status: stable
groma:
  id: web-server
  parent: cli
  code:
    - scanner: typescript
      file: src/viewers/web/server.ts
      symbol: startWebViewer
    - scanner: typescript
      file: src/viewers/web/map-session.ts
      symbol: createWebMapSession
    - scanner: typescript
      file: src/viewers/web/startup/page.ts
      symbol: renderSetupPage
    - scanner: typescript
      file: src/viewers/web/startup/scanners.ts
    - scanner: typescript
      file: src/viewers/web/revision-archives.ts
      symbol: createRevisionArchives
  group: Browser delivery
description: Serves the local browser map and live architecture operations
---

Starts the local HTTP server. Serves project setup and connects the browser to architecture, scanner, task, and source operations. Extracts each historical commit the browser asks for into a temporary folder and keeps only the few most recently used commits open, so comparisons, playback frames, and historical details share one extraction without filling the disk. The folders are deleted when the session closes. Lists the commits of a playback range, and answers with a status of its own when the current reader cannot read a commit, so the browser can skip it.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [src/viewers/web/map-session.ts](../../../../../../src/viewers/web/map-session.ts) | [src/scanner/session.ts](../../../../../../src/scanner/session.ts) | Runs live scans | Function call |
| [src/viewers/web/map-session.ts](../../../../../../src/viewers/web/map-session.ts) | [src/authoring.ts](../../../../../../src/authoring.ts) | Applies browser edits | Function call |
| [src/viewers/web/map-session.ts](../../../../../../src/viewers/web/map-session.ts) | [plugins/work-sources/backlog/src/index.ts](../../../../../../plugins/work-sources/backlog/src/index.ts) | Reads and watches tasks | Work source plugin |
| [src/viewers/web/map-session.ts](../../../../../../src/viewers/web/map-session.ts) | [src/history/revisions.ts](../../../../../../src/history/revisions.ts) | Loads past revisions | Function call |
| [src/viewers/web/map-session.ts](../../../../../../src/viewers/web/map-session.ts) | [src/viewers/web/sharing/images.ts](../../../../../../src/viewers/web/sharing/images.ts) | Renders cover images | Function call |
| [src/viewers/web/server.ts](../../../../../../src/viewers/web/server.ts) | [src/viewers/web/startup/progress.ts](../../../../../../src/viewers/web/startup/progress.ts) | Reports startup progress | Function call |
