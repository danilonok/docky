import { useId } from 'react';
import { useDialog } from '../../hooks/useDialog';
import { cx } from './cx';

/**
 * The desktop dialog: a scrim over the page and a panel that never grows past
 * the viewport, scrolling its own body instead.
 *
 * The backdrop dims the page rather than covering it: see `.dialog-backdrop`
 * in index.css for why that departs from the design tokens.
 */
export default function Modal({ open, onClose, title, subtitle, footer, children, className }) {
    const dialogRef = useDialog(open, onClose);
    const titleId = useId();

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center dialog-backdrop p-4"
            // A click that starts and ends on the backdrop is a dismissal; one
            // that started inside and drifted out while selecting text is not.
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
                    'w-full max-w-[720px] max-h-[660px] flex flex-col overflow-hidden',
                    'bg-paper border border-line-strong rounded-xl shadow-modal',
                    className,
                )}
            >
                <div className="shrink-0 flex items-start justify-between gap-4 px-6 pt-5">
                    <div>
                        <h2 id={titleId} className="font-serif text-xl font-semibold text-ink">
                            {title}
                        </h2>
                        {subtitle && <p className="mt-[3px] text-[13px] text-ink-faint">{subtitle}</p>}
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close"
                        className="-mr-2 -mt-2 flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center text-lg leading-none text-ink-faint hover:text-ink-muted"
                    >
                        ×
                    </button>
                </div>

                {children}

                {footer && (
                    <div className="shrink-0 border-t border-line-soft bg-paper-tint px-6 py-3.5">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
}
