# Describing elements

Read a record with `groma view <id>` before changing it.

## Writing useful annotations

Write for a developer who knows the language but is new to this project. Use
the C4 meanings in `groma agent-instructions` to decide what the record should
explain.

- The title names the role or responsibility people should recognize on the
  map. A source filename is useful only when it communicates that meaning.
- The description answers what this element does for the project in one short
  summary.
- The overview adds the context needed to understand that responsibility:
  where work enters, the important behavior, and which other parts it relies
  on. Describe only what applies to this element; avoid a file or function
  inventory.
- Technology names the actual implementation or storage technology when it
  helps a reader understand the element. Leave it unset when unknown.
- Tags name the categories that cut across the hierarchy and that the project's
  people already use, such as a business area or an owning team. Reuse the tags
  other elements, groups, and flows carry before adding a new one, and leave a record untagged
  when no category applies.

Use code, project documentation, and confirmed user context to support these
claims. Keep useful existing annotations, and report missing knowledge instead
of writing guesses. Optional fields need content only when they add meaning.

## Commands

| Command | Target | Options |
| --- | --- | --- |
| `groma edit <id>` | an actor, system, external system, container, or component ID | `--title`, `--description`, `--overview`, `--technology`, `--add-tags`, `--remove-tags`, `--color`, `--icon` |
| `groma edit <id> <ids...>` | several element IDs | `--add-tags`, `--remove-tags`, `--color`, `--icon` |
| `groma edit <group-id>` | a group ID | `--title`, `--description`, `--overview`, `--add-tags`, `--remove-tags`, `--color`, `--icon` |
| `groma edit <flow-id>` | a flow ID | `--title`, `--description`, `--overview`, `--steps`, `--add-tags`, `--remove-tags` |
| `groma edit <draft-id>` | a draft ID | `--title`, `--overview` |
| `groma edit project` | the word `project`, meaning the project record | `--title`, `--description`, `--overview` |

`--title` renames the record; its ID stays. An empty `--description` or
`--technology` value removes that field. An empty `--overview` clears the overview
on records that allow it. A flow requires its overview.
`--add-tags` and `--remove-tags` each take a comma-separated list. Each named
record keeps its other tags. A tag can appear in only one of the two lists.
Several element IDs take the same changes in one edit. Focusing a group's tag
lights its members. Focusing a flow's tag lights its step ends. A filtered export
keeps those elements and their parents on include. Excluding a group tag removes
the group and its members. Excluding a flow tag removes the flow and leaves its
ends eligible.
`--color` and `--icon` each take one of the names
`groma edit --help` lists and only change how the element or group looks on the map; set
them when the user asks for it. `groma view` has no `project` target: the project record is
`<groma-root>/project.md`. Read that file, and change it only through
`groma edit project`.

## Description and overview

`--description` is an optional short summary, stored in the standard
`description` field of Open Knowledge Format (OKF). `--overview` is the fuller
explanation in the Markdown body. Ordinary Markdown and OKF readers can read
both; groma.md uses them as the concept's summary and responsibility text. Avoid
repeating the same paragraph in both:

```sh
groma edit entry --description 'Request coordinator' \
  --overview 'Receives requests, validates their input, and dispatches work to the worker.'
```

## Completion check

Every visible element has a responsibility a new reader can understand. Read
the result with `groma view <id>` and check its name and explanation in the map.
The short description and overview should complement each other, and the
record should remain useful as ordinary Markdown outside groma.md.
