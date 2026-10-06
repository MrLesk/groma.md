Feature: Choose what is visible on the Web architecture map

  Scenario: Hide and restore relationships while inspecting architecture
    Given an architect is viewing the map with relationships visible
    When they turn off Relationships in the map filter bar
    Then all relationship lines are hidden, including highlighted relationships
    And the architecture bodies, layout, camera, and selection stay unchanged
    And relationships remain available in the details and flow readers
    When the map updates or the architect changes between Iso, 2D, and Layers
    Then relationships remain hidden
    When they turn Relationships on again
    Then relationships with visible endpoints return
    And the stored architecture stays unchanged
