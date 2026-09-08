import { useId } from 'react';
import { cx } from './cx';

/**
 * A labelled input with room for a helper line underneath.
 *
 * The helper slot is one element that changes tone rather than two that appear
 * and disappear: the register form shows "Available" and a validation error in
 * the same place, and reusing the slot stops the form reflowing between them.
 */
export default function TextField({
    label,
    helper,
    tone = 'muted',
    trailing,
    // Sits between the input and the helper line — the strength meter on the
    // register form is the reason this slot exists.
    below,
    id,
    className,
    ...props
}) {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const helperId = `${inputId}-helper`;

    return (
        <div className="flex flex-col gap-[7px]">
            <label htmlFor={inputId} className="text-[13px] font-semibold text-ink-muted">
                {label}
            </label>

            <div className="relative">
                <input
                    id={inputId}
                    aria-describedby={helper ? helperId : undefined}
                    className={cx(
                        'w-full bg-paper-raised border border-line text-ink',
                        'rounded-[10px] sm:rounded-lg px-[14px] py-[15px] sm:py-[13px]',
                        // 16px on mobile: anything smaller makes iOS zoom on focus.
                        'text-base sm:text-[15px] placeholder:text-ink-faint',
                        'focus:outline-none focus:border-accent focus:shadow-ring',
                        trailing && 'pr-16',
                        className,
                    )}
                    {...props}
                />
                {trailing && (
                    <div className="absolute inset-y-0 right-[14px] flex items-center">
                        {trailing}
                    </div>
                )}
            </div>

            {below}

            {helper && (
                <span
                    id={helperId}
                    className={cx(
                        'text-xs',
                        tone === 'success' && 'text-success',
                        tone === 'danger' && 'text-danger',
                        tone === 'muted' && 'text-ink-faint',
                    )}
                >
                    {helper}
                </span>
            )}
        </div>
    );
}
