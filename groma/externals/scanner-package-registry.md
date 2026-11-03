---
type: C4 System
title: Scanner package registry
status: stable
groma:
  id: scanner-package-registry
  icon: groma:cloud
  color: '#748798'
description: Publishes scanner packages and the metadata Groma uses to install them
---

Publishes scanner package versions, compatibility metadata, and downloadable packages. Groma queries the configured npm-compatible registry and installs the selected scanner release through Bun. The public npm registry is the default.
