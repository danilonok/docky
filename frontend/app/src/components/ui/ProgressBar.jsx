import { cx } from './cx';

/**
 * A 4px track with an accent fill.
 *
 * `value` is a percentage, or null for work whose progress cannot be measured.
 * Document indexing reports a state, not a fraction, so an indeterminate bar is
 * the honest rendering rather than a number invented to fill the space.
 */
export default function ProgressBar({ value = null, label, className }) {
    const indeterminate = value === null;
    const clamped = indeterminate ? 0 : Math.min(100, Math.max(0, value));

    return (
        <div
            className={cx('h-1 bg-line-soft rounded-sm overflow-hidden', className)}
            role="progressbar"
            aria-label={label}
            aria-valuenow={indeterminate ? undefined : Math.round(clamped)}
            aria-valuemin={indeterminate ? undefined : 0}
            aria-valuemax={indeterminate ? undefined : 100}
        >
            <div
                className={cx(
                    'h-full bg-accent rounded-sm',
                    indeterminate ? 'w-2/5 animate-indeterminate' : 'transition-[width] duration-500',
                )}
                style={indeterminate ? undefined : { width: `${clamped}%` }}
            />
        </div>
    );
}
