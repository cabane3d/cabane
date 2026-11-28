/**
 * The drawing tokens of the plan (docs/design/plan-drawing.md), read from the CSS custom
 * properties of `packages/ui/src/theme.css`: the renderer never hard-codes a color, a width or a
 * font. Pen sizes are in screen pixels, whatever the zoom.
 */

export interface PlanTokens {
  readonly ink: string;
  readonly paper: string;
  readonly wall: string;
  readonly guide: string;
  readonly selection: string;
  readonly strokeFine: number;
  readonly strokeMedium: number;
  readonly handleSize: number;
  readonly tickSize: number;
  readonly extensionGap: number;
  readonly extensionOvershoot: number;
  /** A canvas `font` value for dimensions and live values. */
  readonly dimensionFont: string;
  /** A canvas `font` value for labels. */
  readonly labelFont: string;
}

/** Reads the plan tokens as they are now on the document root (theme, contrast, forced colors). */
export function readPlanTokens(root: Element = document.documentElement): PlanTokens {
  const style = getComputedStyle(root);
  const text = (name: string) => style.getPropertyValue(`--${name}`).trim();
  const size = (name: string) => Number.parseFloat(text(name));
  return {
    ink: text('plan-ink'),
    paper: text('plan-paper'),
    wall: text('plan-wall'),
    guide: text('plan-guide'),
    selection: text('plan-selection'),
    strokeFine: size('plan-stroke-fine'),
    strokeMedium: size('plan-stroke-medium'),
    handleSize: size('plan-handle-size'),
    tickSize: size('plan-tick-size'),
    extensionGap: size('plan-extension-gap'),
    extensionOvershoot: size('plan-extension-overshoot'),
    dimensionFont: `${text('plan-text-dimension')} ${text('plan-font-dimension')}`,
    labelFont: `${text('plan-text-label')} ${text('plan-font-label')}`,
  };
}

/** Media queries whose change can change the tokens. */
const THEME_QUERIES = [
  '(prefers-color-scheme: dark)',
  '(prefers-contrast: more)',
  '(forced-colors: active)',
];

/**
 * Calls `onChange` when the tokens may have changed: the system theme, the contrast preference or
 * forced colors change, or the theme attribute of the document root changes. Returns the function
 * that stops watching.
 */
export function watchPlanTokens(onChange: () => void): () => void {
  const queries =
    typeof matchMedia === 'function' ? THEME_QUERIES.map((query) => matchMedia(query)) : [];
  for (const query of queries) query.addEventListener('change', onChange);
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme', 'class', 'style'],
  });
  return () => {
    for (const query of queries) query.removeEventListener('change', onChange);
    observer.disconnect();
  };
}

/**
 * Waits until the plan fonts are loaded, so the canvas never falls back to a system font
 * (docs/design/plan-drawing.md). Resolves at once where the Font Loading API is missing (tests).
 */
export async function loadPlanFonts(tokens: PlanTokens): Promise<void> {
  if (typeof document === 'undefined' || !('fonts' in document)) return;
  try {
    await Promise.all([
      document.fonts.load(tokens.dimensionFont),
      document.fonts.load(tokens.labelFont),
    ]);
  } catch {
    // A font that cannot load leaves the browser's fallback: the plan is still drawn.
  }
}
