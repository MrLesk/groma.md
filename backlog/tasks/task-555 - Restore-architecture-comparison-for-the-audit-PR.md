---
id: TASK-555
title: Restore architecture comparison for the audit PR
status: Done
assignee:
  - '@codex'
created_date: '2026-10-06 10:24'
updated_date: '2026-10-06 11:23'
labels: []
dependencies: []
references:
  - 'https://github.com/MrLesk/groma.md/pull/113'
  - 'https://github.com/MrLesk/groma.md/actions/runs/37447815482'
  - coding-agent
  - developer
  - control
  - tree
  - backlog-src-index
  - cobol-src-index
  - csharp-src-index
  - go-src-index
  - history-revisions
  - java-src-index
  - nasm-src-index
  - package
  - projection
  - relationship-markdown
  - rust-src-index
  - scala-src-index
  - scanner-session
  - scanner-source-watch
  - screen
  - src-architecture-findings
  - src-architecture-model
  - src-architecture-reader
  - src-architecture-watch
  - src-authoring
  - src-cli
  - src-initialize
  - src-scanner
  - src-view-host
  - tui-paint
  - web-export
  - web-page
  - web-server
  - csharp-command
  - button
  - c4-filter
  - camera
  - data
  - render
  - review-control
  - revision-control
  - search-control
  - source-control
  - task-diff-control
documentation:
  - docs/component-markdown.md
