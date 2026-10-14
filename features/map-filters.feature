Feature: Choose what is visible on the Web architecture map

  Scenario: Resume the last map controls after reloading
    Given an architect is viewing a live or published Web map
    When they choose Layers and hide Containers and Relationships
    And they reload the page or open the map without control values in its link
    Then the map opens in Layers with Containers and Relationships hidden
    And the link contains the effective projection and visibility filters

  Scenario: Share map controls with a reader who has different preferences
    Given an architect has chosen 2D with every map filter visible
    When they share the map link with a reader who last used Layers with Components hidden
    Then the reader sees 2D with every map filter visible
    And explicit link values take precedence over the reader's saved choices
    And missing control values use the reader's saved choices or the initial defaults

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
