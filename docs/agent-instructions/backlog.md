# Backlog task links

When the `backlog` CLI is available and you work on a Backlog task, keep the
task's planning references and changed files current. References attach planned
work before editing starts; modified files attach actual work through their
current component owners. Routine code work does not require a full scan and
curation cycle.

## Commands

| Command | Target |
| --- | --- |
| `backlog task view <task-id> --plain` | a Backlog task ID; shows the current modified-file list and references |
| `backlog task edit <task-id> --modified-file <path>` | repository-relative paths; the flags replace the complete list |
| `backlog task edit <task-id> --add-ref <reference>` or `--remove-ref <reference>` | exact element IDs or repository-relative source files for architecture links; other values remain context |
| `groma view <source-file>` | an exact repository-relative source file; prints its owning component's ID and the file's relationships |

When planning, reference the intended elements or their exact source files.
Element IDs also link actors, systems, drafts, and architecture-only work.
Titles, group addresses, and issue URLs remain context. A file only maps once
the loaded architecture records its owner; References do not declare ownership.

## Review priority

Before changing files, read the critical and high elements listed by
`groma agent-instructions`. Levels are `low`, `normal`, `high`, and `critical`;
an unset level inherits through parents and defaults to `normal`. Files take
the level of their owner. Critical elements require explicit permission from
a person before an agent changes them. Explain each high-element change in
the task's implementation notes. `groma lint` reports in-progress and done
tasks whose modified files belong to critical components for human review.

## After each file change

1. Read the task with `backlog task view <task-id> --plain` before changing
   code.
2. Immediately after changing a repository file, and before changing another
   file, record its path. Preserve every existing entry and append each newly
   changed path, one flag per file in the order the files were first changed.
3. Modified source files already link their current owners. Add an element ID
   only for affected architecture scope not covered by those files.

```bash
backlog task edit <task-id> \
  --modified-file <previous-path> \
  --modified-file <new-path>
```

Use the Backlog CLI; do not edit task Markdown directly. Do not wait until
testing or task completion to record these links.

## After a structural command

Structural commands print `ok`, then the target ID or group address, then their
completed writes:

- `created:`, `changed:`, or `removed:` names a repository-relative
  architecture path.
- `affected:` names an element whose document was written or removed.
- `replaced: <absorbed-id> -> <surviving-id>` means a combine removed the
  absorbed element into the survivor, or a rename replaced the old ID with the
  new one. Either way, remove the old reference and add the new one.

Moves report both paths and keep the same ID. Group commands report member
IDs. groma.md does not save these results as ID aliases or operation history.

Immediately after a structural command, before any further change, record all
its created, changed, and removed paths in one Backlog update. Preserve the
complete existing modified-file list and append paths not already recorded.
Add the affected IDs that survive. For each replacement, remove the absorbed
ID and add the surviving ID:

```bash
backlog task edit <task-id> \
  --modified-file <previous-path> \
  --modified-file <created-or-changed-path> \
  --modified-file <removed-path> \
  --add-ref <surviving-id> \
  --remove-ref <absorbed-id>
```

Repeat `--modified-file`, `--add-ref`, and `--remove-ref` as needed.