modified_files:
  - .github/workflows/architecture.yml
  - .gitignore
  - AGENTS.md
  - CONTRIBUTING.md
  - README.md
  - >-
    backlog/tasks/task-480 -
    Review-architecture-changes-in-the-web-comparison.md
  - >-
    backlog/tasks/task-480.2 -
    List-changed-components-and-relationships-in-the-hierarchy-pane.md
  - >-
    backlog/tasks/task-480.3 -
    Filter-and-step-through-changes-from-a-changes-bar.md
  - >-
    backlog/tasks/task-480.4 -
    Explain-why-a-component-is-Modified-and-show-rewritten-prose.md
  - >-
    backlog/tasks/task-480.5 -
    Read-diffs-on-an-opaque-pane-and-step-between-changed-files.md
  - >-
    backlog/tasks/task-526 -
    Keep-Vue-callback-evidence-inside-scanner-file-selection.md
  - >-
    backlog/tasks/task-527 -
    Keep-Angular-callback-evidence-inside-scanner-file-selection.md
  - backlog/tasks/task-528 - Finish-live-map-updates-while-orbiting-Layers.md
  - backlog/tasks/task-529 - Preserve-the-embedding-inset-in-web-map-URLs.md
  - >-
    backlog/tasks/task-530 -
    Release-the-missing-Angular-and-Vue-scanner-fixes.md
  - >-
    backlog/tasks/task-531 -
    Publish-PR-architecture-comparisons-for-groma.md-pull-requests.md
  - backlog/tasks/task-533 - Render-the-terminal-map-like-the-web-2D-view.md
  - backlog/tasks/task-534 - Match-the-code-panel-opacity-to-other-panels.md
  - >-
    backlog/tasks/task-535 -
    Show-the-Antigravity-logo-on-assigned-work-badges.md
  - >-
    backlog/tasks/task-536 -
    Complete-the-first-Keycloak-scan-in-under-ten-seconds.md
  - >-
    backlog/tasks/task-537 -
    Open-the-fresh-CFP-map-without-routing-through-buildings.md
  - backlog/tasks/task-538 - Release-the-first-scan-performance-fixes.md
  - >-
    backlog/tasks/task-539 -
    Wait-for-npm-metadata-before-embedding-scanner-releases.md
  - backlog/tasks/task-540 - Maintain-a-navigable-OKF-bundle-root-index.md
  - >-
    backlog/tasks/task-541 -
    Store-outgoing-relationships-with-their-source-elements.md
  - >-
    backlog/tasks/task-542 -
    Resolve-local-scanner-dependencies-in-the-standalone-CLI.md
  - backlog/tasks/task-543 - Keep-flow-lines-smooth-at-overview-zoom.md
  - >-
    backlog/tasks/task-544 -
    Add-a-copyable-agent-prompt-to-the-first-scan-notice.md
  - >-
    backlog/tasks/task-545 -
    Run-web-scanner-setup-once-across-simultaneous-submissions.md
  - >-
    backlog/tasks/task-546 -
    Restore-architecture-publishing-and-release-the-scanner-setup-hotfix.md
  - backlog/tasks/task-547 - Scan-COBOL-programs-from-a-fresh-source-checkout.md
  - >-
    backlog/tasks/task-548 -
    Scan-NASM-assembly-and-map-the-Cityssembly-game-loop.md
  - >-
    backlog/tasks/task-549 -
    Align-the-Scala-scanner-PR-with-current-scanner-contracts.md
  - >-
    backlog/tasks/task-550 -
    Restore-CI-and-architecture-publishing-after-scanner-additions.md
  - backlog/tasks/task-551 - Toggle-relationships-from-the-web-map-filter-bar.md
  - >-
    backlog/tasks/task-552 -
    Protect-local-architecture-updates-and-reject-stale-edits.md
  - >-
    backlog/tasks/task-553 -
    Share-source-ownership-lookups-and-map-task-file-references.md
  - backlog/tasks/task-554 - Verify-atomic-document-replacement-on-Windows.md
  - bun.lock
  - docs/agent-instructions/backlog.md
  - docs/agent-instructions/relationships.md
  - docs/architecture-findings.md
  - docs/component-markdown.md
  - docs/product-model.md
  - docs/scanners/cobol/index.md
  - docs/scanners/creating-a-plugin.md
  - docs/scanners/discovery.md
  - docs/scanners/index.md
  - docs/scanners/java/index.md
  - docs/scanners/nasm/index.md
  - docs/scanners/publishing.md
  - docs/scanners/scala/index.md
  - docs/scanners/setup.md
  - docs/viewers/tui/index.md
  - docs/viewers/tui/interaction-spec.md
  - docs/viewers/tui/validation.md
  - docs/viewers/web/index.md
  - features/map-filters.feature
  - features/work-summary.feature
  - groma/actors/coding-agent.md
  - groma/actors/developer.md
  - groma/index.md
  - groma/relationships.md
  - groma/systems/groma-md/components/control.md
  - groma/systems/groma-md/components/tree.md
  - groma/systems/groma-md/containers/cli/components/backlog-src-index.md
  - groma/systems/groma-md/containers/cli/components/cobol-src-index.md
  - groma/systems/groma-md/containers/cli/components/csharp-src-index.md
  - groma/systems/groma-md/containers/cli/components/go-src-index.md
  - groma/systems/groma-md/containers/cli/components/history-revisions.md
  - groma/systems/groma-md/containers/cli/components/java-src-index.md
  - groma/systems/groma-md/containers/cli/components/nasm-src-index.md
  - groma/systems/groma-md/containers/cli/components/package.md
  - groma/systems/groma-md/containers/cli/components/projection.md
  - groma/systems/groma-md/containers/cli/components/relationship-markdown.md
  - groma/systems/groma-md/containers/cli/components/rust-src-index.md
  - groma/systems/groma-md/containers/cli/components/scala-src-index.md
  - groma/systems/groma-md/containers/cli/components/scanner-session.md
  - groma/systems/groma-md/containers/cli/components/scanner-source-watch.md
  - groma/systems/groma-md/containers/cli/components/screen.md
  - >-
    groma/systems/groma-md/containers/cli/components/src-architecture-findings.md
  - groma/systems/groma-md/containers/cli/components/src-architecture-model.md
  - groma/systems/groma-md/containers/cli/components/src-architecture-reader.md
  - groma/systems/groma-md/containers/cli/components/src-architecture-watch.md
  - groma/systems/groma-md/containers/cli/components/src-authoring.md
  - groma/systems/groma-md/containers/cli/components/src-cli.md
  - groma/systems/groma-md/containers/cli/components/src-initialize.md
  - groma/systems/groma-md/containers/cli/components/src-scanner.md
  - groma/systems/groma-md/containers/cli/components/src-view-host.md
  - groma/systems/groma-md/containers/cli/components/tui-paint.md
  - groma/systems/groma-md/containers/cli/components/web-export.md
  - groma/systems/groma-md/containers/cli/components/web-page.md
  - groma/systems/groma-md/containers/cli/components/web-server.md
  - groma/systems/groma-md/containers/csharp-worker/components/csharp-command.md
  - groma/systems/groma-md/containers/export/components/button.md
  - groma/systems/groma-md/containers/export/components/c4-filter.md
  - groma/systems/groma-md/containers/export/components/camera.md
  - groma/systems/groma-md/containers/export/components/data.md
  - groma/systems/groma-md/containers/export/components/render.md
  - groma/systems/groma-md/containers/export/components/review-control.md
  - groma/systems/groma-md/containers/export/components/revision-control.md
  - groma/systems/groma-md/containers/export/components/search-control.md
  - groma/systems/groma-md/containers/export/components/source-control.md
  - groma/systems/groma-md/containers/export/components/task-diff-control.md
  - package.json
  - packages/scanner/package.json
  - packages/scanner/src/index.ts
  - plugins/scanners/angular/package.json
  - plugins/scanners/angular/src/scan.ts
  - plugins/scanners/cobol/.gitignore
  - plugins/scanners/cobol/THIRD-PARTY-NOTICES.txt
  - plugins/scanners/cobol/build.ts
  - plugins/scanners/cobol/java/md/groma/cobol/Engine.java
  - plugins/scanners/cobol/java/md/groma/cobol/Main.java
  - plugins/scanners/cobol/java/md/groma/cobol/Source.java
  - plugins/scanners/cobol/package.json
  - plugins/scanners/cobol/src/index.ts
  - plugins/scanners/csharp/package.json
  - plugins/scanners/go/package.json
  - plugins/scanners/java/build.ts
  - plugins/scanners/java/java/md/groma/scanner/Main.java
  - plugins/scanners/java/package.json
  - plugins/scanners/java/src/adapter.ts
  - plugins/scanners/java/src/index.ts
  - plugins/scanners/java/src/missing-types.ts
  - plugins/scanners/java/src/process.ts
  - plugins/scanners/java/src/worker.ts
  - plugins/scanners/javascript/package.json
  - plugins/scanners/nasm/.gitignore
  - plugins/scanners/nasm/THIRD-PARTY-NOTICES.txt
  - plugins/scanners/nasm/build.ts
  - plugins/scanners/nasm/package.json
  - plugins/scanners/nasm/src/evidence.ts
  - plugins/scanners/nasm/src/index.ts
  - plugins/scanners/nasm/src/preprocess.ts
  - plugins/scanners/php/package.json
  - plugins/scanners/python/package.json
  - plugins/scanners/react/package.json
  - plugins/scanners/rust/package.json
  - plugins/scanners/scala/.gitignore
  - plugins/scanners/scala/THIRD-PARTY-NOTICES.txt
  - plugins/scanners/scala/build.ts
  - plugins/scanners/scala/package.json
  - plugins/scanners/scala/src/adapter.ts
  - plugins/scanners/scala/src/index.ts
  - plugins/scanners/scala/worker/build.sbt
  - plugins/scanners/scala/worker/project/build.properties
  - plugins/scanners/scala/worker/project/plugins.sbt
  - plugins/scanners/scala/worker/src/main/scala/md/groma/scanner/Calls.scala
  - plugins/scanners/scala/worker/src/main/scala/md/groma/scanner/Json.scala
  - plugins/scanners/scala/worker/src/main/scala/md/groma/scanner/Main.scala
  - >-
    plugins/scanners/scala/worker/src/main/scala/md/groma/scanner/Operations.scala
  - plugins/scanners/scala/worker/src/main/scala/md/groma/scanner/Outline.scala
  - plugins/scanners/scala/worker/src/main/scala/md/groma/scanner/Parse.scala
  - plugins/scanners/scala/worker/src/main/scala/md/groma/scanner/Scan.scala
  - plugins/scanners/scala/worker/src/main/scala/md/groma/scanner/Stats.scala
  - plugins/scanners/scala/worker/src/main/scala/md/groma/scanner/Symbols.scala
  - >-
    plugins/scanners/scala/worker/src/main/scala/md/groma/scanner/Visibility.scala
  - plugins/scanners/swift/package.json
  - plugins/scanners/typescript/package.json
  - plugins/scanners/vue/package.json
  - plugins/scanners/vue/src/project.ts
  - scripts/build.ts
  - scripts/scanner-release.ts
  - src/architecture-findings-worker.ts
  - src/architecture-findings.ts
  - src/architecture-model.ts
  - src/architecture-reader.ts
  - src/authoring-conflict.ts
  - src/authoring.ts
  - src/curate-rename.ts
  - src/curate.ts
  - src/edit.ts
  - src/groma-filesystem.ts
  - src/group.ts
  - src/initialize.ts
  - src/instructions.ts
  - src/lint-command.ts
  - src/markdown-emitter.ts
  - src/movable.ts
  - src/okf-profile.ts
  - src/plain-world.ts
  - src/project-profile.ts
  - src/relation.ts
  - src/relationship-inference.ts
  - src/relationship-markdown.ts
  - src/relationship-storage.ts
  - src/remove.ts
  - src/scan-reconciler.ts
  - src/scanner/modules/official-catalog.ts
  - src/sheet/pack-forces.ts
  - src/sheet/route/graph.ts
  - src/sheet/route/nudge.ts
  - src/source-index.ts
  - src/source-relationships.ts
  - src/types.ts
  - src/viewers/source/structure.ts
  - src/viewers/tui/atoms/border.ts
  - src/viewers/tui/atoms/lines.ts
  - src/viewers/tui/atoms/text.ts
  - src/viewers/tui/flow.ts
  - src/viewers/tui/layout.ts
  - src/viewers/tui/molecules/building.ts
  - src/viewers/tui/molecules/route.ts
  - src/viewers/tui/molecules/row.ts
  - src/viewers/tui/molecules/surface.ts
  - src/viewers/tui/molecules/work-marker.ts
  - src/viewers/tui/navigation-details.ts
  - src/viewers/tui/navigation-search.ts
  - src/viewers/tui/navigation-spatial.ts
  - src/viewers/tui/navigation-tree.ts
  - src/viewers/tui/navigation.ts
  - src/viewers/tui/organisms/world.ts
  - src/viewers/tui/paint.ts
  - src/viewers/tui/panes/details.ts
  - src/viewers/tui/panes/screen.ts
  - src/viewers/tui/panes/view.ts
  - src/viewers/tui/projection-container.ts
  - src/viewers/tui/projection-motion.ts
  - src/viewers/tui/projection-root.ts
  - src/viewers/tui/projection-routes.ts
  - src/viewers/tui/projection-sheet.ts
  - src/viewers/tui/projection-spacing.ts
  - src/viewers/tui/projection.ts
  - src/viewers/tui/terminal-viewer.ts
  - src/viewers/tui/work/model.ts
  - src/viewers/web/atoms/marks.ts
  - src/viewers/web/atoms/theme.ts
  - src/viewers/web/authoring.ts
  - src/viewers/web/chrome/c4-filter.ts
  - src/viewers/web/chrome/empty.ts
  - src/viewers/web/chrome/motion.ts
  - src/viewers/web/chrome/shell.ts
  - src/viewers/web/comparison/control.ts
  - src/viewers/web/comparison/details.ts
  - src/viewers/web/comparison/tree.ts
  - src/viewers/web/data.ts
  - src/viewers/web/iso/camera/session.ts
  - src/viewers/web/iso/painting/style.ts
  - src/viewers/web/iso/view-motion/presentation.ts
  - src/viewers/web/map-session.ts
  - src/viewers/web/organisms/code-lists.ts
  - src/viewers/web/organisms/details.ts
  - src/viewers/web/organisms/editable.ts
  - src/viewers/web/organisms/hierarchy.ts
  - src/viewers/web/organisms/writes.ts
  - src/viewers/web/page.ts
  - src/viewers/web/project/editor.ts
  - src/viewers/web/render.ts
  - src/viewers/web/revision/control.ts
  - src/viewers/web/server.ts
  - src/viewers/web/source/control.ts
  - src/viewers/web/source/diff-view.ts
  - src/viewers/web/source/view.ts
  - src/viewers/web/task-diff/view.ts
  - src/viewers/web/url.ts
  - src/work/pins.ts
  - test-bun/angular-scanner.test.ts
  - test-bun/architecture-findings.test.ts
  - test-bun/bundle-index.test.ts
  - test-bun/chrome.test.ts
  - test-bun/cobol-scanner.test.ts
  - test-bun/code-outline.test.ts
  - test-bun/compiled-scanner.test.ts
  - test-bun/container-layout.test.ts
  - test-bun/detach.test.ts
  - test-bun/editing.test.ts
  - test-bun/filesystem-access.test.ts
  - test-bun/flow-navigation.test.ts
  - test-bun/flows.test.ts
  - test-bun/http-relationships.test.ts
  - test-bun/inspect-details.test.ts
  - test-bun/java-scanner.test.ts
  - test-bun/large-world.test.ts
  - test-bun/nasm-scanner.test.ts
  - test-bun/navigation.test.ts
  - test-bun/projection-routes.test.ts
  - test-bun/projection.test.ts
  - test-bun/rename.test.ts
  - test-bun/revision-comparison.test.ts
  - test-bun/root-layout.test.ts
  - test-bun/route-nudge.test.ts
  - test-bun/routes.test.ts
  - test-bun/scala-scanner.test.ts
  - test-bun/scanner-fresh-checkout.test.ts
  - test-bun/scanner-release.test.ts
  - test-bun/source-index.test.ts
  - test-bun/source-relationships.test.ts
  - test-bun/system-curation.test.ts
  - test-bun/unidentified-container.test.ts
  - test-bun/vue-scanner.test.ts
  - test-bun/web-c4-filter.test.ts
  - test-bun/web-map-animator.test.ts
  - test-bun/web-page-inset.test.ts
  - test-bun/web-startup.test.ts
  - test-bun/work-pins.test.ts
  - test-bun/work.test.ts
  - test/architecture-model-errors.test.ts
  - test/architecture-model-helpers.ts
  - test/architecture-model.test.ts
  - test/fixtures/cobol-source/Fields.CPY
  - test/fixtures/cobol-source/caller.cbl
  - test/fixtures/cobol-source/providers.cob
  - test/fixtures/containers-view/groma/relationships.md
  - >-
    test/fixtures/containers-view/groma/systems/shop/containers/web/components/page.md
  - test/fixtures/core-view/groma/relationships.md
  - >-
    test/fixtures/core-view/groma/systems/shop/containers/api/components/inventory.md
  - >-
    test/fixtures/core-view/groma/systems/shop/containers/api/components/orders.md
  - test/fixtures/edit/groma/relationships.md
  - test/fixtures/edit/groma/systems/shop/containers/api/components/orders.md
  - test/fixtures/flows/groma/actors/requester.md
  - test/fixtures/flows/groma/relationships.md
  - test/fixtures/flows/groma/systems/service/containers/api/components/entry.md
  - >-
    test/fixtures/flows/groma/systems/service/containers/api/components/worker.md
  - test/fixtures/large-world/groma/actors/merchant.md
  - test/fixtures/large-world/groma/actors/shopper.md
  - test/fixtures/large-world/groma/relationships.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/catalog-api/components/catalog-api-cache.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/catalog-api/components/catalog-api-config.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/catalog-api/components/catalog-api-gateway.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/catalog-api/components/catalog-api-logger.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/catalog-api/components/catalog-api-mapper.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/catalog-api/components/catalog-api-metrics.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/catalog-api/components/catalog-api-queue.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/catalog-api/components/catalog-api-reader.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/catalog-api/components/catalog-api-router.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/catalog-api/components/catalog-api-scheduler.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/catalog-api/components/catalog-api-session.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/catalog-api/components/catalog-api-validator.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/catalog-api/components/catalog-api-worker.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/catalog-api/components/catalog-api-writer.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/import/components/import-cache.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/import/components/import-config.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/import/components/import-gateway.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/import/components/import-logger.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/import/components/import-mapper.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/import/components/import-metrics.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/import/components/import-queue.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/import/components/import-reader.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/import/components/import-router.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/import/components/import-scheduler.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/import/components/import-session.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/import/components/import-validator.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/import/components/import-worker.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/import/components/import-writer.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/media/components/media-cache.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/media/components/media-client.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/media/components/media-config.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/media/components/media-gateway.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/media/components/media-logger.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/media/components/media-mapper.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/media/components/media-metrics.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/media/components/media-queue.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/media/components/media-reader.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/media/components/media-router.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/media/components/media-scheduler.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/media/components/media-session.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/media/components/media-validator.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/media/components/media-worker.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/media/components/media-writer.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/pricing/components/pricing-cache.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/pricing/components/pricing-config.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/pricing/components/pricing-gateway.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/pricing/components/pricing-logger.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/pricing/components/pricing-mapper.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/pricing/components/pricing-metrics.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/pricing/components/pricing-queue.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/pricing/components/pricing-reader.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/pricing/components/pricing-router.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/pricing/components/pricing-scheduler.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/pricing/components/pricing-session.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/pricing/components/pricing-validator.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/pricing/components/pricing-worker.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/pricing/components/pricing-writer.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/product-db/components/product-db-cache.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/product-db/components/product-db-config.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/product-db/components/product-db-gateway.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/product-db/components/product-db-logger.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/product-db/components/product-db-mapper.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/product-db/components/product-db-metrics.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/product-db/components/product-db-queue.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/product-db/components/product-db-reader.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/product-db/components/product-db-router.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/product-db/components/product-db-scheduler.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/product-db/components/product-db-session.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/product-db/components/product-db-validator.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/product-db/components/product-db-worker.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/product-db/components/product-db-writer.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/accounts/components/accounts-cache.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/accounts/components/accounts-config.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/accounts/components/accounts-gateway.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/accounts/components/accounts-logger.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/accounts/components/accounts-mapper.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/accounts/components/accounts-metrics.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/accounts/components/accounts-queue.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/accounts/components/accounts-reader.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/accounts/components/accounts-router.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/accounts/components/accounts-scheduler.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/accounts/components/accounts-session.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/accounts/components/accounts-validator.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/accounts/components/accounts-worker.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/accounts/components/accounts-writer.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/audit/components/audit-cache.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/audit/components/audit-client.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/audit/components/audit-config.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/audit/components/audit-gateway.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/audit/components/audit-logger.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/audit/components/audit-mapper.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/audit/components/audit-metrics.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/audit/components/audit-queue.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/audit/components/audit-reader.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/audit/components/audit-router.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/audit/components/audit-scheduler.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/audit/components/audit-session.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/audit/components/audit-validator.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/audit/components/audit-worker.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/audit/components/audit-writer.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/auth/components/auth-cache.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/auth/components/auth-config.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/auth/components/auth-gateway.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/auth/components/auth-logger.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/auth/components/auth-mapper.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/auth/components/auth-metrics.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/auth/components/auth-queue.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/auth/components/auth-reader.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/auth/components/auth-router.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/auth/components/auth-scheduler.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/auth/components/auth-session.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/auth/components/auth-validator.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/auth/components/auth-worker.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/auth/components/auth-writer.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/directory/components/directory-cache.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/directory/components/directory-config.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/directory/components/directory-gateway.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/directory/components/directory-logger.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/directory/components/directory-mapper.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/directory/components/directory-metrics.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/directory/components/directory-queue.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/directory/components/directory-reader.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/directory/components/directory-router.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/directory/components/directory-scheduler.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/directory/components/directory-session.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/directory/components/directory-validator.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/directory/components/directory-worker.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/directory/components/directory-writer.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/sessions/components/sessions-cache.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/sessions/components/sessions-config.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/sessions/components/sessions-gateway.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/sessions/components/sessions-logger.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/sessions/components/sessions-mapper.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/sessions/components/sessions-metrics.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/sessions/components/sessions-queue.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/sessions/components/sessions-reader.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/sessions/components/sessions-router.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/sessions/components/sessions-scheduler.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/sessions/components/sessions-session.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/sessions/components/sessions-validator.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/sessions/components/sessions-worker.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/sessions/components/sessions-writer.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/cart/components/cart-cache.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/cart/components/cart-config.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/cart/components/cart-gateway.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/cart/components/cart-logger.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/cart/components/cart-mapper.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/cart/components/cart-metrics.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/cart/components/cart-queue.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/cart/components/cart-reader.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/cart/components/cart-router.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/cart/components/cart-scheduler.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/cart/components/cart-session.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/cart/components/cart-validator.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/cart/components/cart-worker.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/cart/components/cart-writer.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/checkout/components/checkout-cache.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/checkout/components/checkout-config.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/checkout/components/checkout-gateway.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/checkout/components/checkout-logger.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/checkout/components/checkout-mapper.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/checkout/components/checkout-metrics.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/checkout/components/checkout-queue.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/checkout/components/checkout-reader.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/checkout/components/checkout-router.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/checkout/components/checkout-scheduler.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/checkout/components/checkout-session.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/checkout/components/checkout-validator.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/checkout/components/checkout-worker.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/checkout/components/checkout-writer.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/events/components/events-cache.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/events/components/events-client.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/events/components/events-config.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/events/components/events-gateway.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/events/components/events-logger.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/events/components/events-mapper.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/events/components/events-metrics.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/events/components/events-queue.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/events/components/events-reader.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/events/components/events-router.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/events/components/events-scheduler.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/events/components/events-session.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/events/components/events-validator.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/events/components/events-worker.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/events/components/events-writer.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/order-db/components/order-db-cache.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/order-db/components/order-db-config.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/order-db/components/order-db-gateway.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/order-db/components/order-db-logger.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/order-db/components/order-db-mapper.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/order-db/components/order-db-metrics.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/order-db/components/order-db-queue.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/order-db/components/order-db-reader.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/order-db/components/order-db-router.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/order-db/components/order-db-scheduler.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/order-db/components/order-db-session.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/order-db/components/order-db-validator.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/order-db/components/order-db-worker.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/order-db/components/order-db-writer.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/order-service/components/order-service-cache.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/order-service/components/order-service-config.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/order-service/components/order-service-gateway.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/order-service/components/order-service-logger.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/order-service/components/order-service-mapper.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/order-service/components/order-service-metrics.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/order-service/components/order-service-queue.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/order-service/components/order-service-reader.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/order-service/components/order-service-router.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/order-service/components/order-service-scheduler.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/order-service/components/order-service-session.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/order-service/components/order-service-validator.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/order-service/components/order-service-worker.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/order-service/components/order-service-writer.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/cdn-edge/components/cdn-edge-cache.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/cdn-edge/components/cdn-edge-config.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/cdn-edge/components/cdn-edge-gateway.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/cdn-edge/components/cdn-edge-logger.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/cdn-edge/components/cdn-edge-mapper.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/cdn-edge/components/cdn-edge-metrics.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/cdn-edge/components/cdn-edge-queue.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/cdn-edge/components/cdn-edge-reader.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/cdn-edge/components/cdn-edge-router.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/cdn-edge/components/cdn-edge-scheduler.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/cdn-edge/components/cdn-edge-session.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/cdn-edge/components/cdn-edge-validator.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/cdn-edge/components/cdn-edge-worker.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/cdn-edge/components/cdn-edge-writer.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/mobile-api/components/mobile-api-cache.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/mobile-api/components/mobile-api-config.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/mobile-api/components/mobile-api-gateway.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/mobile-api/components/mobile-api-logger.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/mobile-api/components/mobile-api-mapper.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/mobile-api/components/mobile-api-metrics.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/mobile-api/components/mobile-api-queue.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/mobile-api/components/mobile-api-reader.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/mobile-api/components/mobile-api-router.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/mobile-api/components/mobile-api-scheduler.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/mobile-api/components/mobile-api-session.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/mobile-api/components/mobile-api-validator.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/mobile-api/components/mobile-api-worker.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/mobile-api/components/mobile-api-writer.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/search/components/search-cache.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/search/components/search-config.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/search/components/search-gateway.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/search/components/search-logger.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/search/components/search-mapper.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/search/components/search-metrics.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/search/components/search-queue.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/search/components/search-reader.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/search/components/search-router.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/search/components/search-scheduler.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/search/components/search-session.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/search/components/search-validator.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/search/components/search-worker.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/search/components/search-writer.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/session-store/components/session-store-cache.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/session-store/components/session-store-client.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/session-store/components/session-store-config.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/session-store/components/session-store-gateway.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/session-store/components/session-store-logger.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/session-store/components/session-store-mapper.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/session-store/components/session-store-metrics.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/session-store/components/session-store-queue.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/session-store/components/session-store-reader.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/session-store/components/session-store-router.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/session-store/components/session-store-scheduler.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/session-store/components/session-store-session.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/session-store/components/session-store-validator.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/session-store/components/session-store-worker.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/session-store/components/session-store-writer.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/web-app/components/web-app-cache.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/web-app/components/web-app-config.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/web-app/components/web-app-gateway.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/web-app/components/web-app-logger.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/web-app/components/web-app-mapper.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/web-app/components/web-app-metrics.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/web-app/components/web-app-queue.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/web-app/components/web-app-reader.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/web-app/components/web-app-router.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/web-app/components/web-app-scheduler.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/web-app/components/web-app-session.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/web-app/components/web-app-validator.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/web-app/components/web-app-worker.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/web-app/components/web-app-writer.md
  - test/fixtures/nasm-source/helpers.asm
  - test/fixtures/nasm-source/macros.inc
  - test/fixtures/nasm-source/main.asm
  - test/fixtures/openclaw-view/groma/actors/operator.md
  - test/fixtures/openclaw-view/groma/relationships.md
  - >-
    test/fixtures/openclaw-view/groma/systems/openclaw/containers/agent-runtime/container.md
  - >-
    test/fixtures/openclaw-view/groma/systems/openclaw/containers/channels/container.md
  - >-
    test/fixtures/openclaw-view/groma/systems/openclaw/containers/cli/components/cli-implementation.md
  - >-
    test/fixtures/openclaw-view/groma/systems/openclaw/containers/control-ui/components/control-ui-implementation.md
  - >-
    test/fixtures/openclaw-view/groma/systems/openclaw/containers/gateway/components/gateway-implementation.md
  - >-
    test/fixtures/openclaw-view/groma/systems/openclaw/containers/node/components/node-implementation.md
  - test/fixtures/plain-view/groma/actors/buyer.md
  - test/fixtures/plain-view/groma/relationships.md
  - >-
    test/fixtures/plain-view/groma/systems/shop/containers/api/components/orders.md
  - test/fixtures/relationship-pairs/groma/relationships.md
  - >-
    test/fixtures/relationship-pairs/groma/systems/backend/containers/api/components/sessions.md
  - >-
    test/fixtures/relationship-pairs/groma/systems/site/containers/pages/components/speakers.md
  - >-
    test/fixtures/relationship-pairs/groma/systems/site/containers/pages/components/talks.md
  - test/fixtures/scala-outline/Orders.scala
  - test/fixtures/scala-parse/ApplyInfix.scala
  - test/fixtures/scala-parse/Broken.scala
  - test/fixtures/scala-parse/Calls.scala
  - test/fixtures/scala-parse/DuplicatePrice.scala
  - test/fixtures/scala-parse/Extensions.scala
  - test/fixtures/scala-parse/Indent.scala
  - test/fixtures/scala-parse/Inventory.scala
  - test/fixtures/scala-parse/Ok.scala
  - test/fixtures/scala-parse/Operations.scala
  - test/fixtures/scala-parse/PackageObject.scala
  - test/fixtures/scala-parse/Polymorphic.scala
  - test/fixtures/scala-parse/Rules.scala
  - test/fixtures/scala-parse/Selection.scala
  - test/fixtures/scala-parse/api/Calls.scala
  - test/fixtures/scala-parse/api/Pricing.scala
  - test/fixtures/scala-sbt-custom-root/modules/Api.scala
  - test/fixtures/scala-sbt-single/build.sbt
  - test/fixtures/scala-sbt-single/project/build.properties
  - test/fixtures/scala-sbt-single/src/main/scala/Shop.scala
  - test/fixtures/scala-sbt-single/src/test/scala/ShopSpec.scala
  - test/fixtures/validate/groma/actors/buyer.md
  - test/fixtures/validate/groma/relationships.md
  - test/fixtures/validate/groma/systems/shop/system.md
  - test/fixtures/viewer-view/groma/actors/shop-architect.md
  - test/fixtures/viewer-view/groma/actors/shop-operator.md
  - test/fixtures/viewer-view/groma/relationships.md
  - >-
    test/fixtures/viewer-view/groma/systems/shop/containers/api/components/orders.md
  - >-
    test/fixtures/viewer-view/groma/systems/shop/containers/gateway/components/router.md
  - >-
    test/fixtures/viewer-view/groma/systems/shop/containers/stock-viewer/components/stock-page.md
  - test/fixtures/viewer-view/groma/systems/shop/system.md
  - test-bun/relationship-escaping.test.ts
  - test-bun/groma-filesystem.test.ts
