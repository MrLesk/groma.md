---
id: TASK-675
title: Show titles in the element links groma writes, with the id on hover
status: In Progress
assignee:
  - '@claude'
created_date: '2026-11-21T19:18:00Z'
updated_date: '2026-11-21T21:43:00Z'
labels:
  - personalization
milestone: m-6
dependencies:
  - TASK-657
references:
  - src/group.ts
  - src/relationship-storage.ts
  - src/flow-authoring.ts
  - src/edit.ts
  - src/curate-rename.ts
documentation:
  - docs/component-markdown.md
modified_files:
  - src/element-links.ts
  - src/group.ts
  - src/edit.ts
  - src/relationship-storage.ts
  - src/curate.ts
  - src/flow-authoring.ts
  - test-bun/element-links.test.ts
  - test-bun/group-records.test.ts
  - test-bun/rename.test.ts
  - groma/actors/coding-agent.md
  - groma/actors/developer.md
  - groma/flows/coding-agent-curates-architecture.md
  - groma/flows/curate-an-architecture-record.md
  - groma/flows/install-a-published-scanner.md
  - groma/flows/review-a-project-task.md
  - groma/flows/review-architecture-history.md
  - groma/flows/scan-project-source.md
  - groma/groups/cli-architecture-records.md
  - groma/groups/cli-browser-delivery.md
  - groma/groups/cli-language-analysis.md
  - groma/groups/cli-language-scanners.md
  - groma/groups/cli-map-layout.md
  - groma/groups/cli-plugins.md
  - groma/groups/cli-project-commands.md
  - groma/groups/cli-project-work.md
  - groma/groups/cli-scanner-management.md
  - groma/groups/cli-scanner-support.md
  - groma/groups/cli-shared-viewer-data.md
  - groma/groups/cli-source-scanning.md
  - groma/groups/cli-terminal-map.md
  - groma/groups/export-architecture-panels.md
  - groma/groups/export-browser-controls.md
  - groma/groups/export-browser-session.md
  - groma/groups/export-map-drawing.md
  - groma/groups/export-project-work.md
  - groma/systems/groma-md/containers/cli/components/backlog-src-index.md
  - groma/systems/groma-md/containers/cli/components/history-revisions.md
  - groma/systems/groma-md/containers/cli/components/package.md
  - test/fixtures/containers-view/groma/groups/web-pages.md
  - >-
    test/fixtures/core-view/groma/systems/shop/containers/api/components/orders.md
  - test/fixtures/flows/groma/actors/requester.md
  - test/fixtures/flows/groma/systems/service/containers/api/components/entry.md
  - test/fixtures/large-world/groma/actors/merchant.md
  - test/fixtures/large-world/groma/actors/shopper.md
  - test/fixtures/large-world/groma/groups/accounts-core.md
  - test/fixtures/large-world/groma/groups/accounts-support.md
  - test/fixtures/large-world/groma/groups/audit-core.md
  - test/fixtures/large-world/groma/groups/audit-support.md
  - test/fixtures/large-world/groma/groups/auth-core.md
  - test/fixtures/large-world/groma/groups/auth-support.md
  - test/fixtures/large-world/groma/groups/cart-core.md
  - test/fixtures/large-world/groma/groups/cart-support.md
  - test/fixtures/large-world/groma/groups/catalog-api-core.md
  - test/fixtures/large-world/groma/groups/catalog-api-support.md
  - test/fixtures/large-world/groma/groups/cdn-edge-core.md
  - test/fixtures/large-world/groma/groups/cdn-edge-support.md
  - test/fixtures/large-world/groma/groups/checkout-core.md
  - test/fixtures/large-world/groma/groups/checkout-support.md
  - test/fixtures/large-world/groma/groups/directory-core.md
  - test/fixtures/large-world/groma/groups/directory-support.md
  - test/fixtures/large-world/groma/groups/events-core.md
  - test/fixtures/large-world/groma/groups/events-support.md
  - test/fixtures/large-world/groma/groups/import-core.md
  - test/fixtures/large-world/groma/groups/import-support.md
  - test/fixtures/large-world/groma/groups/media-core.md
  - test/fixtures/large-world/groma/groups/media-support.md
  - test/fixtures/large-world/groma/groups/mobile-api-core.md
  - test/fixtures/large-world/groma/groups/mobile-api-support.md
  - test/fixtures/large-world/groma/groups/order-db-core.md
  - test/fixtures/large-world/groma/groups/order-db-support.md
  - test/fixtures/large-world/groma/groups/order-service-core.md
  - test/fixtures/large-world/groma/groups/order-service-support.md
  - test/fixtures/large-world/groma/groups/pricing-core.md
  - test/fixtures/large-world/groma/groups/pricing-support.md
  - test/fixtures/large-world/groma/groups/product-db-core.md
  - test/fixtures/large-world/groma/groups/product-db-support.md
  - test/fixtures/large-world/groma/groups/search-core.md
  - test/fixtures/large-world/groma/groups/search-support.md
  - test/fixtures/large-world/groma/groups/session-store-core.md
  - test/fixtures/large-world/groma/groups/session-store-support.md
  - test/fixtures/large-world/groma/groups/sessions-core.md
  - test/fixtures/large-world/groma/groups/sessions-support.md
  - test/fixtures/large-world/groma/groups/web-app-core.md
  - test/fixtures/large-world/groma/groups/web-app-support.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/media/components/media-client.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/audit/components/audit-client.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/events/components/events-client.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/session-store/components/session-store-client.md
  - test/fixtures/openclaw-view/groma/actors/operator.md
  - >-
    test/fixtures/openclaw-view/groma/systems/openclaw/containers/agent-runtime/container.md
  - >-
    test/fixtures/openclaw-view/groma/systems/openclaw/containers/channels/container.md
  - test/fixtures/plain-view/groma/actors/buyer.md
  - test/fixtures/plain-view/groma/groups/api-fulfilment.md
  - test/fixtures/validate/groma/actors/buyer.md
  - test/fixtures/validate/groma/groups/api-commerce.md
  - test/fixtures/validate/groma/systems/shop/system.md
  - test/fixtures/viewer-view/groma/actors/shop-architect.md
  - test/fixtures/viewer-view/groma/actors/shop-operator.md
  - test/fixtures/viewer-view/groma/systems/shop/system.md
  - docs/component-markdown.md
  - docs/agent-instructions/relationships.md
  - src/architecture-markdown.ts
  - groma/systems/groma-md/containers/cli/components/src-architecture-reader.md
  - src/curate-rename.ts
  - src/viewers/web/atoms/text.ts
  - src/viewers/web/organisms/sidebar-row.ts
  - src/viewers/web/organisms/hierarchy.ts
  - src/viewers/web/flow/list.ts
  - src/viewers/web/organisms/details.ts
  - src/viewers/web/organisms/relationship-card.ts
  - src/viewers/web/flow/reader.ts
  - src/viewers/web/search/view.ts
  - src/viewers/web/task-diff/view.ts
  - docs/viewers/web/index.md
