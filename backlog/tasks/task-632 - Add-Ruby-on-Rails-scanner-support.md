---
id: TASK-632
title: Add Ruby on Rails scanner support
status: Done
assignee:
  - '@codex'
created_date: '2026-10-25T15:52:00Z'
updated_date: '2026-10-26T11:56:00Z'
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
  - backlog/tasks/task-632 - Add-Ruby-on-Rails-scanner-support.md
  - groma/systems/groma-md/containers/cli/components/ruby-src-index.md
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
- [x] #11 The built Ruby scanner is qualified on at least six distinct open source repositories at recorded commits, with meaningful source and outline checks, identical repeat scans, unchanged inputs and no project dependency installation or execution.
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
1. Parse selected Ruby source, Rack configurations, Ruby command scripts and literal Gemfile/gemspec declarations through the self-contained package. Reuse declaration analysis for Code outlines; leave dynamic Ruby calls unresolved.
2. Keep nearest declared project membership separate from architecture. Report positive command/Rack/Rails execution entries and their selected local source units through the existing core contract.
3. Extract literal Rails routes and supported Net::HTTP/Faraday/HTTParty requests conservatively. Require one public, unredefined local instance action; hide outer URL values behind block parameters. Skip HTTP binding work when no supported client is imported. Core owns provider matching and uncertainty.
4. Supply source ranges and binding-normalized tokens only for supported named methods to existing duplicate findings. Keep anonymous callbacks out of standalone comparisons.
5. Integrate discovery, package/release staging, CI, generic fixtures and documentation. Ship parser assets, licenses and the linked validation record. The ten runtime modules belong to one Ruby source scanner component in the existing CLI container.
6. Qualify the built package on pinned Puma, Rails, Rack, Sinatra, Lobsters and Chatwoot snapshots with defaults. Verify readiness, source listing, reversed-input repeat scans, all source outlines, method positions/ranges, source witnesses and unchanged hashes/Git state. Record RuboCop/Sidekiq/Forem/Discourse parser rejections as unsupported, without fallback or extra exclusions. Exercise the published CLI on a separate Lobsters source copy.
7. Run focused and isolated package checks and bun run check with Bun1.4.4, Node26.12.1 and its bundled npm11.20.0. Apply one targeted cold simplicity review, own specification/quality reviews and final full-context complexity review. Preserve the original author's commits in an upstream delivery branch because the fork disables maintainer edits.
Test authority: the task and existing scanner/HTTP/outline contracts require exact handler ownership and unresolved values for shadowed bindings. Existing fixtures lacked public-to-private method redefinition and URL block-parameter shadowing. Extend the existing fixtures/assertions to detect those two concrete false-provider results; both fail before fixes and pass afterward. No new test for document delivery or the behavior-preserving empty-client shortcut.
OKF/C4: scanner facts remain transient evidence. Existing core owns IDs, Code ownership, C4 placement and relationships. Ordinary Markdown readers see the component responsibility and exact source links. Existing Groma metadata owns its CLI containment; no new persisted fact or C4 level is added.
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

Clarified the published validation evidence: 22 Java/JVM and COBOL packaging tests could not find java/javac/jar/keytool; 6 Swift tests could not find swiftc; 3 npm CA-configuration tests failed in a child process, with underlying cause still unverified. The same 31 failing test names appear in both qualification runs; no Ruby assertions failed. This is evidence of no newly failing names, not proof of a green full suite or an established npm root cause. DoD2 remains unchecked pending successful full-suite validation. Ruby validation documentation now explains these limits.

