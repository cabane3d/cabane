import type { Page } from '@playwright/test';

/**
 * Locators of the zones named in the glossary (docs/design/main-window.md).
 * Every acceptance step finds a zone through these functions, never through the DOM structure.
 */

/** The Start screen, shown before any project is open. */
export function startScreen(page: Page) {
  return page.getByRole('main', { name: 'Start screen', exact: true });
}

/** The Main window, shown once a project is open. */
export function mainWindow(page: Page) {
  return page.getByRole('main', { name: 'Main window', exact: true });
}

/** The Top bar of the Main window. */
export function topBar(page: Page) {
  return page.getByRole('banner', { name: 'Top bar', exact: true });
}

/** The tabs of the levels, at the bottom of the plan view. */
export function levelTabs(page: Page) {
  return page.getByRole('tablist', { name: 'Level tabs', exact: true });
}

/** The Plan view of the Main window, where the Tool bar floats (docs/design/main-window.md). */
export function planView(page: Page) {
  return page.getByRole('region', { name: 'Plan view', exact: true });
}

/** The Tool bar, on the left of the Plan view. */
export function toolBar(page: Page) {
  return planView(page).getByRole('toolbar', { name: 'Tool bar', exact: true });
}

/** The Select tool button of the Tool bar (docs/api/tool-bar.md). */
export function selectTool(page: Page) {
  return toolBar(page).getByRole('button', { name: 'Select tool', exact: true });
}

/** The Status bar, at the bottom of the Main window (docs/design/main-window.md). */
export function statusBar(page: Page) {
  return page.getByRole('contentinfo', { name: 'Status bar', exact: true });
}

/** The Wall tool button of the Tool bar (docs/api/walls.md). */
export function wallTool(page: Page) {
  return toolBar(page).getByRole('button', { name: 'Wall tool', exact: true });
}

/** The Undo button of the Top bar: an icon button named Undo (docs/api/walls.md). */
export function undoButton(page: Page) {
  return topBar(page).getByRole('button', { name: 'Undo', exact: true });
}

/** The Redo button of the Top bar: an icon button named Redo (docs/api/walls.md). */
export function redoButton(page: Page) {
  return topBar(page).getByRole('button', { name: 'Redo', exact: true });
}

/** The visually hidden list describing the elements of the plan, inside the Plan view (docs/api/walls.md). */
export function planElements(page: Page) {
  return planView(page).getByRole('list', { name: 'Plan elements', exact: true });
}
