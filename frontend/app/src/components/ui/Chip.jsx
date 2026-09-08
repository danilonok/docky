import { cx } from './cx';

/**
 * The pill used for document attachments in the chat header.
 *
 * `truncate` is opt-in because a document name can be arbitrarily long while a
 * status chip never is, and capping the latter would only add an ellipsis where
 * there is nothing to cut.
 */
export default function Chip({
    tone = 'default',
    truncate,
    as = 'span',
    className,
    children,
    ...props
}) {
    const Element = as;

    return (
        <Element
            className={cx(
                'inline-flex items-center rounded-full border px-[11px] py-1.5 text-xs whitespace-nowrap',
                tone === 'default' && 'border-line bg-paper-raised text-ink-muted',
                tone === 'accent' && 'border-line bg-paper-raised text-accent',
                tone === 'action' && 'border-accent text-accent font-semibold cursor-pointer',
                truncate && 'max-w-[190px] overflow-hidden text-ellipsis',
                className,
            )}
            {...props}
        >
            {children}
        </Element>
    );
}
