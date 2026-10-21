---
id: TASK-624.1
title: Update native scanner dependencies and toolchains for the security hotfix
status: Done
assignee:
  - '@native-scanners'
created_date: '2026-10-21T10:52:00Z'
updated_date: '2026-10-21T11:26:00Z'
labels: []
dependencies: []
references:
  - plugins/scanners/go
  - plugins/scanners/rust
  - plugins/scanners/csharp
  - plugins/scanners/dart
  - plugins/scanners/swift
  - .github/actions/setup-swift/action.yml
modified_files:
  - plugins/scanners/go/worker/go.mod
  - plugins/scanners/go/worker/main.go
  - plugins/scanners/go/build.ts
  - plugins/scanners/dart/worker/pubspec.yaml
  - plugins/scanners/dart/build.ts
  - plugins/scanners/dart/src/index.ts
  - docs/scanners/dart/index.md
  - plugins/scanners/rust/native/Cargo.toml
  - plugins/scanners/rust/upstream-licenses.json
  - plugins/scanners/swift/Package.swift
  - .github/actions/setup-swift/action.yml
  - docs/scanners/swift/index.md
  - plugins/scanners/csharp/dotnet/test/Groma.CSharpScanner.Tests.csproj
  - plugins/scanners/go/package.json
  - plugins/scanners/rust/package.json
  - plugins/scanners/csharp/package.json
  - plugins/scanners/dart/package.json
  - plugins/scanners/swift/package.json
  - plugins/scanners/rust/native/src/scan.rs
  - plugins/scanners/go/worker/go.sum
  - plugins/scanners/rust/native/Cargo.lock
  - plugins/scanners/dart/worker/pubspec.lock
  - plugins/scanners/rust/native/src/tokens.rs
  - plugins/scanners/rust/native/src/url.rs
  - plugins/scanners/rust/native/src/endpoints.rs
  - plugins/scanners/rust/native/src/handlers.rs
  - plugins/scanners/rust/native/src/outline.rs
  - plugins/scanners/rust/notices.ts
  - plugins/scanners/csharp/dotnet/Groma.CSharpScanner.csproj
  - plugins/scanners/csharp/dotnet/packages.lock.json
  - plugins/scanners/csharp/dotnet/test/ProjectGraphTests.cs
  - plugins/scanners/csharp/dotnet/test/CoverageTests.cs
  - plugins/scanners/csharp/dotnet/test/ScannerTests.cs
  - plugins/scanners/csharp/dotnet/test/OutlineTests.cs
  - plugins/scanners/csharp/dotnet/test/ScannerFixture.cs
parent_task_id: TASK-624
priority: high
type: chore
ordinal: 691000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Refresh Go, Rust, .NET, Dart, and Swift scanner build inputs in the coordinated October security hotfix, including native package locks and current stable compiler releases.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 All native scanner dependency and compiler pins are checked against current primary release sources and upgraded where compatible
- [x] #2 Native locks are regenerated and changed scanner builds or focused tests pass, with unavailable platform checks recorded
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
1. Inventory native package and compiler pins. 2. Verify latest stable releases through upstream registries and release metadata. 3. Upgrade pins, regenerate locks, and fix native API changes. 4. Run available native build and test checks and report CI toolchain requirements to the parent task.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Checked Microsoft.Build/NET.StringTools18.11.0 and18.10.1: both support net11, while this scanner targets the latest stable net10. Retained18.9.6 rather than suppress unsupported-target warnings or depend on prerelease .NET11. Latest test SDK18.11.0, xunit2.9.3 and runner4.0.1 passed31 tests. Rust loader0.0.358 requires coherent ra_ap crate versions; adapted removed cfg/attribute APIs against the upstream sources. Existing scanner suites cover the preserved semantics; no new test inventory assertions added.

Latest Rust HIR compiled, but2 existing scanner cases panicked because the new type interner requires an attached database. Wrapped the complete semantic observation in the upstream attach_db context, preserving one database for the scan. Existing cfg/alias/call/request/lint suites cover this migration. Swift6.4.1 packaged successfully and7 focused tests passed; Dart3.13.6/analyzer14.6.0 packaged successfully and its packaged-source test passed29 assertions. OSV querybatch returned no advisories for222 native dependency versions.

Final native inputs: Go 1.27.3/x-tools 0.52.0/x-mod 0.42.0/x-sync 0.24.0; Rust 1.99.1 with the coherent latest rust-analyzer loader family 0.0.358 and updated transitive lock; Dart 3.13.6/analyzer 14.6.0; Swift 6.4.1/SwiftSyntax 604.0.0; .NET SDK 10.0.402/runtime 10.0.13, Roslyn 5.9.0, Humanizer 3.0.10, System.Composition 10.0.13. The native package versions were incremented for rebuilt runtimes. License sources and notices follow the exact new native dependencies. CI compiler pins are coordinated in the parent task.

Latest-major xUnit migration now uses xunit.v3.mtp-off 4.0.2 with Test SDK 18.11.0, Visual Studio runner 4.0.1 and analyzers 2.2.0. This is the upstream-supported newest framework package for the existing VSTest path; the default MTP v2 package requires a separate global test-runner selection on .NET 10. Tests are executable projects and pass the new cancellation-token analyzer requirements without suppressions.

Linux validation: Go worker/package build and all 13 scanner cases verified (the mixed TypeScript case passed on rerun after the parent SDK migration); Rust release/package/license build and 13 focused cases pass; Swift package build and 7 focused cases pass; Dart package build and packaged-source case pass with 29 assertions; C# self-contained package builds, 31 native unit cases and 9 packaged integration cases pass. git diff --check is clean. No groma/ architecture changes were generated for these existing files. macOS/Windows native builds remain required CI gates; the parent owns full bun run check.

Dart trust investigation found both the launcher certificate flag and DART_VM_OPTIONS ineffective for dartdev Pub. The builder now invokes the pinned SDK dartaotruntime with an explicit filtered CA file and requires newly generated package_config.json because standalone dartdev has no parent IPC exit-code propagation. Real localhost Pub registries signed through the compromised intermediate key prove original-root controls download successfully, while filtered eMudhra-root and AAA cross-sign paths both fail TLS before any HTTP request and produce no package config. A normal package build and its packaged scanner test pass using that exact path. Runtime/platform/explicit extra CA authorities are retained after incident-key filtering.

Advisory coverage: current OSV querybatch returns zero matches for all 222 production native lock entries (187 crates.io, 5 Go including stdlib, 18 Pub, 12 NuGet). NuGet vulnerable/include-transitive audit covers the test project and referenced production project. This is known-advisory coverage, not a proof of absence. Swift toolchain and SwiftSyntax were checked against official release sources rather than claimed as a generic advisory scan. Native installed workers perform no dependency network during scans. Windows/macOS native NuGet trust is tracked separately in TASK-624.4 and must be proven in hosted CI before release.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Updated all five native scanner toolchains and compatible dependency sets, regenerated native locks, fixed rust-analyzer and xUnit breaking APIs, refreshed license provenance and package versions, and secured Dart Pub downloads with a directly proven CA override. All available Linux native package builds and focused suites pass; cross-platform CI and hosted .NET trust proof remain coordinated release gates in the parent task.
<!-- SECTION:FINAL_SUMMARY:END -->
