import { cx } from './cx';

/** Four segments, one per server-side password rule. */
export default function StrengthMeter({ score, total = 4 }) {
    return (
        <span className="flex gap-1 mt-px" aria-hidden="true">
            {Array.from({ length: total }, (_, index) => (
                <span
                    key={index}
                    className={cx(
                        'flex-1 h-[3px] rounded-sm',
                        index < score ? 'bg-success' : 'bg-line-soft',
                    )}
                />
            ))}
        </span>
    );
}
