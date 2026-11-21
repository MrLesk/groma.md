---
type: Groma Flow
title: Coding agent curates architecture
groma:
  id: coding-agent-curates-architecture
---

An AI assistant uses Groma while carrying out a developer request. After inspecting the source and current architecture, it submits an explicit overview edit through the CLI. Groma validates and writes the record, then reports the result to the assistant. The assistant owns the reasoning; Groma owns validation and persistence of the requested change.

## Steps

| From | To | Action |
| --- | --- | --- |
| [Coding agent](../actors/coding-agent.md "coding-agent") | [Command interface](../systems/groma-md/containers/cli/components/src-cli.md "src-cli") | Submit an evidence-based groma edit for an existing element |
| [Command interface](../systems/groma-md/containers/cli/components/src-cli.md "src-cli") | [Architecture changes](../systems/groma-md/containers/cli/components/src-authoring.md "src-authoring") | Dispatch the requested architecture edit |
| [Architecture changes](../systems/groma-md/containers/cli/components/src-authoring.md "src-authoring") | [Markdown storage](../systems/groma-md/containers/cli/components/src-architecture-reader.md "src-architecture-reader") | Persist the validated explanation in Markdown |
