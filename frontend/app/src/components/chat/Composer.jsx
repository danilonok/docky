import { useEffect, useRef } from 'react';
import { Button } from '../ui';

const MAX_ROWS = 5;

/**
 * The question box.
 *
 * Enter sends and Shift+Enter breaks the line, which is the convention for a
 * chat and the one the design specifies. The field grows with the text up to
 * about five lines and then scrolls, so a long question does not push the
 * transcript off the screen.
 */
export default function Composer({ value, onChange, onSubmit, disabled, hint, sending }) {
    const textareaRef = useRef(null);

    useEffect(() => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        // Reset before measuring, or the box can only ever grow.
        textarea.style.height = 'auto';
        const lineHeight = parseFloat(getComputedStyle(textarea).lineHeight) || 22;
        const max = lineHeight * MAX_ROWS;
        textarea.style.height = `${Math.min(textarea.scrollHeight, max)}px`;
        textarea.style.overflowY = textarea.scrollHeight > max ? 'auto' : 'hidden';
    }, [value]);

    const submit = () => {
        if (disabled || !value.trim()) return;
        onSubmit();
    };

    return (
        <div className="shrink-0 border-t border-line-soft px-4 pb-5 pt-4 sm:px-10 sm:pb-[22px]">
            <form
                className="mx-auto flex w-full max-w-[720px] flex-col gap-2.5"
                onSubmit={(event) => {
                    event.preventDefault();
                    submit();
                }}
            >
                <div className="flex items-end gap-3">
                    <textarea
                        ref={textareaRef}
                        rows={1}
                        value={value}
                        onChange={(event) => onChange(event.target.value)}
                        onKeyDown={(event) => {
                            if (event.key === 'Enter' && !event.shiftKey) {
                                event.preventDefault();
                                submit();
                            }
                        }}
                        placeholder="Ask a question about these documents…"
                        aria-label="Ask a question"
                        className="min-w-0 flex-1 resize-none rounded-[10px] border border-line bg-paper-raised px-4 py-3.5 text-base leading-[1.4] text-ink placeholder:text-ink-faint focus:border-accent focus:shadow-ring focus:outline-none sm:rounded-lg sm:text-[15px]"
                    />
                    <Button type="submit" disabled={disabled || !value.trim()} className="px-5 py-3.5">
                        {sending ? 'Sending…' : 'Send'}
                    </Button>
                </div>

                <div className="flex justify-between gap-4 text-xs text-ink-faint">
                    <span>{hint}</span>
                    <span className="hidden font-mono sm:inline">↵ send · ⇧↵ new line</span>
                </div>
            </form>
        </div>
    );
}
