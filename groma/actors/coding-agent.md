---
type: C4 Actor
title: Coding agent
status: stable
groma:
  id: coding-agent
description: An AI assistant that reads and changes architecture through the Groma CLI
---

An AI assistant that uses Groma while carrying out a developer request. Reads architecture and source evidence, runs scans, plans changes, and curates responsibilities and relationships through the CLI. The assistant initiates these actions; Groma validates and stores the requested architecture changes.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [Coding agent](coding-agent.md "coding-agent") | [Command interface](../systems/groma-md/containers/cli/components/src-cli.md "src-cli") | Curates architecture | Groma CLI |
