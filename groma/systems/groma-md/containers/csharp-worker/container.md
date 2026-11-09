---
type: C4 Container
title: C# worker
status: stable
tags:
  - scanning
groma:
  id: csharp-worker
  parent: groma-md
  technology: C#, Roslyn
  color: pink
description: Analyses C# source in a separate .NET process
---

Runs C# source analysis in a separate .NET process using Roslyn. Returns declarations, operations, HTTP evidence and source outlines to the Groma scanner adapter.
