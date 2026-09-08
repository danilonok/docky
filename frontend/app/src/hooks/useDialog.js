import { useEffect, useRef } from 'react';

const FOCUSABLE = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
].join(',');

/**
 * The behaviour every overlay owes the user, in one place.
 *
 * Escape closes it, the page behind it stops scrolling, focus moves in on open
 * and back to whatever opened it on close, and Tab cycles inside rather than
 * wandering into the inert page behind. The modal and the bottom sheet differ
 * only in how they look, so none of this is written twice.
 *
 * Returns the ref to put on the dialog element.
 */
export function useDialog(open, onClose) {
    const dialogRef = useRef(null);
    const openerRef = useRef(null);

    useEffect(() => {
        if (!open) return undefined;

        const dialog = dialogRef.current;
        // Remembered before focus moves, so it can be handed back on close even
        // if the element that opened the dialog is no longer the active one.
        openerRef.current = document.activeElement;

        const focusables = () => Array.from(dialog?.querySelectorAll(FOCUSABLE) ?? []);
        (focusables()[0] ?? dialog)?.focus();

        const onKeyDown = (event) => {
            if (event.key === 'Escape') {
                event.stopPropagation();
                onClose();
                return;
            }

            if (event.key !== 'Tab') return;

            const items = focusables();
            if (items.length === 0) {
                event.preventDefault();
                return;
            }

            const first = items[0];
            const last = items[items.length - 1];

            // Only intervene at the ends; in between, the browser does it better.
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        };

        document.addEventListener('keydown', onKeyDown, true);

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        return () => {
            document.removeEventListener('keydown', onKeyDown, true);
            document.body.style.overflow = previousOverflow;
            openerRef.current?.focus?.();
        };
    }, [open, onClose]);

    return dialogRef;
}