Maintainer review started from PR187 head 9f3c2bed12a8f6a4545febbb3eed09498f8d6fbb. TASK-632 is present only for this Ruby task across fetched refs, current main and open PR titles. Backlog doctor reports unrelated historical duplicate IDs 164/408/500; those records are outside this task and were not changed. All seven existing focused Ruby tests pass under verified Bun1.4.4 (71 assertions). The fork has maintainer_can_modify=false, so fixes will be prepared on an upstream branch preserving its commits. Test gaps identified for investigation: route redefinition visibility and HTTP block-variable shadowing must retain uncertainty under AC3/9 and the documented scanner contracts. Existing fixtures cover private instance vs singleton methods and nested receiver scope, but do not exercise these two wrong-binding results. Extend the smallest existing fixtures only after reproducing each failure.

Extended the existing clients.rb fixture with a block parameter that shadows a literal outer URL binding. This changed file is already in the recorded modified-file list; the next assertion will require unknown request evidence so this cannot invent a local provider.

Extended the existing ruby-http.test.ts assertion to require an unknown path for the shadowed block URL. This file is already recorded in modified_files. No new test case or fixture file was added.

Extended the existing PeopleController fixture with an earlier public instance definition of hidden before its private redefinition. The recorded fixture path is unchanged. The existing hidden-route assertion now detects whether a superseded public method is falsely accepted; no duplicate new test is required.

Fixed routes.ts by checking all same-named instance definitions before public visibility. A single public candidate is required; any redefinition remains a blocker as the documented contract requires. The path was already in modified_files.

Added requestBindings in the existing HTTP value module to hide outer URL values behind block parameters at each request location. The file was already recorded. This preserves unknown evidence instead of assigning a false literal provider.

Connected clients.ts request extraction to requestBindings at each call. The existing modified-file entry is preserved; no new API or architecture concept was introduced.

Corrected Ruby build delivery: the built README links validation.md, but that file was absent. build.ts now copies and includes the existing validation record in the package. The build file was already tracked in modified_files. This is a document-delivery fix, with no new behavior or test needed.

Added the missing task-owned architecture record through Groma0.7.8 scan/edit commands in an isolated architecture copy, then transported only the final CLI-authored record. All ten Ruby runtime modules share one Ruby source scanner responsibility inside the existing CLI container and Language scanners group. No unrelated derived relationship changes or temporary configuration were copied. OKF remains ordinary Markdown with exact Code links; existing Groma metadata owns identity and containment. This adds a component for the language adapter, not a new C4 boundary or stored scanner fact.

Both supported binding regressions failed before their fixes and now pass: focused Ruby suite 7/7 with72 assertions; isolated fresh-checkout package smoke1/1 with7 assertions. First provisioned full check passed lint/types and26 Node tests; Bun936 passed/64 skipped/1 failed. The remaining npm-packaging failure was reproduced separately: npm12.2.1 pack --json returns an object keyed by package name, while Node26.12.1 bundled npm11.20.0 returns the array required by the existing test. This is unrelated to Ruby. The suite is being checked with bundled npm11.20.0; no test was removed, weakened or retried with changed assertions.

Rails qualification remains CPU-bound for several minutes while the other five clean repositories pass. Inspection identifies unnecessary work in rubyRequests: it builds every method binding even when imports contains none of net/http, faraday or httparty. Every request producer already requires one of those exact imports. Skip that pass when none is present; this is a behavior-preserving removal of work inside existing ownership, with no new support rule or test. Existing HTTP and fixture checks verify the imported-client flow. Cold targeted simplicity review has passed the two binding corrections and package/architecture integration with no findings.

Removed the unnecessary no-client HTTP pass with one guard in clients.ts. The file is already recorded in modified_files. All existing HTTP producers remain gated by the same explicit imports; no fact shape, uncertainty rule or supported API changed.

Updated docs/scanners/ruby/validation.md, already in modified_files, with six pinned default successes, four explicit grammar failures, exact counts and witnesses, source immutability/repetition checks, separate Lobsters CLI smoke, and the verified no-client work reduction. No parser fallback or repository-specific rule/exclusion was added. The final complete check is still running after the one-line shortcut.

