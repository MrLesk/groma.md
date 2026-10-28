---
id: TASK-632
title: Add Ruby on Rails scanner support
status: Done
assignee:
  - '@codex'
created_date: '2026-10-25T15:52:00Z'
updated_date: '2026-10-26T22:12:00Z'
labels: []
dependencies: []
references:
  - plugins/scanners/ruby/src/index.ts
  - src/scanner/modules/official-catalog.ts
  - scripts/scanner-release.ts
  - docs/scanners/creating-a-plugin.md
  - plugins/scanners/vue/src/index.ts
  - plugins/scanners/vue/src/project.ts
  - plugins/scanners/typescript-project.ts
  - plugins/scanners/vue/src/http.ts
  - test-bun/ruby-vue.test.ts
  - test/fixtures/ruby-coverage/Items.vue
  - test/fixtures/ruby-coverage/package.json
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
  - test/fixtures/ruby-coverage/a/Gemfile
  - test/fixtures/ruby-coverage/a/shared.rb
  - test/fixtures/ruby-coverage/package.json
  - test/fixtures/ruby-coverage/Items.vue
  - test-bun/ruby-vue.test.ts
  - plugins/scanners/typescript-project.ts
  - plugins/scanners/vue/src/index.ts
  - plugins/scanners/vue/src/project.ts
  - plugins/scanners/vue/package.json
  - plugins/scanners/react/package.json
  - plugins/scanners/angular/package.json
  - test-bun/vue-http.test.ts
  - test/fixtures/ruby-coverage/app/controllers/api/items_controller.rb
  - docs/scanners/vue/index.md
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
- [x] #12 The pinned Chatwoot checkout is scanned with Ruby and Vue enabled together; source witnesses verify frontend-to-Rails relationships or explicit uncertainty, repeated output and source ownership remain stable, original files remain unchanged, and relevant supported-flow defects are fixed in the maintainer PR.
- [x] #13 The same packaged Ruby/Vue fixes are checked across at least six pinned open source Vue or mixed-stack repositories, with both declared and absent TypeScript configs; general source-analysis failures are fixed, proven frontend-to-Rails rows are verified in source, and unsupported results remain explicit without application-specific rules or exclusions.
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

8. Address the relevant automated review findings: the repository root must rank below a one-character declared project (AC7), and a local first introduced in a Ruby block must not enter its enclosing method bindings (AC10). Reuse the existing nested-project fixture and compared-body test; observe failures before fixes. Validate source membership, entry isolation, distinct trailing method names and equal tokens after only block-local renaming. No change to the shared whole-computed-segment HTTP rule: producer decision3 explicitly ignores possible runtime slashes.

9. Alex explicitly requests combined Ruby/Vue qualification on pinned Chatwoot bfa47377144440959bb1074e65d53a153818e31b and direct fixes in PR188. First run both unmodified packages with the real default-selected source. Trace frontend HTTP callers and Rails routes/handlers against any derived rows. Repair only reproduced blockers in this approved flow, keep generic regression fixtures, and retain uncertainty where source does not prove a provider. Do not install or execute the application or patch its source/configuration to manufacture a successful scan. Verify complete combined observation/reconciliation repeatability and source hashes, then update validation evidence and the PR.

10. Alex clarifies that the fix must address general causes across repositories and languages, not manufacture Chatwoot-specific inference. Qualify the shared Vue project-selection rule on several real mixed Ruby/Vue repositories with both declared and absent TypeScript configs. Preserve the existing generic fixture and source evidence/uncertainty contracts. Do not add application names, paths, hostnames, ad hoc alias maps or specific URL formats to extraction. Trace common failures to their owning shared or language module, fix only reproduced general rules, and record successful and unsupported outcomes separately.

