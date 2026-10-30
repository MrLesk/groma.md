Feature: Inspect intended Rails production runtime configuration

  Scenario: Scan the configured storage and hosted queue execution
    Given a Rails application with PostgreSQL production database roles
    And production Solid Queue configuration enabled through Puma and Kamal
    And a commented dedicated job role
    When a developer scans the repository with the Ruby scanner
    Then one owned PostgreSQL storage container records the logical database roles
    And the application has a configured storage relationship
    And the existing application records hosted Solid Queue execution
    And configuration source links remain available after reloading and rescanning
    And the map describes intended production configuration without claiming a live deployment
    And neither logical database roles nor commented jobs become deployed server boundaries
