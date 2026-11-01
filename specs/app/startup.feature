Feature: Application startup

  Smoke specification created with the project scaffolding. It proves that the whole
  toolchain works end to end: Gherkin compilation by playwright-bdd, the browser-only
  renderer on the fake platform, the packaged Electron app with its preload bridge,
  and the factory scripts.

  Business rules:
  - Opening the application shows the workspace, without any prior configuration.
  - The workspace shows the application version, read from the system through the platform.

  @APP-001 @e2e @electron
  Scenario: The workspace is displayed when the application starts
    Given the application is started
    Then the workspace is displayed
    And the application name "Cabane" is shown
    And the application version is shown
