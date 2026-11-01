Feature: New project

  Every piece of work in Cabane happens inside a project. A new project is the
  blank starting point: a blank, empty plan on a single level, a default name,
  and default settings that later features rely on.

  An element is anything placed in a project: a wall, a room, a floor, a roof,
  a foundation, a piece of furniture, a whole building… This list is not
  exhaustive. A new project contains no element at all.

  Only the parts of the interface needed by these scenarios are in scope: the
  project name in the Top bar and the Level tabs.

  Out of scope: saving and opening projects, creating a new project while the
  current one has unsaved changes, adding, renaming or reordering levels, and
  the rest of the main window.

  Rule: A new project starts with a single empty level

    @PROJ-001 @unit
    Scenario: A new project contains one level
      When I create a new project
      Then the project has 1 level
      And the level is named "Level 0"
      And the level has an elevation of 0 mm
      And the level has a height of 2500 mm

    @PROJ-002 @unit
    Scenario: The level of a new project is empty
      When I create a new project
      Then the level "Level 0" contains no element

  Rule: A project always has at least one level

    @PROJ-003 @unit
    Scenario: The last level of a project cannot be deleted
      Given a new project
      When I delete the level "Level 0"
      Then the deletion is rejected
      And the project has 1 level

  Rule: A new project is untitled and has nothing to save

    @PROJ-004 @unit
    Scenario: A new project is named "Untitled"
      When I create a new project
      Then the project is named "Untitled"

    @PROJ-005 @unit
    Scenario: A new project is not linked to any file
      When I create a new project
      Then the project is not linked to any file

    @PROJ-006 @unit
    Scenario: A new project has no unsaved changes
      When I create a new project
      Then the project has no unsaved changes

    @PROJ-007 @unit
    Scenario: A new project has nothing to undo
      When I create a new project
      Then there is nothing to undo

  Rule: Default wall settings are stored in the project

    @PROJ-008 @unit
    Scenario: A new project has default wall settings
      When I create a new project
      Then the default wall thickness is 200 mm
      And the default wall height is 2500 mm

  Rule: The application opens on a new project

    @PROJ-009 @e2e @electron
    Scenario: The application shows a new project at startup
      Given the application is started
      Then the project name "Untitled" is shown in the Top bar
      And the Level tabs contain only "Level 0"
      And "Level 0" is the selected level
