---
id: TASK-684
title: Carry 0.7 groups into group records when a project loads
status: Done
assignee:
  - '@claude'
created_date: '2026-11-24T20:23:00Z'
updated_date: '2026-11-24T20:58:00Z'
labels: []
dependencies: []
modified_files:
  - >-
    backlog/tasks/task-684 -
    Carry-0.7-groups-into-group-records-when-a-project-loads.md
  - src/group.ts
  - src/markdown-emitter.ts
  - src/group-upgrade.ts
  - src/architecture-reader.ts
  - docs/component-markdown.md
  - test-bun/group-records.test.ts
  - groma/systems/groma-md/containers/cli/components/curate.md
  - src/architecture-model.ts
ordinal: 719000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
groma 0.7 named a component's group in its own `groma.group` field. Since TASK-657 each group is a record under `groups/`, and the reader refuses the old field, so every project that used groups in 0.7 stops loading after the upgrade ("unsupported groma field(s): group"), and so does every older revision opened from git, including groma's own history before TASK-657. An upgrade must carry such a project over by itself; people should not have to find a changelog and edit files by hand.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A project whose components carry the 0.7 `groma.group` field loads, and the components of one container that name the same group are the members of one group of that name
- [x] #2 The first load stores the conversion: each group becomes the record that `groma add group` writes, and the `group` field leaves the component documents, so later loads find nothing to convert
- [x] #3 Older revisions read from git, such as `groma export --revision` and revision comparison, load with their groups converted the same way, and the repository is not changed
- [x] #4 A `group` field on a container or on a component without a container is removed without creating a group, because a group holds components of one container
- [x] #5 docs/component-markdown.md says that 0.7 group fields are converted on the first load
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
1. src/architecture-model.ts: idConflict says why a new record cannot take an id; freeId uses it, with the same messages.
2. src/group.ts: the rules of addGroup (join the container's group of exactly this title, else create the record <container-id>-<kebab name>) are groupingWrites. addGroup uses it, and so does addGroups, which plans several groups against the records as they were, checks all writes together, then stores them. A batch input carries the id its new record gets. inWriteOrder keeps the write order in one place: records a component leaves before the one it joins.
3. src/markdown-emitter.ts: withoutGroupField removes the 0.7 `group` field from a document.
4. src/group-upgrade.ts: upgradeGroupFields finds element documents with `groma.group`, builds the model from the documents without the field, maps the named groups of each container to batch inputs, calls addGroups, then writes the documents without the field. When the usual id is taken, the record gets the first free numbered id, because a conversion must never stop a load. A container, a component without a container, or a name with no letter or digit loses the field without a group. A conversion interrupted after the records were written joins them on the next load.
5. src/architecture-reader.ts: loadArchitecture runs the upgrade inside its access lock and reads again when it converted something. Revision snapshots load through the same function, so they convert inside their temporary copy.
6. docs/component-markdown.md: one paragraph in the Groups section.
7. Tests in test-bun/group-records.test.ts. Rule: Alex asked on 2026-11-24 that upgrading never breaks projects with groups; reproduced: `groma export --revision v0.7.8` fails with "unsupported groma field(s): group". (a) The edit fixture with `group: Checks` on orders, stock, the api container and a component without a container: one load gives group api-checks with orders and stock, and no document keeps the field. Wrong results caught: the load throws, the groups are lost, a container or a component without a container stops the load. (b) An element already has the id api-checks: the converted group gets api-checks-2. Wrong result caught: the load throws `id "api-checks" already exists`. Gap: no test loaded 0.7 group fields.
8. bun run check, codehygiene, `groma export --revision v0.7.8`, and groma's own v0.7.8 tree converted in a scratch repository.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Reproduced on origin/main e4a28bfd: `groma export --revision v0.7.8` failed with `groma/systems/groma-md/containers/cli/components/angular-src-index.md: unsupported groma field(s): group`. With the fix the export succeeds, its snapshot holds the v0.7.8 groups as records (for example cli-language-analysis), and the repository's groma/ is not changed by it.

groma's own v0.7.8 tree, copied into a scratch Git repository: one `groma view --plain` converted 102 fields into 18 records (17 names; Project work exists in two containers). Each component lost only its group line (103 files: 102 components and index.md). A second load changed nothing.

Each new test fails with the conversion switched off, without the container filter, or without the free-id numbering, and passes with them.

Reviews. Full-context fork: kept the approach; the batch write order moved into group.ts (addGroups, inWriteOrder), grouping was renamed groupingWrites, and the load's only write is documented. Cold review: found that a taken record id stopped the load (fixed with numbered ids, test b), that the batch contract was misleading (addGroups now says it plans against the records before the call and stores the writes one by one), that "once" was wrong for revisions (docs and comments fixed), and that the plan was out of date (replaced). It also asked whether a load that writes fits the rule "Reading never writes": that rule governs web map panes; this is a one-time storage upgrade inside the core load, as the 0.7.0 scanners.json conversion was. Raised with Alex in the pull request.

Architecture: the scan placed src/group-upgrade.ts as a stand-alone component; moved into cli and combined into curate, which owns src/group.ts. The scan also adds a derived relationship to export/components/island.md caused by TASK-672's source; left out of this task.

codehygiene: one duplicate_block flag at src/group-upgrade.ts:23 (the call of oldGroupName), a false positive; older flags in architecture-reader.ts and an earlier test are outside this change.

Final bun run check after both reviews: passed (954 Bun and 28 Node tests, 0 failures; the 2 Biome warnings are in files outside this change).

Codex review on pull request 244 (P2): groups were keyed by their kebab-case id, so `Order checks` in container `api` and `Checks` in container `api-order` merged into one group spanning two containers (the load still failed), and `Order checks` and `Order-checks` in one container silently became one group. Groups are now keyed by their container and exact name; only the record id is normalized and numbered. Test b covers two names that differ only in letter case (api-checks-2 and api-checks-3) and fails with the old keying. bun run check passed again (954 Bun and 28 Node tests).

Windows CI failed both new tests: a Windows checkout stores the edit fixture with CRLF line endings, and the test helper that writes the 0.7 field matched LF only (its own guard reported it). The helper now normalizes line endings first; both tests pass on the fixture converted to CRLF and on LF. The conversion itself was not affected: withoutGroupField normalizes line endings like every groma write.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
groma 0.8 refused the 0.7 `groma.group` field, so every 0.7 project with groups, and every revision before TASK-657, stopped loading. loadArchitecture now converts such a tree (src/group-upgrade.ts): the components of one container that name a group become a record made by the same rules as `groma add group` (addGroups in src/group.ts), a taken id becomes the next free numbered id, and the field is removed, so a working copy converts once. Old revisions convert inside their temporary snapshot; the repository does not change.

Verified: `groma export --revision v0.7.8` works again; groma's own v0.7.8 tree converts 102 fields into 18 records with only the group lines removed, and a second load changes nothing; two tests in test-bun/group-records.test.ts fail without the conversion, the container filter, or the id numbering; bun run check passes.

Risk: the first load of a 0.7 project writes files, the only write a load makes. Follow-up outside this task: main's groma/ lacks one derived relationship in export/components/island.md caused by TASK-672.
<!-- SECTION:FINAL_SUMMARY:END -->
