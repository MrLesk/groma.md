---
id: TASK-632
title: Add Ruby on Rails scanner support
status: In Progress
assignee:
  - '@codex'
created_date: '2026-10-25T15:52:00Z'
updated_date: '2026-10-25T17:59:00Z'
labels: []
dependencies: []
references:
  - plugins/scanners/ruby/src/index.ts
  - src/scanner/modules/official-catalog.ts
  - scripts/scanner-release.ts
  - docs/scanners/creating-a-plugin.md
modified_files:
  - features/ruby-rails.feature
  - plugins/scanners/ruby/package.json
  - plugins/scanners/ruby/build.ts
  - plugins/scanners/ruby/src/parser.ts
  - bun.lock
  - plugins/scanners/ruby/src/source.ts
  - plugins/scanners/ruby/src/routes.ts
  - plugins/scanners/ruby/src/index.ts
  - docs/scanners/ruby/index.md
  - docs/scanners/ruby/validation.md
  - test/fixtures/ruby-rails/Gemfile
  - test/fixtures/ruby-rails/app/controllers/orders_controller.rb
  - test/fixtures/ruby-rails/app/controllers/admin/orders_controller.rb
  - test/fixtures/ruby-rails/app/models/order.rb
  - test/fixtures/ruby-rails/config/routes.rb
  - test/fixtures/ruby-rails/spec/broken_spec.rb
  - src/scanner/modules/official-catalog.ts
  - scripts/scanner-release.ts
  - test-bun/scanner-fresh-checkout.test.ts
  - .github/workflows/ci.yml
  - test-bun/ruby-scanner.test.ts
  - README.md
  - docs/scanners/index.md
  - docs/scanners/creating-a-plugin.md
  - test/fixtures/ruby-rails-constructs/config/routes.rb
  - test/fixtures/ruby-rails-constructs/app/controllers/api/people_controller.rb
  - test/fixtures/ruby-rails-constructs/app/controllers/api/notes_controller.rb
  - >-
    test/fixtures/ruby-rails-constructs/app/controllers/api/profiles_controller.rb
  - test/fixtures/ruby-rails-constructs/constructs.rb
  - test-bun/ruby-constructs.test.ts
  - test/fixtures/ruby-coverage/Gemfile
  - test/fixtures/ruby-coverage/tool.gemspec
  - test/fixtures/ruby-coverage/exe/inspect
  - test/fixtures/ruby-coverage/lib/command.rb
  - test/fixtures/ruby-coverage/packages/library/Gemfile
  - test/fixtures/ruby-coverage/packages/library/shared.rb
  - test/fixtures/ruby-coverage/config.ru
  - test/fixtures/ruby-coverage/config/environment.rb
  - test/fixtures/ruby-coverage/config/application.rb
  - test/fixtures/ruby-coverage/app/controllers/items_controller.rb
  - test/fixtures/ruby-coverage/config/routes.rb
  - test/fixtures/ruby-coverage/run.rb
  - test/fixtures/ruby-coverage/compared.rb
  - test-bun/ruby-coverage.test.ts
  - plugins/scanners/ruby/src/syntax.ts
  - plugins/scanners/ruby/src/tokens.ts
  - plugins/scanners/ruby/src/projects.ts
  - plugins/scanners/ruby/src/entries.ts
  - test/fixtures/ruby-coverage/clients.rb
  - test-bun/ruby-http.test.ts
  - plugins/scanners/ruby/src/http-values.ts
  - plugins/scanners/ruby/src/clients.ts
  - test/fixtures/ruby-http-blocked/config/routes.rb
  - test/fixtures/ruby-http-blocked/app/controllers/items_controller.rb
  - test/fixtures/ruby-http-blocked/client.rb
  - test/fixtures/ruby-coverage/constructed.rb
  - docs/scanners/evidence.md
  - docs/architecture-findings.md
