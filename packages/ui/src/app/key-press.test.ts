// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { keyPressOf } from './key-press';

afterEach(() => {
  document.body.replaceChildren();
});

/** Dispatches a key down on `target` and returns the key press seen by a window listener. */
function pressOn(target: EventTarget, init: KeyboardEventInit) {
  let seen: ReturnType<typeof keyPressOf> | undefined;
  const listener = (event: KeyboardEvent) => {
    seen = keyPressOf(event);
  };
  window.addEventListener('keydown', listener);
  target.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, ...init }));
  window.removeEventListener('keydown', listener);
  return seen;
}

describe('keyPressOf', () => {
  it('reads the key and the modifiers', () => {
    expect(pressOn(document.body, { key: 'v', ctrlKey: true, shiftKey: true })).toEqual({
      key: 'v',
      ctrl: true,
      alt: false,
      meta: false,
      shift: true,
      inTextField: false,
    });
  });

  it.each(['input', 'textarea'] as const)('sees a key typed in a %s as in a text field', (tag) => {
    const field = document.body.appendChild(document.createElement(tag));

    expect(pressOn(field, { key: 'v' })?.inTextField).toBe(true);
  });

  it('does not see a key pressed on a button as in a text field', () => {
    const button = document.body.appendChild(document.createElement('button'));

    expect(pressOn(button, { key: 'v' })?.inTextField).toBe(false);
  });
});
