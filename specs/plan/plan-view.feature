Feature: Plan view

  The Plan view shows the current level seen from above, on paper (see
  docs/design/plan-drawing.md). It converts between plan coordinates (in
  millimeters, X to the right, Y up, ADR-0017) and screen pixels (Y down).

  The Plan view is the region the Main window already has (new-project.feature)
  and the Tool bar floats over (tool-bar.feature). This feature makes it a
  working view: a scale, a position, the zoom and the pan, and the Status bar.

  The view has a scale, in screen pixels per millimeter, and a position. When a
  project is shown, the scale is 1 px = 10 mm, which the Status bar displays as
  a zoom of 100%, and the plan origin (0 mm, 0 mm) is at the center of the Plan
  view. The scale is limited from 1 px = 1 mm (zoom 1000%) to 1 px = 100 mm
  (zoom 10%).

  The wheel zooms toward the cursor: the plan point under the cursor does not
  move on screen. Each wheel notch multiplies the scale by 1.1 (wheel up, zoom
  in) or divides it by 1.1 (wheel down, zoom out), within the limits. The
  middle button, or the Space key held with the left button, moves the plan
  under the cursor, whatever the active tool.

  The Status bar is created by this feature, at the bottom of the Main window.
  It shows the plan coordinates of the cursor while it is over the Plan view,
  and the zoom. The other items of the design (snapping state, display units)
  are added by the features that need them.

  The scale, the position and the zoom are not part of the project: they are
  not saved, they cannot be undone, and they do not mark the project as having
  unsaved changes.

  Test contract: the view and its conversions are pure functions of the scale,
  the position and the size of the view, tested without a screen.
  docs/api/plan-view.md gives them and what the interface exposes for each
  step. Tests use nothing else.

  Out of scope: fitting the view to the content, zoom buttons, keyboard zoom,
  touch gestures, the rulers and the grid, the paper texture, drawing elements,
  a separate view per level, the 3D view, remembering the view between sessions.

  Rule: The view converts between plan and screen coordinates

    @PLAN-001 @unit
    Scenario Outline: Converting between plan and screen coordinates
      Given a view of 1000 px by 600 px at 1 px = 10 mm with the plan origin at the center
      When the plan point <plan> is converted to screen coordinates
      Then the screen point is <screen>
      And converting that screen point back gives the plan point <plan>

      Examples:
        | plan                | screen     |
        | (0 mm, 0 mm)        | (500, 300) |
        | (1000 mm, 0 mm)     | (600, 300) |
        | (0 mm, 1000 mm)     | (500, 200) |
        | (-2500 mm, -500 mm) | (250, 350) |

    @PLAN-002 @unit
    Scenario: A view starts at 1 px = 10 mm with the origin at the center
      When a view of 1000 px by 600 px is created
      Then the scale is 1 px = 10 mm
      And the zoom is 100%
      And the plan origin is at screen (500, 300)

  Rule: The wheel zooms toward the cursor

    @PLAN-003 @unit
    Scenario: Zooming keeps the point under the cursor in place
      Given a view of 1000 px by 600 px at 1 px = 10 mm with the plan origin at the center
      When the view is zoomed in by 3 notches with the cursor at screen (700, 200)
      Then the plan point under the screen point (700, 200) is the same as before
      And the scale is 1 px = 7.513 mm

    @PLAN-004 @unit
    Scenario: Zooming out then in by the same number of notches restores the view
      Given a view of 1000 px by 600 px at 1 px = 10 mm with the plan origin at the center
      When the view is zoomed out by 4 notches with the cursor at screen (700, 200)
      And the view is zoomed in by 4 notches with the cursor at screen (700, 200)
      Then the scale is 1 px = 10 mm
      And the plan origin is at screen (500, 300)

    @PLAN-005 @unit
    Scenario Outline: The scale stays within its limits
      Given a view of 1000 px by 600 px at 1 px = 10 mm with the plan origin at the center
      When the view is zoomed <direction> by 100 notches with the cursor at screen (700, 200)
      Then the scale is <scale>
      And the zoom is <zoom>

      Examples:
        | direction | scale         | zoom  |
        | in        | 1 px = 1 mm   | 1000% |
        | out       | 1 px = 100 mm | 10%   |

    @PLAN-006 @unit
    Scenario: Zooming at a limit does not move the plan
      Given a view of 1000 px by 600 px at 1 px = 1 mm with the plan origin at screen (300, 100)
      When the view is zoomed in by 1 notch with the cursor at screen (700, 200)
      Then the scale is 1 px = 1 mm
      And the plan origin is at screen (300, 100)

  Rule: The plan can be moved under the cursor

    @PLAN-007 @unit
    Scenario: Moving the plan
      Given a view of 1000 px by 600 px at 1 px = 10 mm with the plan origin at the center
      When the plan is moved by (-100, 50) px
      Then the plan origin is at screen (400, 350)
      And the scale is 1 px = 10 mm

  Rule: The Plan view and the Status bar follow the user's gestures

    @PLAN-008 @e2e @electron
    Scenario: The Plan view and the Status bar are shown with the project
      Given the application is started
      When the user chooses New project
      Then the Plan view is displayed
      And the Status bar is displayed
      And the Status bar shows a zoom of 100%

    @PLAN-009 @e2e @electron
    Scenario: The wheel zooms the plan toward the cursor
      Given a new project is open in the Main window
      And the cursor is at the plan point (2000 mm, 1000 mm)
      When the user turns the wheel up by 3 notches
      Then the Status bar shows a zoom of 133%
      And the plan point under the cursor is still (2000 mm, 1000 mm)

    @PLAN-010 @e2e @electron
    Scenario: The wheel zooms out
      Given a new project is open in the Main window
      When the user turns the wheel down by 3 notches
      Then the Status bar shows a zoom of 75%

    @PLAN-011 @e2e @electron
    Scenario Outline: Moving the plan with the mouse
      Given a new project is open in the Main window
      When the user moves the plan with <gesture> by (100, 0) px
      Then the plan origin has moved by (100, 0) px on screen
      And the Status bar still shows a zoom of 100%

      Examples:
        | gesture                           |
        | the middle button                 |
        | the Space key and the left button |

    @PLAN-012 @e2e @electron
    Scenario: The Status bar shows the plan coordinates of the cursor
      Given a new project is open in the Main window
      When the user moves the cursor to the plan point (1250 mm, 830 mm)
      Then the Status bar shows "x 1250 mm · y 830 mm"

    @PLAN-013 @e2e @electron
    Scenario: The coordinates follow the view
      Given a new project is open in the Main window
      And the user moved the plan with the middle button by (100, 0) px
      When the user moves the cursor to the plan point (1250 mm, 830 mm)
      Then the Status bar shows "x 1250 mm · y 830 mm"