11. Broader mixed scans reproduce lost route prefixes in Loomio and Docuseal: known Rails constraints and Devise authentication wrappers become a repository-wide blocker, and namespace format defaults discard the namespace. Preserve child paths as uncertain inside known path-preserving wrappers; accept only the literal format default that does not change the route path. Keep unsupported namespace options blocked under a provable prefix, and keep unknown path overrides global. Authority: Alex requests root-cause fixes across real repositories and correct frontend-to-Rails matching. Coverage gap: the generic mixed fixture lacks an unrelated guarded engine and an API namespace with a format default. Extend its single combined test to require the API controller relationship while an earlier guarded engine still blocks a same-path later handler. No inferred execution, runtime authentication or optional format suffix behavior is added.
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

Automated review found three items after c6814779. Reproduced AC7: selected Gemfile plus a/Gemfile incorrectly assigns a/library.rb to root dot because both directory strings have length1. The block-local token finding matches Ruby assignment scope (https://ruby-doc.org/3.3/syntax/assignment_rdoc.html#label-Local+Variable+Scope) and documented AC10; a regression will distinguish the final method call from a local introduced only inside a block. Existing nested-project coverage uses a longer directory, and existing compared methods have no block-local assignment, so the smallest fix is to strengthen those existing examples. The URL finding is not an approved behavior change: docs/scanners/evidence.md producer decision3 explicitly states that a whole computed segment is dynamic and possible runtime slashes do not decide it. Its cited suffix example occupies one whole source segment. Do not replace that policy with a per-language rule. Task reopened pending the two relevant fixes and final checks.

Renamed each existing nested-project fixture file into a/ and immediately recorded both paths via CLI after each move. Updated the already-tracked lib/command.rb require to preserve the cross-project launch example. This strengthens the same fixture without adding a second project scenario.

Extended the already-tracked compared.rb fixture with three minimal methods: block-only local renaming must preserve equal bodies when the final method call remains x; changing that final method call to y must keep bodies distinct. An outer accumulator is captured inside the block in each example. No application-specific fixture or new test file was added.

Updated the existing ruby-coverage.test.ts, already in modified_files, for a/ membership and added two semantic token comparisons for block-local scope. Existing command/launch membership assertions now also detect crossing the one-character project boundary. These checks target AC7/10 and the two automated findings.

The block fixture insertion initially stopped at a trailing-newline assertion without changing the file. It is now applied and immediately tracked under the existing compared.rb entry. The earlier test attempt proved the a/ ownership failure, but its token failure was missing fixture methods, not yet a valid block-scope regression; rerun the completed fixture before claiming before-fix evidence.

Fixed the reproduced AC7 failure in projects.ts, already tracked: root dot ranks as zero path length while a real directory keeps its path length. Filtering already restricts candidates to ancestors, so the deepest selected project now owns a/shared.rb and the root launch cannot absorb it.

Fixed the reproduced AC10 token failure in tokens.ts, already tracked. Removed the recursive pre-collection pass that leaked block assignments into the enclosing method. The existing token visitor binds assignment names in its current scope and reuses existing captured bindings; block parameter scopes still copy and shadow the parent map. This is shorter and follows source declaration order. Later bare x/y method names remain significant.

The full lint pass measured token visit complexity18, above the required15, although it is a warning. Extracted the small assignment-name reader into the same module; the visitor now only applies names to its current scope and emits tokens. This preserves the corrected behavior and clear ownership. tokens.ts was already recorded. The in-flight full check is superseded; run focused lint/tests and one final complete check after this correction.

Updated the already-tracked validation record with the one-character project and block-local token regressions,74 focused assertions, authoritative Ruby scope documentation, and the shared HTTP rule that makes the suffix-slash suggestion inapplicable. After the functional fixes all six public snapshots pass again with unchanged source/method/outline/entry/endpoint counts and identical repeated observations; selected hashes remain unchanged. The final helper extraction only separates assignment-name reading from token traversal and preserves these results. Final isolated package check passes1 test/7 assertions. Lobsters CLI rescan still creates0/refreshed390/findings54.

Targeted specification/quality re-review of the automated findings passes. AC7 now ranks the root marker below a/, and the strengthened fixture proves both nearest project membership and launch-closure isolation. AC10 now binds declarations during token traversal within the current lexical map; new block names stay local, existing outer locals stay captured, and later method calls keep their names. Both regressions fail before fixes and pass afterward. The assignment-name helper keeps token visitation under the required complexity limit; changed-file lint reports no warning. These are small contract-restoring fixes; the completed cold/full-context reviews remain the substantial feature review record, and this implementer re-review is limited to the reported findings and regressions. The URL suggestion is inapplicable under producer decision3 and Python's same whole-computed-segment semantics; it does not authorize a different Ruby rule.
Final revised verification: focused7 tests/74 assertions, isolated package1/7, six public default snapshots requalified with unchanged inventory/evidence counts and identical repeated observations plus unchanged input hashes. Final complete check exits0:26 Node tests;937 Bun pass,64 skip,0 fail,4216 assertions. Log /private/tmp/groma-ruby-qualification-187/check-reviewed-final.log. Groma status remains clean; the existing Ruby scanner component already owns projects.ts and tokens.ts, so no architecture restructuring is required. No source changes follow this check.

Combined qualification begins from clean local head8df85677544129a0e783e13d3fa6843a47d76c5d. Chatwoot declares Vue3 and Rails but has no selected tsconfig.json or jsconfig.json; its frontend is configured by Vite. Current Vue candidate selection requires tsconfig.json and may therefore omit the complete frontend. Run the existing package first to establish observed behavior before changing it. The current Ruby subset reports38 resolved handlers and49 blockers. Chatwoot also uses a shared ApiClient and global axios; inspect source identity and supported URL shapes before deriving or claiming frontend relationships.

Reproduced combined baseline: Ruby1845 sources/87 endpoint facts; Vue selected2511 inputs including1245 SFCs but listed0 source and returned no observation, so core derived0 HTTP rows. Test authority: the user explicitly requires Ruby+Vue together on this config-free Chatwoot example. Existing Vue tests all use tsconfig fixtures and do not cover a config-free Vue client reaching a Ruby handler. Smallest regression: add a Vue manifest and one SFC to the existing generic Ruby coverage fixture, plus one concurrent combined-package test. It must observe Vue source, a proven frontend-to-Ruby row, and an unresolved full URL remaining unknown. Project execution and manufactured consumer config are excluded. The Vue compiler provides createParsedCommandLineByJson for this inference; read its installed primary implementation/API before use.

Added optionalConfig to the existing framework selection options for the current Vue use case. Manifest dependency plus actual SFC source still establishes the candidate. Other framework callers keep the existing required-config default. Shared compiler selection remains source grouping, not architecture placement.

VueProject now uses the bundled Vue compiler JSON configuration API for a package with no declared tsconfig. It receives only selected source paths and JavaScript/module parsing options, creates no consumer config, and reports diagnostics against the real package manifest. Existing declared config/reference behavior remains unchanged.

The combined generic regression now passes: the frontend SFC is listed, core derives the GET/items row to the Ruby controller, and an unresolved whole URL remains unknown. Added an explicit existing ts.ParsedCommandLine type at the Vue compiler boundary after typecheck exposed implicit-any propagation from the upstream JSON helper. No new type model or runtime behavior was added; Vue project.ts is already tracked.

The upstream JSON helper return type does not expose inherited compiler fields correctly under the hoisted declaration setup. Followed the existing readConfig bridge: use Vue to resolve Vue options and the pinned TypeScript parseJsonConfigFileContent to produce its typed compiler result, with the same extra SFC extensions. No type assertion or duplicate compiler model is used. The corrected real scan already reads2483 frontend sources and18 HTTP facts, with0 derived cross-language HTTP rows pending source witness analysis.

Corrected Vue observation engineVersion from the stale3.3.11 literal to its actual pinned language-core3.3.13, as required by the scanner metadata contract. Vue index.ts is already recorded. The shared project-selection helper is bundled into Vue, React and Angular artifacts, so each affected package will receive its own patch bump under the release instructions; their supported non-Vue behavior stays unchanged.

Refreshed bun.lock with Bun1.4.4 using lockfile-only and scripts disabled after the three scanner package patch bumps. bun.lock was already in modified_files; inspect its diff for unrelated changes before commit.

User explicitly broadens validation beyond Chatwoot and restates the AGENTS cross-project design requirement. Current code is generic: manifest Vue dependency plus selected SFC source can form a Vue analysis project without tsconfig; declared configs remain authoritative, and other frameworks retain their prior selection default. No Chatwoot-named path, rule, alias or route change has been added. Real Chatwoot now has2483 frontend files/18 HTTP facts alongside1845 Ruby sources, with0 cross-language rows. That result still needs source-based evaluation and broader mixed-project evidence; do not invent arrows to satisfy a count.

Broader runs reproduce two Vue-wide defects on independent repositories: reversing selected inputs changes invocation/HTTP/diagnostic order on Loomio, Vue REPL, Chatwoot and Zammad; Docuseal and Dashy fail because rendering/code-generation diagnostics are merged with actual SFC parsing errors. Primary language-core code separates vueSfc.errors from ir.template.errors and supplies an AST even for render diagnostics. Scanner source analysis already tolerates TypeScript semantic errors; use the same boundary for Vue: syntax/parser failures and a missing required template AST remain fatal, while generation diagnostics with a valid parsed AST are reported. Regression gaps: add a reversed-input equality assertion to existing Vue HTTP coverage; strengthen the generic combined fixture with a parseable keyed-branch diagnostic and assert a warning plus preserved HTTP evidence, then confirm malformed template syntax still rejects. No repository names, special error codes or project exclusions are used.

Strengthened already-tracked Items.vue with a parseable keyed conditional that produces a template-generation diagnostic. Script declarations and the proven/items request are unchanged. This reproduces the same compiler-phase mistake observed independently in Docuseal and Dashy.

Extended the already-tracked combined test to require the generation diagnostic as a warning while preserving the frontend/Ruby row, and to require rejection after replacing its own temporary SFC with malformed template syntax. The test still owns its temporary source tree; no live architecture is loaded.

Fixed input-order dependence at the Vue project-selection boundary by sorting the selected paths before candidate discovery and compiler root assignment. This stabilizes all downstream facts and diagnostics without sorting away route order or adding project rules. Vue index.ts was already recorded.

Separated Vue source parsing from render generation diagnostics in the existing project owner. SFC parsing errors remain fatal; template analysis without an AST remains fatal. Generation diagnostics with a valid parsed AST become located warnings while the scanner still reports proven source facts. No error code, application name or source path is special-cased. Vue project.ts was already tracked.

The combined guarded-engine/namespace regression failed before the route fix (no expected API relationship). Known Rails constraints and Devise request guards now retain child route paths as blockers. Namespace response-format defaults no longer discard readable API routes; unsupported options keep only a provable path prefix. Existing unknown-handler and registration-order rules remain in core. routes.ts was already tracked.

Final focused checks for this increment pass: 29 Ruby/Vue tests, 194 assertions, and TypeScript typecheck. Rebuilt Ruby requalification passes on the original six snapshots with all outlines, positions, reversed-input repeat observations and unchanged source hashes. The wider Vue matrix passes all six Vue scans; Loomio has one proven frontend/Rails row and Docuseal has four. Chatwoot has 2483 frontend sources and 1845 Ruby sources with explicit uncertainty and no proven cross-language row. Zammad Vue passes but Ruby fails on anonymous block forwarding; comparison showed the alternative Microsoft prebuilt grammar has the exact same SHA256 as the pinned asset, so it is not an asset replacement fix. No grammar adapter, per-file exclusion or partial successful Ruby result was introduced. Full repository check and required reviews are in progress.

Cold simplicity review passed with no required simplifications. Own quality review found the scopedRoutes dispatcher exceeded the documented complexity limit (18). Moved guarded-child conversion to a named domain operation and calculated the unreadable prefix outside the conditional, preserving behavior. routes.ts remains recorded; rerun focused checks, required full check and one targeted cold re-review for this correction.

Actual released CLI0.7.8 qualification passes on separate selected-source copies of Loomio and Chatwoot after installing both final packages. Loomio has2438 unique source owners and1 HTTP relationship. Chatwoot has4328 unique owners and90 Vue event relationships; no proven cross-language HTTP row. Init, local plugin add, readiness, scan and repeat scan pass; owner IDs and complete relationship records are identical on repeat, source bytes match originals. First full check passes26 Node +938 Bun tests/64 skips/0 failures; lint found the now-corrected routes complexity warning. Focused post-cleanup tests pass; full check is rerunning after that correction. validation.md already tracked.

Implementer specification review for the mixed-scanner increment: AC12 is demonstrated by full Chatwoot CLI scan/rescan, 4328 stable physical owners, unchanged inputs and explicit HTTP uncertainty. AC13 is demonstrated by six pinned independent Vue scans (configured and config-free), three successful mixed Ruby/Vue scans, one explicit Ruby grammar failure, five source-witnessed HTTP rows across Loomio and Docuseal, and no app-specific extraction rules. Original AC1-11 remain supported by package regressions and six final Ruby requalifications. Quality review traced manifest selection -> nearest Vue package -> declared/in-memory compiler settings -> original-source facts -> Ruby controller resolution -> existing core matching/reconciliation. Existing source owners retain responsibility; no persisted OKF or new C4 concept was introduced. The new test fails for the missing API provider and for false guarded alternatives, preserves unknown full URLs, rejects malformed SFC syntax, and owns its temp directory. Changed functions pass the complexity limit, source/test files stay below500 lines, lockfile changes are only the three scanner package versions, and groma/ is clean. No authority-backed blocking defect remains; final full check is still running after the behavior-preserving complexity cleanup. Cold review found no required changes, so no additional cold review is needed for new scope.

Final full-context complexity review passed with no blocking findings or material architecture recommendations. It confirms generic root causes, clear existing domain ownership and justified guarded-route helper. Applied its one prose correction: the mixed matrix says each successful result passed repeated checks, rather than incorrectly implying the explicitly failed Zammad Ruby scan passed. validation.md remains tracked. Final built-package isolation check passes1 test/7 assertions with language tools absent and network disabled.

Final post-cleanup bun run check passes: lint with no warnings in the changed scanner/test files, TypeScript,26 Node tests,938 Bun tests,64 opt-in skips and0 failures. Full log: /private/tmp/groma-ruby-vue-188/check-reviewed-final.log. Cold simplicity and final full-context complexity reviews pass; own specification/quality reviews find no unmet acceptance criterion or Definition of Done item. The supported broad flow is complete; upstream parser limits remain explicit rather than hidden by app-specific workarounds.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Adds the self-contained Ruby/Rails scanner and fixes shared Ruby/Vue source-analysis causes: config-free Vue packages are analyzed, input order is stable, parsed template-generation diagnostics preserve source facts, and known guarded routes/namespace format defaults retain their paths. Rechecked six Ruby repositories and six Vue/mixed repositories; Loomio and Docuseal provide five source-verified frontend-to-Rails relationships. Chatwoot and Loomio CLI rescans preserve source ownership and complete relationships with unchanged source. Zammad Ruby and four other grammar failures remain documented; no application-specific rules or exclusions were added. All focused, isolated-package and complete repository checks pass, including26 Node+938 Bun tests; required reviews pass. Delivered in maintainer PR188 with original author commits retained.
<!-- SECTION:FINAL_SUMMARY:END -->