type: feature
ordinal: 699000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ruby on Rails projects currently have no language scanner, so developers cannot inspect their source through the same scan and Code flows as other supported ecosystems.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A packaged scanner scans a Rails example without Ruby, Bundler, application dependencies or application execution.
- [x] #2 Ruby source listing, declarations and code outlines follow the existing scanner contract.
- [x] #3 Rails discovery and supported route evidence integrate with the existing scanner catalog and observation contracts.
- [x] #4 Contribution scenario, scanner documentation and focused validation describe the supported example and limitations.
- [x] #5 Standard Rails resource blocks preserve parent routes, nested plural/singular resources, member and collection routes, and literal percent-i action filters with correct paths and controller actions.
- [x] #6 Ruby singleton-class methods, ActiveSupport Concern class_methods, and nested-class method operations are reported with correct ownership and visibility; nested types remain absent from Code outlines.
- [x] #7 Ruby sources retain nearest declared Gemfile or gemspec project membership, including nested project roots, without treating roots as C4 boundaries.
- [x] #8 Ruby command guards, declared gem executables and Rack/Rails launch declarations supply execution entries and selected local source membership through the existing placement contract.
- [x] #9 Supported standard-library and common Ruby HTTP clients report outgoing request facts with correct method, path, configured bases and uncertainty; HTTP evidence yields only contract-supported relationships.
- [x] #10 Named Ruby method bodies provide source ranges and binding-normalized tokens for the existing identical/near-duplicate comparison, excluding anonymous callbacks as standalone compared operations.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Acceptance criteria have objective verification evidence.
- [ ] #2 Relevant checks pass and changes remain task-scoped.
- [x] #3 Public contracts or documentation are updated when behavior changes.
- [x] #4 Implementation Plan reflects the final approach; correction history and verification are recorded in Implementation Notes.
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Select and parse Ruby source, Rack configuration, Ruby command scripts and literal Gemfile/gemspec declarations through the portable scanner package; report declarations, visibility, outlines and unresolved calls without running Ruby.
2. Keep nearest declared project membership separate from architecture placement. Derive positive execution entries from main guards, gem executables and Rack/Rails launches, following selected literal local requires and the documented Rails source membership.
3. Extract supported literal Rails routes with exact public-instance handler binding and uncertainty blockers. Extract supported Net::HTTP, Faraday and HTTParty request facts with conservative configured/dynamic/unknown values. Core owns relationship inference.
4. Supply source ranges and binding-normalized named method tokens to existing core duplicate findings. Anonymous callbacks do not become standalone compared operations.
5. Integrate official discovery, release packaging, CI, contribution scenarios and scanner documentation. Verify generic independent fixtures, portable package isolation and core outcomes; use NomadNest only for external qualification.
Test authority: user-requested language support and Python-level evidence categories plus existing scanner/HTTP/outline contracts. Generic regressions detect wrong project ownership, launch membership, handler visibility/paths, false HTTP relationships, missing named bodies and renamed-binding comparison failures. Existing suites had no Ruby coverage for these rules. Tests observe core placement/relationships/findings where applicable, not merely emitted fields.
OKF/C4: all new facts are transient scanner evidence. Ordinary Markdown and existing core links remain the readable output; core owns source ownership, C4 containers/relationships and supporting findings. No new persisted metadata or architecture level.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Cold simplicity review passed with no required simplifications. Implementer specification review: packaged scanner and fresh-checkout tests verify AC1-3; scenario, documentation and CI integration cover AC4. Quality review traced catalog -> selected files -> parser -> Ruby evidence / Rails route resolution -> existing observation -> core; package owns parser assets, no project execution or new persisted concepts. New assertions detect wrong file selection, target action, visibility, operation position and call ownership without freezing prose. Manual CLI qualification in /tmp/groma-rails-consumer passed local plugin add, scanner check and scan (5 architecture records). Initial parser initialization order, inferred array typing, discovery clue selection and fresh-checkout syntax-only scanner classification were corrected. Focused tests, typecheck and changed-file lint pass. Full bun run check is still running and has reported unavailable JVM/Swift toolchains and existing certificate/npm packaging failures; investigate final results before finalizing.

Final full-context complexity review passed with no material recommendations. Final verification: 1 packaged Ruby test passed (20 assertions); tool-free fresh-checkout test passed (7 assertions); local CLI init/plugin add/scanner check/scan passed and generated 5 architecture records. bun run check completed: lint passed with only existing warnings, typecheck passed, Node 26/26 passed; Bun 900 passed, 64 skipped, 31 failed. Failures are existing JVM/Swift scanner or trust tests requiring missing java/javac/jar/keytool/swiftc and three npm trust tests failing to read effective npm CA configuration. Ruby test passed inside the full suite. Full log: /tmp/groma-rails-check.log. The available Node runtime is 24.22.0, below the contribution guide development minimum 26.12.1; Bun 1.4.4 was prepared under /tmp for validation. No root package version bump, publication or commit performed. git diff --check passed; git status --short groma/ was clean. All four acceptance criteria are verified for the documented supported example; task remains In Progress with DoD2 unchecked because the required complete repository check is not green.

