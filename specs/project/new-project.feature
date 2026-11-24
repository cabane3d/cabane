Feature: New project

  Every piece of work in Cabane happens inside a project. A new project is the
  blank starting point: an empty plan on a single level, a default name, and
  default settings that later features rely on.

  The application opens on the Start screen. Choosing New project there creates
  a new project and shows it in the Main window.

  An element is anything placed in a project: a wall, a room, a floor, a roof,
  a piece of furniture, a dimension line, a label… This list is not exhaustive.
  A new project contains no element at all.

  The project name is stored in the project document. It is "Untitled" for a
  new project. When an untitled project is saved for the first time, it takes
  the name of its file (without the .cabn extension); after that, saving under
  another file name no longer changes it. That behavior belongs to the save
  feature.

  Display units (mm, cm, m) are an application preference, not a project
  setting: they are out of this feature.

  Only the parts of the interface needed by these scenarios are in scope: the
  application name, the version and the New project button of the Start screen,
  the Project name in the Top bar and the Level tabs.

  Test contract: docs/api/project.md gives the core API, the results of each
  command (including refusals) and what the interface exposes for each step.
  Tests use nothing else.

  Out of scope: Open project and Recent projects on the Start screen
  (start-screen.feature), saving and opening projects, the New project command
  of the Menu and its shortcut, creating a new project while the current one
  has unsaved changes, renaming the project, adding, renaming or reordering
  levels, and the rest of the Main window.

  Rule: A new project starts with a single empty level

    @PROJ-001 @unit
    Scenario: A new project contains one level
      When a new project is created
      Then the project has 1 level
      And the level is named "Level 0"
      And the level has an elevation of 0 mm
      And the level has a height of 2500 mm

    @PROJ-002 @unit
    Scenario: The level of a new project is empty
      When a new project is created
      Then the level "Level 0" contains no element

  Rule: A project always has at least one level

    @PROJ-003 @unit
    Scenario: The last level of a project cannot be deleted
      Given a new project
      When the level "Level 0" is deleted
      Then the deletion is refused because a project needs at least one level
      And the project has 1 level
      And there is nothing to undo

    @PROJ-011 @unit
    Scenario: A level that does not exist cannot be deleted
      Given a new project
      When a level that does not exist is deleted
      Then the deletion is refused because the level does not exist
      And the project has 1 level
      And there is nothing to undo

  Rule: A new project is untitled, not saved, and has no history

    @PROJ-004 @unit
    Scenario: A new project is named "Untitled"
      When a new project is created
      Then the project is named "Untitled"

    @PROJ-005 @unit
    Scenario: A new project is not linked to any file
      When a new project is created
      Then the project is not linked to any file

    @PROJ-006 @unit
    Scenario: A new project has no unsaved changes
      When a new project is created
      Then the project has no unsaved changes

    @PROJ-007 @unit
    Scenario: A new project has nothing to undo or redo
      When a new project is created
      Then there is nothing to undo
      And there is nothing to redo

  Rule: Default wall settings are stored in the project

    @PROJ-008 @unit
    Scenario: A new project has default wall settings
      When a new project is created
      Then the default wall thickness is 200 mm
      And the default wall height is 2500 mm

  Rule: New project on the Start screen opens a new project in the Main window

    @PROJ-009 @e2e @electron
    Scenario: The Start screen offers to create a new project
      Given the application is started
      Then the Start screen is displayed
      And the application name "Cabane" is shown
      And the application version is shown
      And the New project button is shown

    @PROJ-010 @e2e @electron
    Scenario: Choosing New project shows the new project
      Given the application is started
      When the user chooses New project
      Then the Main window is displayed
      And the Project name "Untitled" is shown in the Top bar
      And the Level tabs contain only "Level 0"
      And "Level 0" is the selected level
