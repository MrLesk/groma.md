---
id: TASK-624.1
title: Update native scanner dependencies and toolchains for the security hotfix
status: Done
assignee:
  - '@native-scanners'
created_date: '2026-10-21T10:52:00Z'
updated_date: '2026-10-21T17:52:00Z'
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
