Feature: Draw walls

  A wall is a straight segment on a level of the plan, with a thickness and a
  height. It is drawn with the Wall tool (shortcut W) on the Plan view.

  This feature builds on tool-bar.feature (it adds the Wall tool to the Tool
  bar) and plan-view.feature (the plan coordinates, the scale and the Status
  bar). It also adds the Undo and Redo buttons to the Top bar, which the Main
  window does not have yet, because drawing makes them useful. Selecting and
  editing walls come with edit-wall.feature.

  Drawing. The first left click sets the start point. Each following left click
  sets the end point of a wall, creates it, and becomes the start point of the
  next one: walls are drawn in a chain. The chain ends with Escape, with a
  double-click, or with a click on the first point of the chain (closing it).
  Only the left button draws. Choosing another tool during a chain abandons the
  wall being drawn; the walls already created stay. The Wall tool stays active
  at the end of a chain.

  Shape. The clicked segment is a face of the wall. The thickness goes to the
  right of the drawing direction (plan axes: X to the right, Y up). A wall drawn
  from (0 mm, 0 mm) to (3500 mm, 0 mm) with a thickness of 200 mm covers the
  rectangle from y = -200 mm to y = 0 mm. Drawing clockwise puts the walls
  inside the room.

  Defaults. A new wall takes the default wall thickness and the default wall
  height of the project (PROJ-008). Changing the defaults afterwards never
  changes existing walls.

  Anchors. The start and end points of the walls of the level are anchors. When
  the cursor is within 8 px of an anchor on screen (whatever the zoom), the
  point being placed snaps onto the nearest anchor, so that two walls meeting
  there have exactly the same coordinates. The model keeps no link between
  walls: a joint is not stored, it is a shape derived from two walls that share
  a point (see Joints). Anchors are the clicked points, not the corners of the
  thickness. There is no other snapping. The snap distance is an
  application constant, not a project setting. Walls may overlap or cross each
  other; nothing is checked.

  Joints. When two walls of a level share a point (the start or the end of one
  is the start or the end of the other) and are not parallel, their outer
  faces are extended until they meet, and the plan fills the corner between the
  two walls and that meeting point, so that the walls touch over their whole
  thickness and no square notch is left outside the corner. This is a mitre.
  A corner of a wall that turns towards the thickness side (drawing clockwise,
  the thickness to the right) has no outer notch: it has no joint. The faces
  are extended past the end of the walls: when they meet before the shared
  point (or at it), there is nothing to fill and no joint. When the meeting
  point is farther from the shared point than twice the larger of the two
  thicknesses (a very sharp angle), the corner is cut off instead (a bevel):
  the fill joins the two outer corners of the walls at the shared point,
  without the meeting point. Parallel walls, walls that only touch with their
  sides, and walls that do not share a point have no joint. When more than two
  walls meet at a point, a joint is drawn only between two walls that are
  neighbours around that point: it is dropped when another wall meets at the
  point inside the corner to fill (its direction away from the point lies
  between the two walls, on the side of the meeting point). The stored corners
  of a wall (WALL-006) never change: a joint only changes what the plan draws.
  Walls of different heights come with later features.

  Display. While the Wall tool is active, the plan shows the anchors as small
  marks, and the anchor the point snaps to is marked with a small cross. During
  drawing, the plan shows the wall being drawn with its real thickness and its
  live length (the dimension style of docs/design/plan-drawing.md). Walls are
  drawn as solid shapes in the plan.

  Undo and Redo. The Undo and Redo buttons of the Top bar undo and redo the last
  change of the project, one wall at a time. They are disabled when there is
  nothing to undo or redo. Ctrl+Z undoes and Ctrl+Shift+Z redoes, except while
  the focus is in a text field.

  Test contract: docs/api/walls.md gives the core API, the results of each
  command (including refusals) and what the interface exposes for each step.
  Tests use nothing else.

  Out of scope: selecting and editing walls, moving walls, curved walls, angle
  snapping, alignment guides, T-junction anchors and T-junction joints, entering a length with the
  keyboard while drawing, adding levels (so anchors are tested on a single
  level), openings, rooms, the 3D view.

  Rule: A wall is created with the default thickness and height

    @WALL-001 @unit
    Scenario: Adding a wall
      Given a new project
      When a wall is added from (0 mm, 0 mm) to (3500 mm, 0 mm) on "Level 0"
      Then "Level 0" contains 1 wall
      And the wall starts at (0 mm, 0 mm) and ends at (3500 mm, 0 mm)
      And the wall has a length of 3500 mm
      And the wall has a thickness of 200 mm
      And the wall has a height of 2500 mm

    @WALL-002 @unit
    Scenario: A wall uses the defaults of the project at the time it is added
      Given a new project whose default wall thickness is 100 mm and default wall height is 2700 mm
      When a wall is added from (0 mm, 0 mm) to (1000 mm, 0 mm) on "Level 0"
      Then the wall has a thickness of 100 mm
      And the wall has a height of 2700 mm

    @WALL-003 @unit
    Scenario: A wall without length is refused
      Given a new project
      When a wall is added from (500 mm, 500 mm) to (500 mm, 500 mm) on "Level 0"
      Then the addition is refused because the wall has no length
      And "Level 0" contains no element
      And there is nothing to undo

    @WALL-004 @unit
    Scenario: A wall on a level that does not exist is refused
      Given a new project
      When a wall is added from (0 mm, 0 mm) to (1000 mm, 0 mm) on a level that does not exist
      Then the addition is refused because the level does not exist
      And there is nothing to undo

    @WALL-005 @unit
    Scenario: Adding a wall can be undone and redone
      Given a new project
      And a wall added from (0 mm, 0 mm) to (3500 mm, 0 mm) on "Level 0"
      When the last change is undone
      Then "Level 0" contains no element
      When the last change is redone
      Then "Level 0" contains 1 wall

    @WALL-006 @unit
    Scenario Outline: The thickness is to the right of the drawing direction
      Given a new project
      When a wall is added from <start> to <end> on "Level 0"
      Then the wall covers the corners <corners>

      Examples:
        | start           | end              | corners                                   |
        | (0 mm, 0 mm)    | (3500 mm, 0 mm)  | (0, 0) (3500, 0) (3500, -200) (0, -200)   |
        | (0 mm, 0 mm)    | (0 mm, -3500 mm) | (0, 0) (0, -3500) (-200, -3500) (-200, 0) |
        | (3500 mm, 0 mm) | (0 mm, 0 mm)     | (3500, 0) (0, 0) (0, 200) (3500, 200)     |

    @WALL-007 @unit
    Scenario: Walls may overlap
      Given a new project
      And a wall added from (0 mm, 0 mm) to (3500 mm, 0 mm) on "Level 0"
      When a wall is added from (1000 mm, 0 mm) to (2000 mm, 0 mm) on "Level 0"
      Then "Level 0" contains 2 walls

  Rule: Anchors snap the point being placed onto the ends of existing walls

    @WALL-008 @unit
    Scenario Outline: The nearest anchor within the snap distance is chosen
      Given the anchors (0 mm, 0 mm) and (3500 mm, 0 mm)
      And a scale of 1 px = 10 mm
      When the snap point is looked up for the cursor at <cursor>
      Then the snap point is <result>

      Examples:
        | cursor            | result          |
        | (60 mm, 30 mm)    | (0 mm, 0 mm)    |
        | (3450 mm, -40 mm) | (3500 mm, 0 mm) |
        | (200 mm, 0 mm)    | no anchor       |
        | (80 mm, 0 mm)     | (0 mm, 0 mm)    |
        | (81 mm, 0 mm)     | no anchor       |

    @WALL-009 @unit
    Scenario: The snap distance is 8 px, so it changes with the scale
      Given the anchor (0 mm, 0 mm)
      When the snap point is looked up for the cursor at (200 mm, 0 mm) at a scale of 1 px = 10 mm
      Then the snap point is no anchor
      When the snap point is looked up for the cursor at (200 mm, 0 mm) at a scale of 1 px = 50 mm
      Then the snap point is (0 mm, 0 mm)

    @WALL-010 @unit
    Scenario: With two anchors in range, the nearest one wins
      Given the anchors (0 mm, 0 mm) and (100 mm, 0 mm)
      And a scale of 1 px = 10 mm
      When the snap point is looked up for the cursor at (70 mm, 0 mm)
      Then the snap point is (100 mm, 0 mm)

    @WALL-011 @unit
    Scenario: The anchors of a level are the ends of its walls
      Given a new project
      And a wall added from (0 mm, 0 mm) to (3500 mm, 0 mm) on "Level 0"
      And a wall added from (3500 mm, 0 mm) to (3500 mm, 2000 mm) on "Level 0"
      When the anchors of "Level 0" are listed
      Then the anchors are (0 mm, 0 mm), (3500 mm, 0 mm) and (3500 mm, 2000 mm)

  Rule: The Wall tool is a tool of the Tool bar

    @WALL-012 @unit
    Scenario Outline: Choosing a tool makes it the only active one
      Given a project is shown
      And the active tool is the <before> tool
      When the <chosen> tool is chosen
      Then the active tool is the <chosen> tool

      Examples:
        | before | chosen |
        | Select | Wall   |
        | Wall   | Select |
        | Wall   | Wall   |
        | Select | Select |

    @WALL-013 @unit
    Scenario Outline: A shortcut chooses its tool
      Given a project is shown
      When the key <key> is pressed
      Then the active tool is the <tool> tool

      Examples:
        | key | tool   |
        | W   | Wall   |
        | V   | Select |

    @WALL-014 @unit
    Scenario Outline: A shortcut with a modifier does nothing
      Given a project is shown
      When the key W is pressed with <modifier>
      Then the active tool is the Select tool

      Examples:
        | modifier |
        | Ctrl     |
        | Alt      |

    @WALL-015 @unit
    Scenario: A shortcut is ignored while the focus is in a text field
      Given a project is shown
      And the focus is in a text field
      When the key W is pressed
      Then the active tool is the Select tool

    @WALL-016 @e2e @electron
    Scenario: The Tool bar offers the Select tool then the Wall tool
      Given a new project is open in the Main window
      Then the Tool bar contains the Select tool and the Wall tool, in this order
      And the Select tool is active
      And the Wall tool is not active

    @WALL-017 @e2e @electron
    Scenario: Choosing the Wall tool with the mouse
      Given a new project is open in the Main window
      When the user chooses the Wall tool
      Then the Wall tool is active and announced as pressed
      And the Select tool is not active and announced as not pressed

    @WALL-018 @e2e @electron
    Scenario: Choosing a tool with its shortcut
      Given a new project is open in the Main window
      When the user presses W
      Then the Wall tool is active
      When the user presses V
      Then the Select tool is active

    @WALL-019 @e2e @electron
    Scenario: The arrow keys move the focus between the tools
      Given a new project is open in the Main window
      And the focus is on the Select tool
      When the user presses the Down arrow
      Then the focus is on the Wall tool
      And the Select tool is still active

    @WALL-020 @e2e @electron
    Scenario: The Wall tool shows its name and its shortcut in a tooltip
      Given a new project is open in the Main window
      When the user hovers the Wall tool
      Then a tooltip shows "Wall tool" and the shortcut "W"

    @WALL-021 @visual
    Scenario: The Tool bar with the Wall tool active
      Given a new project is open in the Main window
      When the user chooses the Wall tool
      Then the Tool bar matches its reference screenshot

  Rule: Walls are drawn in a chain with the Wall tool

    @WALL-022 @e2e @electron
    Scenario: Two clicks draw a wall
      Given a new project is open in the Main window
      And the Wall tool is active
      When the user clicks the plan at (1000 mm, 1000 mm)
      And the user clicks the plan at (4500 mm, 1000 mm)
      Then the project has 1 wall on "Level 0"
      And that wall starts at (1000 mm, 1000 mm) and ends at (4500 mm, 1000 mm)
      And the plan shows 1 wall
      And the Wall tool is still active

    @WALL-023 @e2e @electron
    Scenario: Each click continues the chain
      Given a new project is open in the Main window
      And the Wall tool is active
      When the user clicks the plan at (1000 mm, 1000 mm)
      And the user clicks the plan at (4500 mm, 1000 mm)
      And the user clicks the plan at (4500 mm, -2000 mm)
      Then the project has 2 walls on "Level 0"
      And the second wall starts at (4500 mm, 1000 mm) and ends at (4500 mm, -2000 mm)

    @WALL-024 @e2e @electron
    Scenario: The plan shows the wall being drawn
      Given a new project is open in the Main window
      And the Wall tool is active
      When the user clicks the plan at (1000 mm, 1000 mm)
      And the user moves the cursor to (3000 mm, 1000 mm)
      Then the plan shows a wall being drawn with a length of 2000 mm
      And the project has no wall yet

    @WALL-025 @e2e @electron
    Scenario: Escape ends the chain and keeps the walls already drawn
      Given a new project is open in the Main window
      And the Wall tool is active
      And the user clicked the plan at (1000 mm, 1000 mm)
      And the user clicked the plan at (4500 mm, 1000 mm)
      When the user presses Escape
      And the user clicks the plan at (4500 mm, -2000 mm)
      Then the project has 1 wall on "Level 0"
      And the plan shows no wall being drawn

    @WALL-026 @e2e @electron
    Scenario: A double-click ends the chain without a wall of zero length
      Given a new project is open in the Main window
      And the Wall tool is active
      And the user clicked the plan at (1000 mm, 1000 mm)
      When the user double-clicks the plan at (4500 mm, 1000 mm)
      Then the project has 1 wall on "Level 0"
      And the plan shows no wall being drawn

    @WALL-027 @e2e @electron
    Scenario: Clicking the first point of the chain closes it
      Given a new project is open in the Main window
      And the Wall tool is active
      And the user clicked the plan at (0 mm, 0 mm)
      And the user clicked the plan at (4000 mm, 0 mm)
      And the user clicked the plan at (4000 mm, -3000 mm)
      When the user clicks the plan near (0 mm, 0 mm), a few pixels off
      Then the project has 3 walls on "Level 0"
      And the third wall ends at (0 mm, 0 mm)
      And the plan shows no wall being drawn

    @WALL-028 @e2e @electron
    Scenario: Choosing another tool during a chain abandons the wall being drawn
      Given a new project is open in the Main window
      And the Wall tool is active
      And the user clicked the plan at (1000 mm, 1000 mm)
      And the user clicked the plan at (4500 mm, 1000 mm)
      When the user chooses the Select tool
      Then the project has 1 wall on "Level 0"
      And the plan shows no wall being drawn

    @WALL-029 @e2e
    Scenario: Only the left button draws
      Given a new project is open in the Main window
      And the Wall tool is active
      When the user right-clicks the plan at (1000 mm, 1000 mm)
      And the user right-clicks the plan at (4500 mm, 1000 mm)
      Then the project has no wall

    @WALL-030 @e2e @electron
    Scenario: The Select tool does not draw
      Given a new project is open in the Main window
      When the user clicks the plan at (1000 mm, 1000 mm)
      And the user clicks the plan at (4500 mm, 1000 mm)
      Then the project has no wall

  Rule: Undo and Redo work on the walls, one at a time

    @WALL-031 @e2e @electron
    Scenario: Undo and Redo are disabled when there is nothing to undo or redo
      Given a new project is open in the Main window
      Then the Undo button of the Top bar is disabled
      And the Redo button of the Top bar is disabled

    @WALL-032 @e2e @electron
    Scenario: Undo removes the last wall of the chain and drawing continues from the previous one
      Given a new project is open in the Main window
      And the Wall tool is active
      And the user clicked the plan at (1000 mm, 1000 mm)
      And the user clicked the plan at (4500 mm, 1000 mm)
      And the user clicked the plan at (4500 mm, -2000 mm)
      When the user chooses the Undo button of the Top bar
      Then the project has 1 wall on "Level 0"
      When the user clicks the plan at (0 mm, -2000 mm)
      Then the second wall starts at (4500 mm, 1000 mm) and ends at (0 mm, -2000 mm)

    @WALL-033 @e2e @electron
    Scenario: Redo brings the wall back
      Given a new project is open in the Main window
      And a wall is drawn from (1000 mm, 1000 mm) to (4500 mm, 1000 mm)
      And the user chose the Undo button of the Top bar
      When the user chooses the Redo button of the Top bar
      Then the project has 1 wall on "Level 0"
      And the Redo button of the Top bar is disabled

    @WALL-034 @e2e @electron
    Scenario: The keyboard shortcuts undo and redo
      Given a new project is open in the Main window
      And a wall is drawn from (1000 mm, 1000 mm) to (4500 mm, 1000 mm)
      When the user presses Ctrl+Z
      Then the project has no wall
      When the user presses Ctrl+Shift+Z
      Then the project has 1 wall on "Level 0"

  Rule: Anchors help two walls to meet exactly

    @WALL-035 @e2e @electron
    Scenario: A new wall snaps onto the end of an existing wall
      Given a new project is open in the Main window
      And a wall is drawn from (1000 mm, 1000 mm) to (4500 mm, 1000 mm)
      And the Wall tool is active
      When the user clicks the plan near (4500 mm, 1000 mm), a few pixels off
      And the user clicks the plan at (4500 mm, -2000 mm)
      Then the second wall starts at exactly (4500 mm, 1000 mm)

    @WALL-036 @e2e @electron
    Scenario: The anchors are shown while the Wall tool is active
      Given a new project is open in the Main window
      And a wall is drawn from (1000 mm, 1000 mm) to (4500 mm, 1000 mm)
      When the user chooses the Wall tool
      Then the plan shows an anchor at (1000 mm, 1000 mm) and at (4500 mm, 1000 mm)
      When the user chooses the Select tool
      Then the plan shows no anchor

    @WALL-037 @e2e @electron
    Scenario: The snapped anchor is marked
      Given a new project is open in the Main window
      And a wall is drawn from (1000 mm, 1000 mm) to (4500 mm, 1000 mm)
      And the Wall tool is active
      When the user moves the cursor near (4500 mm, 1000 mm), a few pixels off
      Then the plan marks the anchor at (4500 mm, 1000 mm) as snapped

    @WALL-038 @e2e @electron
    Scenario: Far from any anchor, the point is where the user clicks
      Given a new project is open in the Main window
      And a wall is drawn from (1000 mm, 1000 mm) to (4500 mm, 1000 mm)
      And the Wall tool is active
      When the user clicks the plan at (4500 mm, 1600 mm)
      And the user clicks the plan at (5000 mm, 1600 mm)
      Then the second wall starts at (4500 mm, 1600 mm)

    @WALL-039 @visual
    Scenario: Walls, anchors and the wall being drawn
      Given a new project is open in the Main window
      And a wall is drawn from (1000 mm, 1000 mm) to (4500 mm, 1000 mm)
      And the Wall tool is active
      And the user clicked the plan near (4500 mm, 1000 mm), a few pixels off
      When the user moves the cursor to (4500 mm, -2000 mm)
      Then the plan matches its reference screenshot

  Rule: Walls that meet at an anchor are joined with a mitre

    @WALL-040 @unit
    Scenario Outline: A joint fills the outer corner of two walls that meet
      Given a new project
      And a wall added from <a1> to <a2> on "Level 0"
      And a wall added from <b1> to <b2> on "Level 0"
      When the joint of the two walls is computed
      Then the joint covers the points <points>

      Examples:
        | a1       | a2          | b1          | b2           | points                                                    |
        | (0, 0)   | (4000, 0)   | (4000, 0)   | (4000, 3000) | (4000, 0) (4200, 0) (4200, -200) (4000, -200)             |
        | (0, 0)   | (4000, 0)   | (4000, 0)   | (6000, 2000) | (4000, 0) (4141.42, -141.42) (4082.84, -200) (4000, -200) |

    @WALL-041 @unit
    Scenario: A very sharp angle is cut off instead of extended
      Given a new project
      And a wall added from (0 mm, 0 mm) to (4000 mm, 0 mm) on "Level 0"
      And a wall added from (4000 mm, 0 mm) to (1000 mm, 1000 mm) on "Level 0"
      When the joint of the two walls is computed
      Then the joint covers the points (4000, 0) (4063.25, 189.74) (4000, -200)

    @WALL-042 @unit
    Scenario Outline: Walls without an outer notch have no joint
      Given a new project
      And a wall added from <a1> to <a2> on "Level 0"
      And a wall added from <b1> to <b2> on "Level 0"
      When the joint of the two walls is computed
      Then the two walls have no joint

      Examples:
        | a1     | a2        | b1          | b2            | case                              |
        | (0, 0) | (4000, 0) | (4000, 0)   | (4000, -3000) | turning towards the thickness     |
        | (0, 0) | (4000, 0) | (4000, 0)   | (7000, 0)     | in line                           |
        | (0, 0) | (4000, 0) | (4000, 0)   | (1000, 0)     | going back along the first wall   |
        | (0, 0) | (4000, 0) | (4000, 3000) | (4000, 0)    | both ending at the same point     |
        | (0, 0) | (4000, 0) | (5000, 0)   | (5000, 3000)  | not sharing a point               |
        | (0, 0) | (4000, 0) | (6000, 2000) | (4000, 0)    | meeting before the shared point   |

    @WALL-047 @unit
    Scenario: Two walls that meet give one joint
      Given a new project
      And a wall added from (0 mm, 0 mm) to (4000 mm, 0 mm) on "Level 0"
      And a wall added from (4000 mm, 0 mm) to (4000 mm, 3000 mm) on "Level 0"
      When the joints of "Level 0" are computed
      Then there is 1 joint
      And the joint is at (4000 mm, 0 mm)

    @WALL-048 @unit
    Scenario: A wall that meets inside the corner takes the joint away
      Given a new project
      And a wall added from (0 mm, 0 mm) to (4000 mm, 0 mm) on "Level 0"
      And a wall added from (4000 mm, 0 mm) to (4000 mm, 3000 mm) on "Level 0"
      And a wall added from (4000 mm, 0 mm) to (7000 mm, 0 mm) on "Level 0"
      When the joints of "Level 0" are computed
      Then there is no joint

    @WALL-049 @e2e @electron
    Scenario: The plan shows a joint where two walls meet at an outer corner
      Given a new project is open in the Main window
      And the Wall tool is active
      When the user clicks the plan at (1000 mm, 1000 mm)
      And the user clicks the plan at (4500 mm, 1000 mm)
      And the user clicks the plan at (4500 mm, 3000 mm)
      Then the plan shows a joint at (4500 mm, 1000 mm)
      And that joint covers the points (4500, 1000) (4700, 1000) (4700, 800) (4500, 800)

    @WALL-050 @e2e @electron
    Scenario: The plan shows no joint where the corner has no outer notch
      Given a new project is open in the Main window
      And the Wall tool is active
      When the user clicks the plan at (1000 mm, 1000 mm)
      And the user clicks the plan at (4500 mm, 1000 mm)
      And the user clicks the plan at (4500 mm, -2000 mm)
      Then the plan shows no joint

    @WALL-051 @e2e @electron
    Scenario: Undo removes the joint with the wall
      Given a new project is open in the Main window
      And the Wall tool is active
      And the user clicked the plan at (1000 mm, 1000 mm)
      And the user clicked the plan at (4500 mm, 1000 mm)
      And the user clicked the plan at (4500 mm, 3000 mm)
      Then the plan shows a joint at (4500 mm, 1000 mm)
      When the user chooses the Undo button of the Top bar
      Then the plan shows no joint

    @WALL-052 @visual
    Scenario: A joint at an outer corner
      Given a new project is open in the Main window
      And the Wall tool is active
      And the user clicked the plan at (1000 mm, 1000 mm)
      And the user clicked the plan at (4500 mm, 1000 mm)
      When the user double-clicks the plan at (4500 mm, 3000 mm)
      Then the plan matches its reference screenshot
