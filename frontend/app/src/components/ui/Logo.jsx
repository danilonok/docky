import { cx } from './cx';

const SIZES = {
    sm: { tile: 'w-6 h-6 rounded-[5px] text-sm', word: 'text-[17px]' },
    md: { tile: 'w-[26px] h-[26px] rounded-md text-[15px]', word: 'text-lg' },
    lg: { tile: 'w-11 h-11 rounded-[11px] text-[22px]', word: 'text-xl' },
};

/** The D tile, with the wordmark beside it unless the caller drops it. */
export default function Logo({ size = 'md', wordmark = true, className }) {
    const scale = SIZES[size];

    return (
        <span className={cx('inline-flex items-center gap-2.5', className)}>
            <span
                aria-hidden="true"
                className={cx(
                    'bg-ink text-on-ink font-serif font-bold flex items-center justify-center',
                    scale.tile,
                )}
            >
                D
            </span>
            {wordmark ? (
                <span className={cx('font-serif font-semibold text-ink', scale.word)}>Docky</span>
            ) : (
                <span className="sr-only">Docky</span>
            )}
        </span>
    );
}
