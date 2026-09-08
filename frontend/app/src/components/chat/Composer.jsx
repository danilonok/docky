import { useEffect, useRef } from 'react';
import { Button } from '../ui';
import { useMediaQuery } from '../../hooks/useMediaQuery';

const MAX_ROWS = 5;

// Below this the field is too narrow for the long prompt, which then wraps to
// two lines while the box is still sized for one — the placeholder is what gets
// clipped, since auto-sizing measures the value and an empty value is one line.
const ROOMY_FIELD = '(min-width: 640px)';

/**
 * The question box.
 *
 * Enter sends and Shift+Enter breaks the line, which is the convention for a
 * chat and the one the design specifies. The field grows with the text up to
 * about five lines and then scrolls, so a long question does not push the
 * transcript off the screen.
 */
export default function Composer({
    value,
    onChange,
    onSubmit,
    onAttach,
    disabled,
    hint,
    warning,
    sending,
}) {
    const textareaRef = useRef(null);
    const roomy = useMediaQuery(ROOMY_FIELD);

    useEffect(() => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        // Reset before measuring, or the box can only ever grow.
        textarea.style.height = 'auto';
        const lineHeight = parseFloat(getComputedStyle(textarea).lineHeight) || 22;
        const max = lineHeight * MAX_ROWS;
        textarea.style.height = `${Math.min(textarea.scrollHeight, max)}px`;
        textarea.style.overflowY = textarea.scrollHeight > max ? 'auto' : 'hidden';
    }, [value, roomy]);

    const submit = () => {
        if (disabled || !value.trim()) return;
        onSubmit();
    };

    return (
        <div
            className="shrink-0 border-t border-line-soft px-4 pt-4 sm:px-10"
            // Clear of the home indicator on a phone, without adding a gap on
            // hardware that has none.
            style={{ paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))' }}
        >
            <form
                className="mx-auto flex w-full max-w-[720px] flex-col gap-2.5"
                onSubmit={(event) => {
                    event.preventDefault();
                    submit();
                }}
            >
                <div className="flex items-end gap-2 sm:gap-3">
                    {/* On a phone the header has no "+ Add" chip, so attaching
                        lives here, beside the thing it adds context to. */}
                    <button
                        type="button"
                        onClick={onAttach}
                        aria-label="Add documents"
                        className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-[10px] border border-line bg-paper-raised text-lg text-ink-faint hover:text-ink-muted desk:hidden"
                    >
                        +
                    </button>

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
                        placeholder={
                            roomy ? 'Ask a question about these documents…' : 'Ask a question…'
                        }
                        aria-label="Ask a question about these documents"
                        className="min-h-[46px] min-w-0 flex-1 resize-none rounded-[10px] border border-line bg-paper-raised px-4 py-3 text-base leading-[1.4] text-ink placeholder:text-ink-faint focus:border-accent focus:shadow-ring focus:outline-none sm:rounded-lg sm:py-3.5 sm:text-[15px]"
                    />

                    <Button
                        type="submit"
                        disabled={disabled || !value.trim()}
                        className="h-[46px] w-[46px] shrink-0 px-0 sm:h-auto sm:w-auto sm:px-5 sm:py-3.5"
                    >
                        <span className="sm:hidden" aria-hidden="true">
                            ↑
                        </span>
                        <span className="sr-only sm:not-sr-only">{sending ? 'Sending…' : 'Send'}</span>
                    </Button>
                </div>

                {/* A chat with nothing attached is worth saying out loud on any
                    screen. The routine version of the line is desktop-only: on a
                    phone it costs a row that the design spends on the transcript,
                    and the header already says how many documents there are. */}
                {warning ? (
                    <p className="text-xs text-accent">{warning}</p>
                ) : (
                    <div className="hidden justify-between gap-4 text-xs text-ink-faint sm:flex">
                        <span>{hint}</span>
                        <span className="font-mono">↵ send · ⇧↵ new line</span>
                    </div>
                )}
            </form>
        </div>
    );
}
