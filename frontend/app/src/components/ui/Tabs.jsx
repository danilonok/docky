import { cx } from './cx';

/** The two-tab header used by the attach dialog. */
export default function Tabs({ items, value, onChange, className }) {
    return (
        <div
            role="tablist"
            className={cx('flex gap-5 sm:gap-[22px] border-b border-line-soft', className)}
        >
            {items.map((item) => {
                const selected = item.value === value;
                return (
                    <button
                        key={item.value}
                        role="tab"
                        type="button"
                        aria-selected={selected}
                        onClick={() => onChange(item.value)}
                        className={cx(
                            '-mb-px flex min-h-11 cursor-pointer items-center border-b-2 pb-[10px] text-sm transition-colors sm:min-h-0 sm:pt-0',
                            'focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-accent/25',
                            selected
                                ? 'font-semibold text-ink border-accent'
                                : 'text-ink-faint border-transparent hover:text-ink-muted',
                        )}
                    >
                        {item.label}
                    </button>
                );
            })}
        </div>
    );
}
