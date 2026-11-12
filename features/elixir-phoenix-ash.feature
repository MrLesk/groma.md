Feature: Inspect an Elixir application with Phoenix and Ash

  Scenario: Scan Mix projects without installing Elixir or the application
    Given a repository with Mix projects, including umbrella apps
    And the Elixir scanner is installed and enabled
    When a developer scans the repository
    Then the files each Mix project compiles are available as Code references
    And Code outlines show Elixir modules and their functions by name and arity
    And each project that declares an application callback or an escript supplies one execution entry
    And scanning does not run Elixir or Mix or install application dependencies

  Scenario: Trace a browser request to the Phoenix action that answers it
    Given a Phoenix router with scopes, resources, LiveView routes and a browser client
    When a developer scans the repository with the Elixir and JavaScript scanners
    Then each route keeps its complete declared path and its registration order
    And a proven request identifies the controller action or LiveView that handles it
    And a route the scanner cannot read prevents a false relationship to a later route

  Scenario: Inspect what an Ash application declares through its DSL
    Given Ash resources and domains with actions, code interfaces and JSON:API routes
    And a Phoenix router that forwards to the AshJsonApi router
    When a developer scans the repository
    Then each resource action is an operation of its resource
    And code interface functions appear in the Code outline of the module that hosts them
    And JSON:API routes are endpoints under the path where the Phoenix router mounts them