priority: high
type: bug
ordinal: 639000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
PR #113 is based on Groma 0.5.0 and stores relationships in the retired central document. The current comparison Action uses Groma 0.6.5 and rejects its flows because those relationships are no longer read. Synchronize the PR with current main so its comparison uses the current architecture profile, preserving the contributor changes and resolving integration conflicts. The requested result is successful current workflow jobs, not acceptance or merging of the audit PR into main.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 PR #113 compares from its updated merge base to its head and exports a valid architecture comparison with the current Groma profile.
- [x] #2 Integration retains current main behavior and the audit PR changes, with conflicts resolved and the repository check passing.
- [x] #3 The current architecture workflow has no failed comparison jobs, and current CI passes on Windows, Linux, and macOS.
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
1. Merge current main into PR #113 in an isolated branch; record inherited integration files and resolve the three conflicts in architecture.yml, groma-filesystem.ts, and markdown-emitter.ts while keeping current ownership and the PR changes. 2. Export the actual updated merge-base/head pair with the trusted released Groma CLI, treating PR sources as data. OKF links and C4 meaning stay unchanged; the PR gains the current source-owned relationship profile from main. No migration or compatibility reader is added. 3. Existing replacement, relationship, scanner, and viewer tests cover the integrated behavior. Add tests only for a reproduced integration failure not already covered. Run bun run check, own focused specification/quality review, and inspect the retained PR diff. 4. Push the updated contributor branch, run the current architecture workflow, and verify every comparison job and all current platform CI jobs. Do not merge the audit PR into main.

