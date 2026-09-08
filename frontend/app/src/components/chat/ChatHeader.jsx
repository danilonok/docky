import { Chip } from '../ui';
import { describeIndexing } from '../../hooks/useIndexingTasks';

/**
 * Chat title, what the answers are drawn from, and the way to attach more.
 *
 * The mocks also put member avatars here. A chat does have members — the API
 * takes user ids when one is created — but nothing reads them back and there is
 * no endpoint to look a user up, so there is no one to draw.
 */
export default function ChatHeader({
    chat,
    documents,
    indexing,
    model,
    messageCount,
    onAddDocuments,
    onMenu,
}) {
    const working = documents
        .map((document) => ({ name: document.original_file_name, ...describeIndexing(indexing[document.id]) }))
        .filter((entry) => entry.label && !entry.done);

    const meta = [
        model,
        `${documents.length} document${documents.length === 1 ? '' : 's'}`,
        `${messageCount} message${messageCount === 1 ? '' : 's'}`,
    ].filter(Boolean);

    return (
        <div className="shrink-0 border-b border-line-soft px-4 pb-3.5 pt-4 sm:px-10 sm:pt-[18px]">
            <div className="flex items-end justify-between gap-5">
                <div className="flex min-w-0 items-center gap-3">
                    {onMenu && (
                        <button
                            type="button"
                            onClick={onMenu}
                            aria-label="Open chat list"
                            className="-ml-2 flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center text-xl leading-none text-ink-faint desk:hidden"
                        >
                            ☰
                        </button>
                    )}
                    <div className="min-w-0">
                        <h1 className="truncate font-serif text-lg font-semibold tracking-[-0.01em] text-ink sm:text-[23px]">
                            {chat.title}
                        </h1>
                        <p className="mt-0.5 truncate text-xs text-ink-faint sm:text-[13px]">
                            {meta.join(' · ')}
                        </p>
                    </div>
                </div>

                {/* The row gives way before the title does: it scrolls once the
                    chips stop fitting, rather than pushing the chat name out. */}
                <div className="hidden min-w-0 items-center gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden desk:flex">
                    {documents.map((document) => {
                        const status = describeIndexing(indexing[document.id]);
                        const pending = status && !status.done;

                        return (
                            <Chip
                                key={document.id}
                                className="shrink-0"
                                tone={pending || status?.tone === 'danger' ? 'accent' : 'default'}
                                title={
                                    status
                                        ? `${document.original_file_name} — ${status.label}`
                                        : document.original_file_name
                                }
                            >
                                {/* Only the name is capped. The status is short,
                                    it is the half that changes, and it is the
                                    half worth reading — so it never gets cut. */}
                                <span className="max-w-[190px] truncate">
                                    {document.original_file_name}
                                </span>
                                {pending && <span className="shrink-0"> · {status.label}</span>}
                            </Chip>
                        );
                    })}

                    <Chip
                        tone="action"
                        as="button"
                        type="button"
                        onClick={onAddDocuments}
                        className="shrink-0"
                    >
                        + Add
                    </Chip>
                </div>

                <Chip tone="action" as="button" type="button" onClick={onAddDocuments} className="desk:hidden">
                    Files
                </Chip>
            </div>

            {/* On a narrow screen the chips are gone, so work in progress has
                nowhere to show. This strip is where it goes instead. */}
            {working.length > 0 && (
                <button
                    type="button"
                    onClick={onAddDocuments}
                    className="-mx-4 mt-3 flex w-[calc(100%+2rem)] items-center justify-between gap-3 border-y border-line-soft bg-paper-tint px-4 py-2.5 text-left text-xs text-accent desk:hidden"
                >
                    <span className="truncate">
                        {working.length === 1
                            ? `${working[0].name} — ${working[0].label}`
                            : `${working.length} documents indexing`}
                    </span>
                    <span className="shrink-0 underline">Details</span>
                </button>
            )}
        </div>
    );
}