type: feature
ordinal: 715000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
On 2026-11-21, during the walk of the Personalization Update, the owner looked at a group record whose Members list named components by id (fonts-index, iso-project, presentation) while the map names them by title (Map fonts, Map projection, Map view motion). He decided that member links show titles (TASK-657, criterion 7). Asked whether relationship rows should follow, he answered: "yes and id on hover. same for components in groups and in general".

A record is ordinary Markdown that people read on a forge or in an editor, so the text of a link is what they see; groma reads only the link target. Before this task the links groma keeps show three different things: a group's members show titles, a relationship row shows the id of an element end, and a flow's Steps keep whatever text the author typed, which goes stale when the element takes a new title. After a rename (groma edit <id> --id) every link target follows, but a relationship row keeps showing the old id.

This task gives every link to an element that groma keeps one form: the element's title as the text and its id as the Markdown link title, which viewers show on hover. A relationship endpoint that names a source file keeps its path as the text. It is a storage and authoring change: it adds no OKF concept, no C4 element and no map drawing.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A link to an element in a group's Members list, in a relationship row or in a flow's Steps table shows the element's title as its text and carries the element's id as the link title; a relationship endpoint that names a source file keeps its path
- [x] #2 groma add flow and groma edit <flow-id> --steps store each inline endpoint link in that form whatever text the author typed; a reference-style link, the Action cells and all prose stay as typed
- [x] #3 After groma edit <id> --title or --id, every such link to that element shows the new title or id
- [x] #4 groma's own records are stored in that form
- [x] #5 docs/component-markdown.md states the form and that groma reads membership, relationship ends and step ends from the link target alone
- [ ] #6 On the web map, a name that stands for an element in a list shows the element's id on hover: hierarchy rows, the actors of the flow list, the element lists of the details pane, relationship ends, flow step ends, search results and the elements a task names
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
1. One form in one place. src/element-links.ts holds elementLink (the element's title as the link text, its id as the link title) and withElementLinks, which writes again, in the sections groma keeps (Members, the three relationship sections, Steps), each inline link whose target is the document of one of the given elements. Every other link, the other cells and all prose stay as written.
2. Writers. withMembers (src/group.ts) and withStoredRelationships (src/relationship-storage.ts) write element links through elementLink; a relationship endpoint that names a source file keeps [path](target). addFlow and editFlow with --steps pass the record through withElementLinks before it is checked and written.
3. Upkeep. After groma edit <id> --title or --id, editElement (src/edit.ts) calls relinkElement, which reloads the records and writes again every record that links the element. It replaces relistedWrites and relistInGroups of TASK-657, which covered group members and titles only.
4. Data. groma's own records are written again with withElementLinks over every element (scratch tool, no migration code). Fixture records change only where a test reads their stored text.
5. Docs: docs/component-markdown.md (Relationships, Groups, Flows) and the agent guide for flows.
6. Tests, in test-bun/element-links.test.ts on the edit fixture. (a) Rule: a link to an element that groma keeps shows the title and carries the id (the owner, 2026-11-21). Wrong result: a relationship row, a member or a flow step that shows an id or the author's text, a file endpoint that loses its path, or a title with a pipe that splits its table cell. Gap: no test reads the stored form of a row or a step. (b) Rule: a new title or id reaches every record that links the element. Wrong result: a row, a member or a step keeps the old title after --title or the old id after --id. Gap: the group case of TASK-657 covers members and titles only; it moves here.

Changed while building: withElementLinks takes the sections of the record at hand, and each domain names its own (relationshipSections in src/relationship-storage.ts, stepsSection in src/flow-authoring.ts, membersSection in src/group.ts), so a section of the same name that an author wrote in another kind of record is left alone. sectionOfEachLine in src/architecture-markdown.ts says which section a line belongs to and ignores headings in fenced code; withoutRelationshipSections uses it too. relinkElement lives in src/edit.ts, beside the edit that calls it, and src/element-links.ts reads no files. Fixtures: every stored fixture record is written in the form as well, except test/fixtures/flows/groma/flows/process-request.md, which is hand-authored with reference-style links on purpose.

After the review round: withElementLinks writes again only the links that name an element, a list item and the first two cells of a table row (endsAndRest), so an Action or Description cell and prose in the section stay the author's; linkText writes a title on one line; the target part of an inline link is one pattern shared with the rename (inlineLinkTarget in src/architecture-markdown.ts). Tests extended in the same two cases: (a) the author's own links in an Action cell and under the table keep their text and get no title (wrong result: groma rewrites the author's sentence; gap: the first version of the case had no such link); (b) a title with a line break (wrong result: the row breaks and no load succeeds afterwards; gap: the odd title had no line break).

Web map (the owner, 2026-11-21, to "Should the map's own lists show the id on hover too?": "Yes, on the map too"). showIdOnHover in src/viewers/web/atoms/text.ts sets a name's hover text to the element's id, the way panes already show hover text. Every builder of a list that names elements calls it: sidebarRow (hierarchy rows and the flow list's actors), elementLinks (children, group members, the selection), the ends of a relationship card, the ends of a flow step, an element's search result and the elements a task names. The pane's own heading and the names drawn on the map are not lists and stay as they are. No new test: the web viewer has no DOM harness for these builders, so the names' hover texts are read on the live review map.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Decision, the owner, 2026-11-21, on "Should relationship rows show titles too?": "yes and id on hover. same for components in groups and in general". Read as: every link to an element that groma keeps in its records shows the title and carries the id as the Markdown link title. Not read as a change to the web map, whose lists show titles with no id on hover; that reading is open with the owner.

Built: src/element-links.ts (elementLink, withElementLinks), the three section names in their domains, sectionOfEachLine in src/architecture-markdown.ts, relinkElement in src/edit.ts. relistedWrites and relistInGroups of TASK-657 are removed: relinkElement covers them.

Reviews, one round, run in parallel on commit 566bf631 (cold simplicity review and full-context review). Both kept the approach. Defects fixed, each with a test that fails on that commit: (1) every inline link to an element in a kept section was written again, also one in an Action or Description cell or in a sentence under the table; now only a list item and the first two cells of a table row are (endsAndRest). (2) a title with a line break ended the table row and no load succeeded afterwards; linkText now writes the title on one line. Simplifications applied: the target part of an inline link is one pattern shared with the rename (inlineLinkTarget); linksTo and elementsByDocument are gone; each heading is spelled once per domain; two comments corrected. Not changed, stated in the contract: a reference-style link and an inline link whose text has brackets of its own stay as typed.

Verification. By hand on copies of test/fixtures/edit: a relationship row, a group and a flow written with other link texts are stored as [Title](target "id"); groma edit --title names the records it changed and they show the new title; groma edit --id leaves the new id on hover in rows, members and steps; a reference-style end, a link in the Action cell and a title with a line break behave as the criteria say. groma's own 29 records and 60 fixture records were written again with withElementLinks over every element (scratch tool); a second pass changes nothing, and no line outside a table or a list changed. test/fixtures/flows/groma/flows/process-request.md stays hand-authored with reference links. The new file src/element-links.ts was scanned as a stand-alone component and folded into Markdown storage (src-architecture-reader). bun run check: 28 Node tests and 1012 Bun tests pass, 67 skip, 0 fail; the 2 lint warnings are older and in other files.

Open with the owner (not built): whether the web map's lists should show the id on hover too; whether groma should store reference-style step ends inline. Outside this task: scripts/large-world-fixture.ts still writes groma.group and a three-column relationship table, so running it would replace that fixture with records the loader refuses; a source-file endpoint's path is written unescaped, so a path such as src/__tests__/a.test.ts renders with bold text.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Every link to an element that groma keeps in its records, in a group's Members, in relationship rows and in a flow's Steps, is written as [Title](target "id"): the title as the text and the id as the link title, which Markdown viewers show on hover. A relationship end that names a source file keeps its path. The form has one writer, elementLink in src/element-links.ts; withElementLinks writes it again in place for the two cells or the list item that name an element, and leaves the author's cells, prose and reference-style links as typed. groma edit <id> --title or --id reaches every record that links the element through relinkElement in src/edit.ts and names the records it changed. Loading still reads the link target alone. groma's own records and the fixture records are stored in the form; docs/component-markdown.md has an Element links section. bun run check passes. Open with the owner: the id on hover in the web map's lists, and reference-style step ends.
<!-- SECTION:FINAL_SUMMARY:END -->