Conflict resolution: current main already supplies the atomic replacement requested by the audit, plus the project lock and index updates, so retain its single filesystem writer. Move the audit relationship escaping into withStoredRelationships, the current relationship storage owner, and adapt the existing escaping tests to source-owned relationship documents. Their authority and failure remain the audit PR rule that special file names must not split or inject stored relationship rows. Keep the round-trip, removal, HTTP-label, and complete-model cases; remove the redundant assertion of exact serialized bytes. This is integration of existing PR behavior, not a new compatibility API.

Windows run 37451043908 reproduced a test-fixture defect: chmod(0500) does not prevent temporary file creation on Windows. Preserve the failure/cleanup invariant using an occupied destination directory, which makes atomic rename fail on all supported hosts after the temporary file is written. Place the previous content inside that destination and assert it survives, the operation rejects, and no sibling temp remains. This extends the existing failed-write test; no new filesystem behavior, skip, mock, or abstraction. Convert both independent file tests to test.concurrent to match repository instructions.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
The three textual conflicts are resolved: the workflow keeps main comparison/deployment steps and the audit pins; GromaFileSystem uses main atomic replacement, project lock, and index maintenance; the removed central relationship emitter stays removed. The audit escaping helpers now belong to relationship-storage, and its existing regressions use source-owned documents. Focused filesystem and relationship checks pass: 10 tests, 43 assertions. Typecheck and git diff --check pass. The main/PR architecture difference is empty after integration, so existing C4 elements and flows retain exactly the meaning already approved on main.

