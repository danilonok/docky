import { useCallback, useId, useRef } from 'react';
import { useDialog } from '../../hooks/useDialog';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { cx } from './cx';

// Far enough that a stray downward flick while reading does not dismiss, close
// enough that a deliberate pull does.
const DISMISS_DISTANCE = 110;

// A fast flick counts even if it is short – px per millisecond.
const FLICK_VELOCITY = 0.5;
const FLICK_MIN_DISTANCE = 24;

// Below this a press is a tap, not a drag.
const TAP_SLOP = 4;

const SNAP = 'transform 200ms ease-out';

/**
 * The mobile counterpart to Modal: pinned to the bottom, rounded at the top,
 * and pulled down to dismiss.
 *
 * The grabber is a real control, not decoration. Dragging starts from the
 * header – the grabber, the title, the subtitle – and never from the body,
 * because the body scrolls and a gesture cannot mean both things at once.
 *
 * It is also a button, so the sheet can be closed by keyboard and announced to
 * a screen reader: a gesture is not an affordance everyone has.
 *
 * The drag writes its transform straight to the element. Holding the offset in
 * state would re-render the sheet – and the list inside it – on every pointer
 * move, which is the one thing a gesture cannot afford.
 */
export default function Sheet({ open, onClose, title, subtitle, footer, children, className }) {
    const dialogRef = useDialog(open, onClose);
    const titleId = useId();
    const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)');

    const gesture = useRef({ active: false, startY: 0, startedAt: 0, distance: 0 });

    const onPointerDown = useCallback((event) => {
        // Primary button or touch only; a right-click is not a drag.
        if (event.button !== 0) return;

        gesture.current = {
            active: true,
            startY: event.clientY,
            startedAt: performance.now(),
            distance: 0,
        };
        event.currentTarget.setPointerCapture(event.pointerId);

        const sheet = dialogRef.current;
        if (sheet) sheet.style.transition = 'none';
    }, [dialogRef]);

    const onPointerMove = useCallback(
        (event) => {
            if (!gesture.current.active) return;

            // Downward only: dragging up would lift the sheet off the bottom of
            // the screen and expose the scrim beneath it.
            const distance = Math.max(0, event.clientY - gesture.current.startY);
            gesture.current.distance = distance;

            const sheet = dialogRef.current;
            if (sheet) sheet.style.transform = `translateY(${distance}px)`;
        },
        [dialogRef],
    );

    const endDrag = useCallback(() => {
        if (!gesture.current.active) return;
        gesture.current.active = false;

        const { distance, startedAt } = gesture.current;
        const velocity = distance / Math.max(performance.now() - startedAt, 1);
        const dismissed =
            distance > DISMISS_DISTANCE ||
            (velocity > FLICK_VELOCITY && distance > FLICK_MIN_DISTANCE);

        const sheet = dialogRef.current;
        if (sheet) {
            // Put it back either way: the component stays mounted while closed,
            // so a sheet dismissed by dragging would otherwise reopen still
            // pushed down by however far it was pulled.
            sheet.style.transition = reduceMotion ? 'none' : SNAP;
            sheet.style.transform = '';
        }

        if (dismissed) onClose();
    }, [dialogRef, onClose, reduceMotion]);

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex flex-col justify-end dialog-backdrop"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) onClose();
            }}
        >
            <div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                tabIndex={-1}
                className={cx(
                    'flex h-[660px] max-h-[85vh] flex-col overflow-hidden',
                    'rounded-t-[18px] border-t border-line-strong bg-paper shadow-modal',
                    className,
                )}
            >
                <div
                    onPointerDown={onPointerDown}
                    onPointerMove={onPointerMove}
                    onPointerUp={endDrag}
                    onPointerCancel={endDrag}
                    // Without this the browser scrolls the page instead of
                    // letting the sheet follow the finger.
                    style={{ touchAction: 'none' }}
                    className="shrink-0 cursor-grab select-none active:cursor-grabbing"
                >
                    <div className="flex justify-center pb-1 pt-2.5">
                        <button
                            type="button"
                            aria-label="Close"
                            onClick={() => {
                                // A press that never moved is a tap; anything
                                // further was already decided on release.
                                if (gesture.current.distance < TAP_SLOP) onClose();
                            }}
                            className="flex h-6 w-16 cursor-pointer items-center justify-center focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-accent/25"
                        >
                            <span aria-hidden="true" className="h-1 w-10 rounded-sm bg-line-dark" />
                        </button>
                    </div>

                    <div className="px-5 pb-1 pt-1">
                        <h2 id={titleId} className="font-serif text-xl font-semibold text-ink">
                            {title}
                        </h2>
                        {subtitle && <p className="mt-0.5 text-[13px] text-ink-faint">{subtitle}</p>}
                    </div>
                </div>

                {children}

                {footer && (
                    <div className="shrink-0 border-t border-line-soft bg-paper-tint px-4 pb-5 pt-3">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
}
