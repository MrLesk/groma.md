---
type: Groma Flow
title: Curate an architecture record
groma:
  id: curate-an-architecture-record
---

A developer inspects source evidence and chooses an existing architecture record to describe. The developer runs groma edit with an overview. Groma validates the request and writes that record as Markdown; a later read or the open map shows the authored explanation. This scenario changes meaning, not source ownership.

## Steps

| From | To | Action |
| --- | --- | --- |
| [Developer](../actors/developer.md "developer") | [Command interface](../systems/groma-md/containers/cli/components/src-cli.md "src-cli") | Submit groma edit for an existing element with its overview |
| [Command interface](../systems/groma-md/containers/cli/components/src-cli.md "src-cli") | [Architecture changes](../systems/groma-md/containers/cli/components/src-authoring.md "src-authoring") | Dispatch the explicit architecture edit |
| [Architecture changes](../systems/groma-md/containers/cli/components/src-authoring.md "src-authoring") | [Markdown storage](../systems/groma-md/containers/cli/components/src-architecture-reader.md "src-architecture-reader") | Write the validated overview to the element record |
