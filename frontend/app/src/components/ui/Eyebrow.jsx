import { cx } from './cx';

/** The small uppercase label above a section – SOURCES, or "You asked · 14:02". */
export default function Eyebrow({ tone = 'faint', className, children, ...props }) {
    return (
        <span
            className={cx(
                'text-[11px] uppercase tracking-[0.12em]',
                tone === 'accent' ? 'text-accent' : 'text-ink-faint',
                className,
            )}
            {...props}
        >
            {children}
        </span>
    );
}
