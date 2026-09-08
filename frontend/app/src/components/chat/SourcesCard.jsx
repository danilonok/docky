import { useState } from 'react';
import { Eyebrow, cx } from '../ui';

const INITIAL_VISIBLE = 2;

/**
 * The passages an answer was built from.
 *
 * Each node carries its text and a relevance score, and — since documents are
 * indexed with their provenance — the document it came from and the page it was
 * on. Anything the retriever could not attribute is simply left out of the meta
 * line rather than filled with a placeholder. Passages indexed before that
 * provenance existed therefore show a score and nothing else.
 *
 * A passage is a whole chunk and can run to a paragraph, so rows are clamped to
 * a few lines and open on click. Left unclamped, five of them push the answer
 * they belong to off the screen.
 *
 * The mocks also show "Open in document" beside each passage. There is no
 * endpoint that serves a stored file, so nothing here could open one; the link
 * is left out rather than rendered dead.
 */
export default function SourcesCard({ sources }) {
    const [expanded, setExpanded] = useState(false);
    const [opened, setOpened] = useState(() => new Set());

    if (!sources || sources.length === 0) return null;

    const visible = expanded ? sources : sources.slice(0, INITIAL_VISIBLE);
    const hidden = sources.length - visible.length;

    // One document is the common case and worth naming in the header; several
    // makes the header a count, and each row says where it came from.
    const names = [...new Set(sources.map((source) => source.document_name).filter(Boolean))];
    const passages = `${sources.length} passage${sources.length === 1 ? '' : 's'}`;

    const toggle = (index) =>
        setOpened((current) => {
            const next = new Set(current);
            if (next.has(index)) next.delete(index);
            else next.add(index);
            return next;
        });

    return (
        <div className="shrink-0 overflow-hidden rounded-lg border border-line-soft bg-paper-raised">
            <div className="flex items-center justify-between gap-3 border-b border-line-soft px-3 py-2.5 sm:px-3.5">
                <Eyebrow>Sources</Eyebrow>
                <span className="truncate text-[11px] text-success sm:text-xs">
                    {names.length === 1 ? `${passages} · ${names[0]}` : passages}
                </span>
            </div>

            {visible.map((source, index) => {
                const isOpen = opened.has(index);
                const relevance =
                    typeof source.score === 'number' ? `${Math.round(source.score * 100)}%` : null;
                const meta = [
                    names.length > 1 ? source.document_name : null,
                    source.page ? `page ${source.page}` : null,
                    relevance ? `relevance ${relevance}` : null,
                ].filter(Boolean);

                return (
                    <button
                        key={index}
                        type="button"
                        onClick={() => toggle(index)}
                        aria-expanded={isOpen}
                        className="flex w-full cursor-pointer gap-2.5 border-b border-line-softer px-3 py-3 text-left last:border-b-0 hover:bg-paper-tint/50 sm:gap-3 sm:px-3.5"
                    >
                        <span className="pt-px text-[11px] text-accent sm:text-xs">{index + 1}</span>
                        <span className="min-w-0 flex-1">
                            <span
                                className={cx(
                                    'block text-xs leading-[1.55] text-ink-muted sm:text-[13px]',
                                    !isOpen && 'line-clamp-2 sm:line-clamp-3',
                                )}
                            >
                                {source.node}
                            </span>
                            {meta.length > 0 && (
                                <span className="mt-1.5 flex flex-wrap gap-x-2.5 gap-y-1 text-[10px] text-ink-faint sm:text-[11px]">
                                    {meta.map((item) => (
                                        <span key={item}>{item}</span>
                                    ))}
                                </span>
                            )}
                        </span>
                    </button>
                );
            })}

            {hidden > 0 && (
                <button
                    type="button"
                    onClick={() => setExpanded(true)}
                    className="flex min-h-11 w-full cursor-pointer items-center border-t border-line-softer px-3 text-left text-xs text-accent hover:underline sm:min-h-0 sm:px-3.5 sm:py-2.5"
                >
                    Show {hidden} more passage{hidden === 1 ? '' : 's'}
                </button>
            )}
        </div>
    );
}
