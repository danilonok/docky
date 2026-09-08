import { useId } from 'react';
import { useDialog } from '../../hooks/useDialog';
import { cx } from './cx';

/**
 * The mobile counterpart to Modal: pinned to the bottom, rounded at the top.
 *
 * Same contract and the same dialog behaviour, a different shape — which is why
 * a caller can pick between the two on viewport width alone.
 */
export default function Sheet({ open, onClose, title, subtitle, footer, children, className }) {
    const dialogRef = useDialog(open, onClose);
    const titleId = useId();

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex flex-col justify-end bg-scrim"
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
                    'flex flex-col overflow-hidden max-h-[85vh] h-[660px]',
                    'bg-paper border-t border-line-strong rounded-t-[18px]',
                    className,
                )}
            >
                {/* Grabber. The sheet is dismissed by the scrim or Escape rather
                    than by dragging, so this reads as an affordance, not a control. */}
                <div className="shrink-0 flex justify-center pt-2.5 pb-1" aria-hidden="true">
                    <span className="w-10 h-1 rounded-sm bg-line-dark" />
                </div>

                <div className="shrink-0 px-5 pt-2">
                    <h2 id={titleId} className="font-serif text-xl font-semibold text-ink">
                        {title}
                    </h2>
                    {subtitle && <p className="mt-0.5 text-[13px] text-ink-faint">{subtitle}</p>}
                </div>

                {children}

                {footer && (
                    <div className="shrink-0 border-t border-line-soft bg-paper-tint px-4 pt-3 pb-5">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
}
