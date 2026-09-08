import { cx } from './cx';

/**
 * The pill used for document attachments in the chat header.
 *
 * Deliberately does not truncate its own contents. `text-overflow` has no effect
 * on a flex container, so truncating here clipped mid-word with no ellipsis –
 * and clipped the wrong half, cutting the status the user is watching rather
 * than the filename they already know. Callers that need it wrap the part which
 * may run long in a truncating span, and let the rest size itself.
 */
export default function Chip({ tone = 'default', as = 'span', className, children, ...props }) {
    const Element = as;

    return (
        <Element
            className={cx(
                'inline-flex min-w-0 items-center rounded-full border px-[11px] py-1.5 text-xs whitespace-nowrap',
                tone === 'default' && 'border-line bg-paper-raised text-ink-muted',
                tone === 'accent' && 'border-line bg-paper-raised text-accent',
                tone === 'action' && 'border-accent text-accent font-semibold cursor-pointer min-h-11 sm:min-h-0',
                className,
            )}
            {...props}
        >
            {children}
        </Element>
    );
}
