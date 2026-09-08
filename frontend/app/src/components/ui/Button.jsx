import { cx } from './cx';

/**
 * The design uses three button weights and three sizes, and nothing else.
 *
 * Sizes are mobile-first: the base values come from the 390px artboards and the
 * `sm:` values from the 1280px ones, so one button matches both mocks without a
 * caller choosing. Touch targets stay at or above 46px on small screens.
 */

const VARIANTS = {
    primary: 'bg-ink text-on-ink font-semibold',
    secondary: 'bg-paper-raised text-ink-muted border border-line',
    quiet: 'text-ink-faint hover:text-ink-muted',
};

const SIZES = {
    // Full-width form submit: 52px on mobile, 48px on desktop.
    lg: 'w-full h-13 sm:h-12 rounded-[10px] sm:rounded-lg text-base sm:text-[15px]',
    md: 'px-5 py-[11px] rounded-lg text-sm',
    sm: 'px-3 py-2 rounded-md text-[13px]',
};

export default function Button({
    variant = 'primary',
    size = 'md',
    type = 'button',
    className,
    children,
    ...props
}) {
    return (
        <button
            type={type}
            className={cx(
                'inline-flex items-center justify-center gap-2 transition-colors cursor-pointer',
                'focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-accent/25',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                VARIANTS[variant],
                SIZES[size],
                className,
            )}
            {...props}
        >
            {children}
        </button>
    );
}
