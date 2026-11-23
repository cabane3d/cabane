# Proposed scenarios for the design system

Specs belong to the maintainer (ADR-0011), so these scenarios are **proposals**: copy, adapt or drop them into `specs/`. Identifiers use a `UI-` prefix as a suggestion; change it to fit the spec naming. Delete this file once the specs exist.

The behavior they describe is already implemented and covered by Vitest tests (`packages/core/src/length-input.test.ts`, `packages/ui/src/components/*.test.tsx`); once the specs exist, those tests should reference the identifiers.

## `specs/ui/length-field.feature`

```gherkin
Feature: Length fields

  Length fields (wall length, thickness, height…) accept what people naturally type:
  a number in the display unit, a number with a unit, or a small calculation.
  The model always receives millimeters (ADR-0017).

  Business rules:
  - A number without a unit is in the display unit.
  - The units mm, cm and m are accepted, with a decimal point or a comma.
  - Additions, subtractions, multiplications and divisions are accepted, with parentheses.
  - A number without a unit that multiplies or divides a length is a plain factor.
  - Enter or leaving the field commits the entry; Escape restores the current value.
  - An entry that is not a length is kept in the field, marked invalid with a message,
    and nothing changes in the project.
  - A length is never zero or negative: such an entry is refused the same way.
  - Committing an empty field asks whether to delete the element. Delete removes it
    (and can be undone); Keep leaves it unchanged and the field shows its last dimension.

  @UI-001 @unit
  Scenario Outline: Typing a length with a unit or a calculation
    Given a length field showing 3500 mm, with millimeters as the display unit
    When the user enters "<entry>"
    Then the length becomes <length> mm

    Examples:
      | entry             | length |
      | 4200              | 4200   |
      | 3.5 m             | 3500   |
      | 3,5 m             | 3500   |
      | 350 cm            | 3500   |
      | 3500 + 200        | 3700   |
      | 4200 / 2          | 2100   |
      | 3 m + 20 cm       | 3200   |
      | (3 m - 20 cm) / 2 | 1400   |

  @UI-002 @unit
  Scenario Outline: An entry that is not a length is refused
    Given a length field showing 3500 mm
    When the user enters "<entry>"
    Then the field is marked invalid with a message
    And the length is still 3500 mm

    Examples:
      | entry     |
      | abc       |
      | 3500 +    |
      | 3 ft      |
      | 2 m * 3 m |
      | 3500 / 0  |
      | 0         |
      | -200      |
      | 1 m - 2 m |

  @UI-003 @unit
  Scenario: Escape restores the current value
    Given a length field showing 3500 mm
    And the user has typed "abc" in it
    When the user presses Escape
    Then the field shows 3500 mm and is not marked invalid

  @UI-005 @unit
  Scenario: Emptying the field asks whether to delete the element
    Given a wall whose length field shows 3500 mm
    When the user empties the field and presses Enter
    Then Cabane asks whether to delete the wall
    And the field shows 3500 mm

  @UI-006 @unit
  Scenario: Deleting the element after emptying a field
    Given Cabane asks whether to delete a wall after its length field was emptied
    When the user chooses Delete
    Then the wall no longer exists

  @UI-007 @unit
  Scenario: Keeping the element after emptying a field
    Given Cabane asks whether to delete a wall 3500 mm long after its length field was emptied
    When the user chooses Keep
    Then the wall still exists
    And its length field shows 3500 mm

  @UI-004 @unit
  Scenario: The length is shown in the display unit
    Given a wall 3500 mm long
    When the display unit is meters
    Then its length field shows "3.5" followed by "m"
```

## `specs/ui/tool-bar.feature`

```gherkin
Feature: Tool bar

  The tool bar holds the creation and editing tools; exactly one tool is active at a time.

  Business rules:
  - The Select tool is active when the application starts.
  - Choosing a tool makes it the active one and deactivates the previous one.
  - The active tool is shown as a filled tile, never by the icon color alone,
    and is announced as pressed to assistive technologies.
  - Every tool shows its name and keyboard shortcut in a tooltip.

  @UI-010 @e2e
  Scenario: Choosing a tool makes it the only active tool
    Given the application is started
    When the user chooses the Wall tool
    Then the Wall tool is active
    And the Select tool is not active

  @UI-011 @visual
  Scenario: The active tool is marked
    Given the application is started
    When the user chooses the Wall tool
    Then the tool bar matches its reference screenshot
```

## `specs/ui/theme.feature`

```gherkin
Feature: Light and dark themes

  Business rules:
  - The interface follows the system light or dark setting.

  @UI-020 @visual
  Scenario Outline: The main window in each theme
    Given the system uses the <theme> theme
    When the application is started
    Then the main window matches its <theme> reference screenshot

    Examples:
      | theme |
      | light |
      | dark  |
```