User-approved real-project qualification: NomadNest c12c2466bfb22b9d49d0c5b0324080ed5c12284c tested from an isolated copy of 155 selected inputs. Parsed 154 Ruby files, 656 symbols, 522 operations, 2583 unresolved calls and 68 HTTP endpoints; outlines cover 125 files / 134 declarations. Local plugin add, readiness, CLI scan and rescan passed (155 initial architecture records; zero new and 154 refreshed on rescan). Original selected-file hashes and clean Git status verified unchanged. Coverage gaps: resource blocks (including parent CRUD routes), nested resources and member/collection routes, percent-i action lists, class << self (18 JWT methods), ActiveSupport class_methods (7 concern methods), nested class operations (1 constructor). These are documented qualification findings, not newly implemented behavior. Application runtime and full route table were not evaluated. Created requested branch feat/ruby-on-rails-support with all implementation changes preserved; no push or PR. Qualification record added to docs/scanners/ruby/validation.md.

User clarification: NomadNest is only an external implementation validation target; supported behavior and tests must express standard Ruby/Rails constructs without app-specific rules or copied application fixtures.

Generic extension regression evidence: both new tests failed before implementation (missing resource routes and scoped methods), then passed. Additional approved-public-action regression failed when a public singleton method made a same-named private instance action appear routable; fixed resolution to use exact public-instance operation IDs. Final focused run: 3 tests, 42 assertions pass; typecheck and changed-file lint pass. Operation ordering assertions compare name sets because the shared observation sorts opaque IDs, not source order. New package bundles inflection 3.0.2 and its license for conventional singular/plural route semantics, with no project-specific names. External NomadNest qualification now parses the same 154 Ruby files, reports 548/548 syntactic method declarations (zero omitted), 2656 unresolved invocations and 137 HTTP endpoint facts; selected original-file hashes remain unchanged. Full repository rerun in progress; complete required reviews before finalization.

Extension cold simplicity review passed: no required code/test simplifications; its stale validation-doc finding is corrected in docs/scanners/ruby/validation.md (548 operations, zero omitted methods, 137 endpoint facts). Implementer specification review matches AC5-6 against generic fixtures and external qualification: parent/nested/singular/member/collection routes and percent-i filters bind expected actions; singleton/Concern/nested operations retain scope and visibility with nested types absent from outlines. Quality review traced selected file -> parser -> method scope / route context -> exact public action -> standard observation. The small inflection dependency is scanner-owned and bundled with its license. No app-specific identifiers appear in runtime code or automated fixtures. Tests prove correct handlers, prefixes, irregular parent parameter, registration order, visibility, and call ownership; no prose or cosmetic assertions. NomadNest readiness and CLI rescan passed on the isolated copy after final binding fix (0 created / 154 refreshed). Required final repository check is running in /tmp/groma-rails-final-check.log after that fix; prior intermediate full run was superseded because it encountered the deliberately red public-action regression before the fix.

Final generic extension verification: cold simplicity and full-context complexity reviews pass without material code recommendations; the stale qualification-doc finding was corrected and confirmed by final review. Focused tests: 3 passed / 42 assertions; tool-free fresh-checkout package test: 1 passed / 7 assertions; typecheck and changed-code lint passed. Full final bun run check: Node 26 passed / 0 failed; Bun 902 passed / 64 skipped / 31 failed. Failure-name set is identical to the initial pre-extension check: no new failing tests. Existing failures require unavailable JVM/Swift tools or effective npm CA configuration. Log: /tmp/groma-rails-final-check.log. NomadNest current qualification: 154 Ruby files, 687 symbols, 548/548 syntactic method declarations, 2656 unresolved invocations, 137 endpoint facts; all previous 68 endpoint facts retained, 69 added. Original selected source hashes and Git cleanliness verified; isolated-copy readiness and CLI rescan pass (0 created / 154 refreshed). Generic tests and runtime source contain no NomadNest-specific rules. All six AC are verified; DoD2 remains unchecked and status remains In Progress because full repository check is still failing outside Ruby. Branch feat/ruby-on-rails-support; no publication, push, PR or commit.

Python parity request expands TASK-632 to project grouping, positive execution entries, outgoing HTTP facts and binding-normalized compared operations. Python remains syntax-only for calls; local Ruby dynamic dispatch resolution is not part of this requested parity. NomadNest remains an external validation target.

