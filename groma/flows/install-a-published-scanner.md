---
type: Groma Flow
title: Install a published scanner
groma:
  id: install-a-published-scanner
---

A developer runs groma scanner add with a published package name. Groma resolves a compatible release from the configured npm-compatible registry, installs it, validates the package, and records the exact selected source in project scanner settings. The scanner is then available for the next scan.

## Steps

| From | To | Action |
| --- | --- | --- |
| [Developer](../actors/developer.md "developer") | [Command interface](../systems/groma-md/containers/cli/components/src-cli.md "src-cli") | Run groma scanner add with a published package name |
| [Command interface](../systems/groma-md/containers/cli/components/src-cli.md "src-cli") | [Plugin packages](../systems/groma-md/containers/cli/components/package.md "package") | Resolve and install the requested scanner |
| [Plugin packages](../systems/groma-md/containers/cli/components/package.md "package") | [Scanner package registry](../externals/scanner-package-registry.md "scanner-package-registry") | Read compatible releases, then download the selected package and dependencies |
