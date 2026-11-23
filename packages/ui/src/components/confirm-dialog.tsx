import { useRef } from 'react';
import { Button } from './button';
import { Dialog, DialogClose, DialogContent, DialogFooter } from './dialog';

export interface ConfirmDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  /**
   * The whole question, already translated, e.g. `Delete this wall?`. Never build it by
   * inserting an element name into a sentence: articles and agreements differ between
   * languages (`ce mur`, `cette terrasse`), so each element type has its own message.
   */
  readonly title: string;
  /** One sentence under the title; also the dialog's accessible description. */
  readonly description?: string;
  /** The action, e.g. `Delete`. */
  readonly confirmLabel: string;
  /** The safe choice, e.g. `Keep` or `Cancel`. */
  readonly cancelLabel: string;
  /** Accessible name of the close button, e.g. `Close`. */
  readonly closeLabel: string;
  /** Called when the user confirms; the dialog then closes. */
  readonly onConfirm: () => void;
}

/**
 * Asks the user to confirm an action, typically a deletion. It opens with the focus on the safe
 * choice, so pressing Enter by reflex never confirms. Cancelling, Escape and the close button
 * all leave everything unchanged.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel,
  closeLabel,
  onConfirm,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title={title}
        {...(description ? { description } : {})}
        closeLabel={closeLabel}
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          cancelRef.current?.focus();
        }}
      >
        <DialogFooter>
          <DialogClose asChild>
            <Button ref={cancelRef}>{cancelLabel}</Button>
          </DialogClose>
          <Button
            variant="primary"
            onClick={() => {
              onOpenChange(false);
              onConfirm();
            }}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
