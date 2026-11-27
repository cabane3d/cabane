Feature: Tool bar

  The Tool bar holds the tools of the Main window. Exactly one tool is active at
  a time, and the active tool decides what the clicks on the Plan view do. It
  floats over the Plan view, on its left side (docs/design/main-window.md).

  This feature creates the Tool bar and its mechanism: the active tool, the
  shortcuts, the tooltips and the accessibility. The tools are added by the
  features that give them something to do. It starts with the Select tool, the
  default tool, with the shortcut V, which stays the first tool of the bar. It
  does nothing yet on the Plan view; selecting elements comes with the
  features that create them.

  The Select tool is active when a project is shown. Choosing a tool, with the
  mouse or with its shortcut, makes it the only active one; choosing the active
  tool again keeps it active. A shortcut is a single key, without modifier, and
  it is ignored while the focus is in a text field. A key that is not the
  shortcut of a tool does nothing.

  The active tool belongs to the application window, not to the project: it is
  not saved, it cannot be undone, and it does not mark the project as having
  unsaved changes.

  The active tool is shown as a filled tile and announced as pressed to
  assistive technologies, never by the color of its icon alone. Each tool shows
  its name and its shortcut in a tooltip. The Tool bar is one stop of the Tab
  order, and the arrow keys move the focus between its tools.

  Test contract: docs/api/tool-bar.md gives the state of the tools and what the
  interface exposes for each step. Tests use nothing else.

  Out of scope: every tool other than the Select tool (the Wall tool comes with
  draw-wall.feature), the Catalog button, customizing shortcuts, the cursor
  shapes, what a tool does on the Plan view.

  Rule: One tool is active at a time, and it is the Select tool at the start

    @TOOL-001 @unit
    Scenario: The Select tool is active when a project is shown
      When a project is shown
      Then the active tool is the Select tool

    @TOOL-002 @unit
    Scenario: Choosing the active tool keeps it active
      Given a project is shown
      When the Select tool is chosen
      Then the active tool is the Select tool

    @TOOL-003 @unit
    Scenario: The shortcut of a tool chooses it
      Given a project is shown
      When the key V is pressed
      Then the active tool is the Select tool

    @TOOL-004 @unit
    Scenario Outline: A key that is not a shortcut does nothing
      Given a project is shown
      When the key <key> is pressed
      Then the active tool is the Select tool

      Examples:
        | key |
        | Q   |
        | 1   |
        | F   |

    @TOOL-005 @unit
    Scenario: The active tool is not part of the project
      Given a new project is shown
      When the Select tool is chosen
      Then the project has no unsaved changes
      And there is nothing to undo

  Rule: The Tool bar shows the tools and the active one

    @TOOL-006 @e2e @electron
    Scenario: The Tool bar offers the Select tool
      Given the application is started
      When the user chooses New project
      Then the Tool bar is displayed in the Plan view
      And the Tool bar starts with the Select tool
      And the Select tool is active

    @TOOL-007 @e2e @electron
    Scenario: Choosing the active tool keeps it active
      Given a new project is open in the Main window
      When the user chooses the Select tool
      Then the Select tool is active

    @TOOL-008 @e2e @electron
    Scenario: The shortcut chooses the tool
      Given a new project is open in the Main window
      When the user presses V
      Then the Select tool is active

    @TOOL-009 @e2e @electron
    Scenario: A tool shows its name and its shortcut in a tooltip
      Given a new project is open in the Main window
      When the user hovers the Select tool
      Then a tooltip shows "Select tool" and the shortcut "V"

  Rule: The Tool bar is accessible and never relies on color alone

    @TOOL-010 @e2e @electron
    Scenario: The active tool is announced as pressed
      Given a new project is open in the Main window
      Then the Select tool is announced as pressed

    @TOOL-011 @e2e @electron
    Scenario: The Tool bar is reachable with the keyboard
      Given a new project is open in the Main window
      When the user presses Tab until the focus enters the Tool bar
      Then the focus is on the Select tool

    @TOOL-012 @visual
    Scenario: The active tool is marked
      Given a new project is open in the Main window
      Then the Tool bar matches its reference screenshot
