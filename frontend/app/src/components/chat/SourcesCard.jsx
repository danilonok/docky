import { useState } from 'react';
import { Eyebrow } from '../ui';

const INITIAL_VISIBLE = 2;

/**
 * The passages an answer was built from.
 *
 * Each node carries its text and a relevance score, and — since documents are
 * indexed with their provenance — the document it came from and the page it was
 * on. Anything the retriever could not attribute is simply left out of the meta
 * line rather than filled with a placeholder.
 *
 * The mocks also show "Open in document" beside each passage. There is no
 * endpoint that serves a stored file, so nothing here could open one; the link
 * is left out rather than rendered dead.
 */
export default function SourcesCard({ sources }) {
    const [expanded, setExpanded] = useState(false);

    if (!sources || sources.length === 0) return null;

    const visible = expanded ? sources : sources.slice(0, INITIAL_VISIBLE);
    const hidden = sources.length - visible.length;

    // One document is the common case and worth naming in the header; several
    // makes the header a count, and each row says where it came from.
    const names = [...new Set(sources.map((source) => source.document_name).filter(Boolean))];
    const passages = `${sources.length} passage${sources.length === 1 ? '' : 's'}`;

    return (
        <div className="shrink-0 overflow-hidden rounded-lg border border-line-soft bg-paper-raised">
            <div className="flex items-center justify-between gap-3 border-b border-line-soft px-3.5 py-2.5">
                <Eyebrow>Sources</Eyebrow>
                <span className="truncate text-xs text-success">
                    {names.length === 1 ? `${passages} · ${names[0]}` : passages}
                </span>
            </div>

            {visible.map((source, index) => {
                const relevance =
                    typeof source.score === 'number' ? `relevance ${Math.round(source.score * 100)}%` : null;
                const meta = [
                    names.length > 1 ? source.document_name : null,
                    source.page ? `page ${source.page}` : null,
                    relevance,
                ].filter(Boolean);

                return (
                    <div
                        key={index}
                        className="flex gap-3 border-b border-line-softer px-3.5 py-3 last:border-b-0"
                    >
                        <span className="pt-0.5 text-xs text-accent">{index + 1}</span>
                        <div className="min-w-0 flex-1">
                            <p className="text-[13px] leading-[1.55] text-ink-muted">{source.node}</p>
                            {meta.length > 0 && (
                                <div className="mt-1.5 flex flex-wrap gap-2.5 text-[11px] text-ink-faint">
                                    {meta.map((item) => (
                                        <span key={item}>{item}</span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}

            {hidden > 0 && (
                <button
                    type="button"
                    onClick={() => setExpanded(true)}
                    className="w-full cursor-pointer px-3.5 py-2.5 text-left text-xs text-accent hover:underline"
                >
                    Show {hidden} more passage{hidden === 1 ? '' : 's'}
                </button>
            )}
        </div>
    );
}