The final complete repository check passes after all source corrections: Biome/scrollbar checks, TypeScript,26 Node tests,937 Bun passes/64 skips/0 failures. Log /private/tmp/groma-ruby-qualification-187/check-complete.log. Added the exact green result to the already-tracked validation record immediately. No source changes followed this check.

Maintainer specification review: AC1-4 pass the built-package/fresh-checkout tests and current discovery, contribution scenario and documentation checks. AC5-6 pass the generic routing/scope fixtures; the superseded public action now remains blocked when later redefined private. AC7-8 pass nearest-project and launch-closure tests and the separate Lobsters CLI flow. AC9 passes supported request/core relationship fixtures, earlier-mount uncertainty and the newly reproduced block-URL shadowing regression. AC10 passes normalized-body and actual core finding checks. AC11 passes six pinned public default scans: Puma63 sources/658 methods, Rails1598/15711, Rack51/567, Sinatra57/569, Lobsters390/1017, Chatwoot1845/10889. Repeated complete observations match; all outlines load; every named-method position/range and sampled source witnesses are checked; selected hashes and clean Git states are unchanged. No project dependencies or application code were installed/executed. Four further snapshots hit documented grammar limits, permitted by the concrete unsupported-syntax diagnostic contract; they are explicit non-blocking limits, not qualified successes.
Maintainer quality review: traced catalog/manifest -> selected inputs -> parser lifetime -> projects, declarations/compared methods, launches, route/HTTP facts -> existing core ownership, placement, relationships and findings. Each module has a clear responsibility and the single CLI-owned architecture component names all ten source modules. Block binding correction reuses the existing unresolved-value path; route binding checks redefinition before public visibility. The no-import HTTP guard is equivalent to the existing producer gates and preserves counts while removing unnecessary work (Rails qualification354.46s ->6.73s on this host). Tests prove the reported false-provider failures and tolerate unrelated wording/refactoring; fixtures remain generic, concurrent and independent of live architecture. No new behavior, dependency, retry, fallback or compatibility path was introduced by the maintainer changes. The linked validation record is now in the package. Full repository check after all source changes passes:26 Node,937 Bun,64 skips,0 failures. The cold targeted simplicity review passes with no required changes. Final full-context complexity review remains before finalization.

Final full-context complexity review passes with no blocker or material simplification. It confirms conservative block bindings and handler redefinition, behavioral equivalence of the no-client guard, package validation delivery, clear domain ownership, and the six successes/four explicit parser failures. Final rebuilt package smoke passes1/7; Groma0.7.8 reads ruby-src-index under cli in Language scanners with the authored responsibility and source links. Only this task-owned architecture record is changed in groma/. No source changes followed the green complete check.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Adds the experimental self-contained Ruby/Rails scanner and qualifies it on six pinned public repositories with default inputs: Puma, Rails, Rack, Sinatra, Lobsters and Chatwoot. It supplies source membership, declarations/outlines, explicit launches, literal Rails handlers, supported HTTP facts and normalized named method bodies through existing core contracts. Maintainer corrections prevent a private action redefinition and a block-shadowed URL from creating false providers, include the linked validation record in the package, and remove unused HTTP binding work when no supported client is imported. One CLI-authored component owns all ten runtime modules. TASK-632 is unique; original author commits are preserved on an upstream branch because the fork disables maintainer edits.
Verification: both regressions fail before their fixes and pass afterward; focused7 tests/72 assertions, isolated package1/7, full bun run check26 Node +937 Bun pass/64 skip/0 fail. Six public scans repeat identically, load all outlines, validate method positions/ranges and witnesses, and preserve selected hashes and clean checkouts without running project code or installing dependencies. A separate Lobsters CLI copy passes install/readiness/scan/rescan/source-owner lookup. Both required review gates pass with no material findings. Four additional snapshots hit explicitly recorded parser limits; no fallback or repository-specific exclusions were added. Scanner publication and merge are outside this delivery.
<!-- SECTION:FINAL_SUMMARY:END -->