Python-level coverage implementation is in place. Generic regressions failed first, then passed for project roots/launch closure, normalized bodies, request facts, and earlier mount blocking. Follow-up contract regressions reproduced and fixed named constructed-module bodies, top-level lambda outlines without compared lambda operations, and HTTP instance-field leakage from a nested type. Focused Ruby suite: 7 tests / 71 assertions pass; richer coverage fixture passes tool-free/network-free package smoke (7 assertions); typecheck and changed-code lint pass with no new complexity warnings. Source/module groups remain transient; only explicit launches feed core container placement. Literal requests/unknowns use the existing HTTP contract and module blockers are not compared. Final external NomadNest selected set: 172 inputs / 168 Ruby sources, all 588 independently inventoried named methods with compared operations, 137 resolved handler facts + 19 blockers, 10 unknown/external request facts, one config.ru entry with 110 members. CLI fresh isolated scan created one container and placed 110 of 168 components; 65 possible duplicate findings were reported by scan and lint (lint exit 1 is its expected findings result). Original project hashes and clean Git status preserved. Docs now explain both generic behavior and limits. Current full-check run needs rerunning after final source corrections; complete cold simplicity review before implementer specification/quality and final full-context review.

Cold simplicity review of Python-level coverage passes with no material changes. Implementer specification review: AC7 project roots/nearest membership and nested boundaries pass; AC8 guards/gemspec/Rack/Rails entries and selected closure pass, with CLI proof of one application container and 110 placed components; AC9 requests/configured/unknown paths, lexical receiver isolation and core matching/blocker regressions pass; AC10 normalized named bodies/ranges and actual core duplicate finding pass, with anonymous callbacks not compared independently. Source and shared contract docs reflect the final system. Implementer quality review traced entry selection -> declaration/source parse -> root membership, launch closure, body tokens and HTTP facts -> existing core. Parsed nodes are inspected before their tree is deleted; only serializable facts escape. Each domain owns one responsibility, source scope stays separate from outline visibility, public controller binding stays exact, and no project-specific rules or extra persisted concepts were added. The new tests prove wrong handlers/placement memberships/body comparisons/false rows would fail while wording/formatting changes remain free. Focused tests pass (7 tests / 71 assertions), richer tool-free package smoke passes (7 assertions), typecheck and changed-code lint pass without complexity warnings. External source checks preserve original hashes/Git cleanliness. Final full check running in /tmp/groma-rails-python-coverage-check.log after source corrections. The next review is the required full-context complexity gate.

Final full-context complexity review passes with no material recommendation or authority-backed blocker. Final check completed: 906 Bun pass/64 skip/31 fail; Node 26 pass. Exact failing-test name comparison against the initial check confirms identical 31 failures, no additions or removals. Documentation, generic fixtures and external qualification match the final implementation. All ten acceptance criteria are objectively verified; the full repository check remains the sole unchecked Definition of Done gate. No further Ruby changes are required by the reviews.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Ruby/Rails now supplies Python-level evidence categories: nearest project roots, explicit execution entries, supported outgoing HTTP requests, and normalized named method bodies, alongside declarations/outlines and Rails handlers. Generic fixtures and conservative uncertainty handling avoid project-specific rules. Focused Ruby suite: 7 passed/71 assertions; tool-free fresh-checkout smoke: 1 passed/7 assertions; typecheck and changed-code lint pass. Cold simplicity, implementer specification/quality and final full-context complexity reviews pass.
External NomadNest qualification preserved original hashes and clean Git status: 168 Ruby sources, all 588 independently inventoried named methods compared, 137 resolved handlers plus 19 blockers, 10 unknown/external requests, one Rack/Rails entry with 110 members. Fresh CLI scan creates one application container, places 110 components and reports 65 candidate duplicate findings. Unknown requests do not invent client arrows.
Final bun run check: Node 26 passed; Bun 906 passed/64 skipped/31 failed. The failure-name set is identical to the initial baseline, with no new failing tests; missing JVM/Swift tools and npm CA configuration remain outside this task. Log /tmp/groma-rails-python-coverage-check.log. DoD2 remains unchecked and task stays In Progress because the full repository gate is not green. Branch feat/ruby-on-rails-support; changes are uncommitted/unpushed, with no PR.
<!-- SECTION:FINAL_SUMMARY:END -->
