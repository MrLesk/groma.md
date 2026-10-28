# Roadmap

Groma's major feature releases use milestone names. Each update delivers one clear
result for people using Groma maps.

## Release order

| Order | Release | Included features | Main result |
| --- | --- | --- | --- |
| 1 | **The Personalization Update** | Cloneable UI themes, architecture icons and colors, OKF tags, web filters, filtered exports, and saved/shared views. | Make the map your own and choose what to focus on. |
| 2 | **The Agent Power-Up Update** | Agent workflow improvements and the Codex plugin. | Make Groma easier to use with a coding agent. |
| 3 | **The Editor Update** | Edit architecture names, descriptions, and relationships directly in Groma. | Curate the architecture while viewing the map. |
| 4 | **The Planning Update** | Agents show proposed changes on the map, plus a roadmap view of drafts. | Understand proposed architecture changes before implementation and see how planned work fits together. |
| 5 | **The Marketplace Update** | Discover and reuse plans, plugins, and scanners. | Share useful Groma capabilities and architecture plans. |

The Agent Power-Up Update comes before the Editor Update because it is a quicker
win. Planning follows the editor directly: first edit the architecture, then use
that experience to design future changes. The marketplace follows these workflows
so shared plans and plugins have a clear purpose.

## The Personalization Update

[Milestone m-6](<backlog/milestones/m-6 - the-personalization-update.md>) contains
seven planned tasks. Start from current `main`; the partially failed local PoC
provides research, not completed implementation.

| Task | Primitive and result |
| --- | --- |
| [TASK-636 — Make UI themes cloneable and configurable](<backlog/tasks/task-636 - Make-UI-themes-cloneable-and-configurable.md>) | Light, Dark, and Blueprint use the same plugin definition as custom themes. `config.json` controls the picker and system light/dark associations. |
| [TASK-561 — Assign icons to components, containers, systems, and groups](<backlog/tasks/task-561 - Give-elements-an-icon-and-a-colour-from-icon-packs-Groma.md-publishes.md>) | Authored icons give architecture a visual identity across views. |
| [TASK-637 — Assign colors to components, containers, systems, and groups](<backlog/tasks/task-637 - Assign-colors-to-components-containers-systems-and-groups.md>) | Authored colors express project meaning independently of UI themes. |
| [TASK-638 — Tag architecture using standard OKF tags](<backlog/tasks/task-638 - Tag-architecture-using-standard-OKF-tags.md>) | Standard top-level `tags` provide portable categories for filtering. |
| [TASK-639 — Dim nonmatching architecture when filtering the web map](<backlog/tasks/task-639 - Dim-nonmatching-architecture-when-filtering-the-web-map.md>) | Readers focus on matching architecture while retaining the surrounding map and layout. |
| [TASK-640 — Export a map subset using includeFilter and excludeFilter](<backlog/tasks/task-640 - Export-a-map-subset-using-includeFilter-and-excludeFilter.md>) | The same matching rules produce a map containing only the selected subset and its agreed context. |
| [TASK-641 — Remember and share personalization choices in map views](<backlog/tasks/task-641 - Remember-and-share-personalization-choices-in-map-views.md>) | Existing view state gains configured themes and tag filters for reloads and shared links. |

UI themes own interface surfaces, background, text, grid, and controls. Element
and group icons and colors belong to authored architecture styling. Theme changes
preserve those assignments, and filtering dims them without replacing their colors.
Tags use OKF's standard field; Groma-specific styling stays under `groma`. Groups
remain narrative overlays, without adding a C4 element or containment level.

Tags precede web filtering; web filtering supplies the matching rules for exports.
Saved/shared personalization depends on themes and filtering. Before implementation,
settle the task examples for group styling and filtered-export parent/relationship
context. Activity metrics, assigned-work filters, and criticality review remain
outside this milestone.

## Release names and hotfixes

Keep normal version numbers alongside milestone names. Use the full milestone
name for a feature release, such as **The Personalization Update**.

Hotfix patches can ship between named updates. Name them after the update they
fix, such as **Personalization Hotfix 1** and **Personalization Hotfix 2**.
Hotfixes fix released behavior; new features belong to a named update.

## Smaller follow-ups

Read-only components and risk-based review of changes remain smaller improvements
for later, without a dedicated major release milestone.
