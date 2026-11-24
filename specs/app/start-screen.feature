@wip
Feature: Start screen

  The Start screen is what the application shows when it opens. From there the
  user creates a new project (new-project.feature), opens a project file, or
  reopens one of the recent projects.

  This feature depends on opening project files (.cabn, ADR-0008): it is
  implemented after the open and save specification, and is tagged @wip until
  then. Reading the file itself
  (format, migrations, invalid or newer files) belongs to that specification.

  Business rules:
  - The Start screen shows the application name and version, New project,
    Open project and Recent projects.
  - Recent projects lists at most 5 projects, the most recently opened or saved
    first. Each one shows its project name, its modification date and the folder
    that contains its file, with the home folder shortened to "~"
    (~/Documents/Cabane). The full path of the file is shown in a tooltip.
  - Opening or saving a project puts it first in Recent projects. A project that
    is already in the list moves to the top; it is never listed twice.
  - When a sixth project enters the list, the oldest one leaves it.
  - Recent projects is an application preference: it is kept between sessions
    and is not stored in any project.
  - Choosing a recent project whose file can no longer be found shows a message
    and offers to remove it from the list. Nothing else changes.

  Out of scope: thumbnails, pinning, clearing the whole list, and returning to
  the Start screen from the Main window.

  Rule: The Start screen offers every way to begin

    @START-001 @e2e @electron
    Scenario: The Start screen at startup
      Given the application is started
      Then the Start screen is displayed
      And the application name "Cabane" is shown
      And the application version is shown
      And the New project and Open project buttons are shown
      And Recent projects is shown

    @START-002 @e2e
    Scenario: No recent projects yet
      Given no project has ever been opened or saved
      When the application is started
      Then Recent projects says "No recent projects"

  Rule: Open project opens a project file

    @START-003 @e2e @electron
    Scenario: Opening a project file
      Given a project file "Kitchen.cabn" containing a project named "Kitchen"
      And the application is started
      When the user chooses Open project
      And the user picks "Kitchen.cabn"
      Then the Main window is displayed
      And the Project name "Kitchen" is shown in the Top bar

    @START-004 @e2e
    Scenario: Cancelling Open project
      Given the application is started
      When the user chooses Open project
      And the user cancels the file selection
      Then the Start screen is displayed

  Rule: Recent projects lists the last 5 projects, most recent first

    @START-005 @e2e
    Scenario: A recent project shows its name, date and folder
      Given the project "Kitchen" was saved on 2026-11-20 in the folder "Documents/Cabane" of the home folder
      When the application is started
      Then Recent projects shows "Kitchen" with its modification date and the folder "~/Documents/Cabane"
      And the tooltip of "Kitchen" shows the full path of its file

    @START-006 @unit
    Scenario: Opening a project puts it first
      Given the recent projects are "Kitchen", "Bathroom", "Garage"
      When the project "Garage" is opened
      Then the recent projects are "Garage", "Kitchen", "Bathroom"

    @START-007 @unit
    Scenario: Saving a new project puts it first
      Given the recent projects are "Kitchen", "Bathroom"
      When a new project is saved as "Attic.cabn"
      Then the recent projects are "Attic", "Kitchen", "Bathroom"

    @START-008 @unit
    Scenario: The list never holds more than 5 projects
      Given the recent projects are "A", "B", "C", "D", "E"
      When the project "F" is opened
      Then the recent projects are "F", "A", "B", "C", "D"

    @START-009 @e2e @electron
    Scenario: Recent projects are kept between sessions
      Given the project "Kitchen" was opened
      When the application is restarted
      Then Recent projects shows "Kitchen"

  Rule: Choosing a recent project opens it

    @START-010 @e2e
    Scenario: Opening a recent project
      Given Recent projects shows "Kitchen"
      When the user chooses "Kitchen" in Recent projects
      Then the Main window is displayed
      And the Project name "Kitchen" is shown in the Top bar

  Rule: A recent project whose file is missing can be removed from the list

    @START-011 @e2e
    Scenario: The file of a recent project can no longer be found
      Given Recent projects shows "Kitchen"
      And the file of "Kitchen" has been deleted
      When the user chooses "Kitchen" in Recent projects
      Then Cabane says the file of "Kitchen" cannot be found
      And offers to remove "Kitchen" from Recent projects
      And the Start screen is displayed

    @START-012 @e2e
    Scenario: Removing a missing project from the list
      Given Cabane says the file of "Kitchen" cannot be found
      When the user chooses Remove
      Then Recent projects does not show "Kitchen"

    @START-013 @e2e
    Scenario: Keeping a missing project in the list
      Given Cabane says the file of "Kitchen" cannot be found
      When the user chooses Keep
      Then Recent projects still shows "Kitchen"
