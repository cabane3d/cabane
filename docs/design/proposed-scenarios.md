# Proposed scenarios for the design system

Specs belong to the maintainer (ADR-0011), so these scenarios are **proposals**: copy, adapt or drop them into `specs/`. Identifiers use a `UI-` prefix as a suggestion; change it to fit the spec naming. Delete this file once the specs exist.

The length field scenarios are now in `specs/ui/length-field.feature` (UI-001 to UI-007) and the tool bar ones in `specs/ui/tool-bar.feature` (TOOL-001 to TOOL-012). The scenarios below need the main window in the application (themes) and step definitions; they go through the agent workflow (`/implement`) once moved to `specs/`.

## `specs/ui/theme.feature`

```gherkin
Feature: Light and dark themes

  Business rules:
  - The interface follows the system light or dark setting.

  @UI-030 @visual
  Scenario Outline: The main window in each theme
    Given the system uses the <theme> theme
    When the application is started
    Then the main window matches its <theme> reference screenshot

    Examples:
      | theme |
      | light |
      | dark  |
```
