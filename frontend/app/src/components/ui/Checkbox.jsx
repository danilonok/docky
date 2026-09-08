import { cx } from './cx';

/**
 * A checkbox drawn to the design rather than by the platform.
 *
 * The real input stays in the tree, only visually hidden — it keeps keyboard
 * behaviour, the label association and the announced state, none of which a
 * styled span would have.
 */
export default function Checkbox({ checked, disabled, className, ...props }) {
    return (
        <span className={cx('relative inline-flex shrink-0', className)}>
            <input
                type="checkbox"
                checked={checked}
                disabled={disabled}
                className="peer absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
                {...props}
            />
            <span
                aria-hidden="true"
                className={cx(
                    'w-5 h-5 sm:w-[18px] sm:h-[18px] rounded flex items-center justify-center text-xs',
                    'peer-focus-visible:ring-3 peer-focus-visible:ring-accent/25',
                    checked ? 'bg-ink text-on-ink' : 'border border-line-strong bg-paper',
                )}
            >
                {checked ? '✓' : null}
            </span>
        </span>
    );
}