Full bun run check passes: 798 Bun tests passed, 51 optional skips, zero failures, plus Node tests, lint and typecheck. The official Action comparison using released Groma 0.6.5 exported main b759b199 to integrated PR 9c71e41c: 16 modified components and no added/removed components or relationship changes. Integration specification and quality reviews pass: current architecture is unchanged from main; source-owned relationship escaping preserves the audit cases; current atomic filesystem implementation owns locking and replacement. The independent reusable Action version-selection fix is tracked at MrLesk/groma.md-action#5.

The audit Windows run exposed one inherited chmod-based test fixture failure: the permission change did not block writing on Windows. The test now forces rename failure with a non-empty destination directory, checks exact preservation of its previous content, and verifies temporary cleanup. Existing successful replacement coverage still proves preservation of the previous file inode. Both file tests now run concurrently with independent fixtures. Focused checks pass (6 tests, 17 assertions); full bun run check passes (798 Bun, 51 optional skips, zero failures, plus Node/lint/types). Own targeted specification and quality re-review found no further blocking issue. The new manual architecture workflow passed every job on main in run 37452946605 and its published page contains both requested commits and all three views.

Runner verification: installed Bun and packageManager both report 1.4.2. Official Bun test documentation confirms test.concurrent schedules tests within a file; --parallel schedules files. The two changed tests own separate temp fixtures and no global state. Existing runner options stay unchanged. https://bun.com/docs/test#concurrent-test-execution

Final CI run 37453651554 passed on Windows, Linux, and macOS for source commit 6151fce4. Windows explicitly passed the corrected failure/cleanup test and finished with 823 Bun tests passed, 26 skips, zero failures. Main CI 37452943855 passed all three hosts. Automatic fork event 37453649203 passed with comparison skipped; manual run 37453785798 passed every comparison, build, deployment and comment job for the exact #113 head. Action v1.1.0 is released with green Check runs. All specification, quality, and task criteria now pass. PR #113 remains open; no audit code was merged into main.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Updated PR #113 to current main and preserved its audit fixes through the filesystem and relationship-storage refactor. Its current architecture exports correctly with the released CLI. A Unix-permission-only failure fixture now tests failed atomic replacement and cleanup on every host. The source passes Linux, macOS, and Windows CI. The reusable manual fork policy and reader pin shipped separately in Action v1.1.0 and merged Groma PR #115; both automatic and manual main workflows are green. The audit PR remains open for review.
<!-- SECTION:FINAL_SUMMARY:END -->
