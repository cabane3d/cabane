# Proposed scenarios for the design system

Specs belong to the maintainer (ADR-0011), so these scenarios are **proposals**: copy, adapt or drop them into `specs/`. Identifiers use a `UI-` prefix as a suggestion; change it to fit the spec naming. Delete this file once the specs exist.

The length field scenarios are now in `specs/ui/length-field.feature` (UI-001 to UI-007). The scenarios below need the main window in the application (tool bar, themes) and step definitions; they go through the agent workflow (`/implement`) once moved to `specs/`.

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
