import type { KeyPress } from '../tool-state';

/** Whether typing in `target` enters text: an input, a textarea or an editable element. */
function isTextField(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    // `=== true`: some DOM implementations (jsdom) leave `isContentEditable` undefined.
    (target instanceof HTMLElement && target.isContentEditable === true)
  );
}

/** The key press of a keyboard event, as the tool shortcuts see it. */
export function keyPressOf(event: KeyboardEvent): KeyPress {
  return {
    key: event.key,
    ctrl: event.ctrlKey,
    alt: event.altKey,
    meta: event.metaKey,
    shift: event.shiftKey,
    inTextField: isTextField(event.target),
  };
}
