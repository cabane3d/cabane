/**
 * Helpers that let one step definition serve several scenarios (ADR-0011, ADR-0018).
 *
 * Some spec wordings are shared by several scenarios: a reference screenshot is named after the
 * scenario identifier, and a few wordings are a Given in one scenario and a Then in another. These
 * helpers read what the step needs from the scenario it runs in.
 */

/** The scenario identifier among the tags of the scenario, e.g. `WALL-021` for `@WALL-021`. */
export function scenarioIdOf(tags: readonly string[]): string {
  const identifier = tags.find((tag) => /^@[A-Z][A-Z0-9]*-\d{3}$/.test(tag));
  if (!identifier)
    throw new Error(`The scenario has no identifier among its tags: ${tags.join(' ')}`);
  return identifier.slice(1);
}

/**
 * The part of playwright-bdd's context that tells the keyword of the running step: a Given has the
 * keyword type `Context`, a When `Action`, a Then `Outcome` (And and But take the type of the step
 * before them).
 */
export interface StepKeywordContext {
  readonly stepIndex: number;
  readonly bddTestData: {
    readonly steps: readonly { readonly keywordType?: string }[];
  };
}

/** True when the running step is written with Given, i.e. it sets up the scenario. */
export function isGivenStep(context: StepKeywordContext): boolean {
  return context.bddTestData.steps[context.stepIndex]?.keywordType === 'Context';
}
