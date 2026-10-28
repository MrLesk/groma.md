Feature: Inspect a Ruby on Rails application

  Scenario: Scan Rails source without installing the application
    Given a Rails application with Ruby controllers, models and literal routes
    And the Ruby scanner is installed and enabled
    When a developer scans the repository
    Then Ruby files and named declarations are available as Code references
    And literal Rails routes identify their declared controller actions
    And Code outlines show Ruby classes and their methods
    And scanning does not execute Ruby or install application dependencies

  Scenario: Inspect standard Rails routing and Ruby method scopes
    Given a Rails application with resource blocks and nested routes
    And Ruby methods declared in singleton classes, concerns and nested classes
    When a developer scans the repository
    Then parent, nested, member and collection routes retain their declared paths and actions
    And literal action filters select the declared resource actions
    And each method operation belongs to its declaring Ruby type
    And Code outlines retain the methods of visible types without listing nested types

  Scenario: Use Ruby source evidence across the standard architecture flow
    Given declared Ruby projects with local commands and a Rack application
    And Ruby methods that call supported HTTP clients or contain repeated logic
    When a developer scans the repository
    Then source files retain their nearest project's membership
    And explicit launch entries identify their own local source units for container placement
    And proven HTTP requests can identify the local endpoint they reach
    And an earlier unreadable route prevents a false endpoint relationship
    And renamed local variables do not hide identical method bodies from findings

