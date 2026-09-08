import { useMemo, useState } from 'react';
import { Button, Checkbox, Modal, Sheet, Tabs, TextField } from '../ui';
import UploadTab from './UploadTab';
import { useIsDesktop } from '../../hooks/useMediaQuery';
import { describeIndexing } from '../../hooks/useIndexingTasks';

function formatDate(value) {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime())
        ? null
        : date.toLocaleDateString([], { day: 'numeric', month: 'short' });
}

/**
 * Pick documents from the library and attach them to this chat.
 *
 * Search and sort are done here rather than by the API: `GET /documents` takes
 * only an offset and a limit, and a library that fits in one page is a library
 * the browser can filter itself.
 *
 * The Upload tab adds files to the library and attaches them in one motion;
 * both tabs end at the same place, with a document attached and indexing.
 */
export default function AttachDialog({
    open,
    onClose,
    chatTitle,
    documents,
    attachedIds,
    indexing,
    onAttach,
    onDetachAll,
    uploads,
    onFiles,
    onRetryUpload,
    onDismissUpload,
    initialTab = 'library',
}) {
    const desktop = useIsDesktop();
    const [tab, setTab] = useState(initialTab);
    const [query, setQuery] = useState('');
    const [selected, setSelected] = useState(() => new Set());
    const [busy, setBusy] = useState(false);

    const visible = useMemo(() => {
        const needle = query.trim().toLowerCase();
        const matched = needle
            ? documents.filter((item) => item.original_file_name?.toLowerCase().includes(needle))
            : documents;
        return [...matched].sort((a, b) => new Date(b.uploaded_at ?? 0) - new Date(a.uploaded_at ?? 0));
    }, [documents, query]);

    const toggle = (id) => {
        setSelected((current) => {
            const next = new Set(current);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const close = () => {
        setSelected(new Set());
        setQuery('');
        onClose();
    };

    const attach = async () => {
        setBusy(true);
        try {
            await onAttach([...selected]);
            close();
        } finally {
            setBusy(false);
        }
    };

    const libraryBody = (
        <>
            <div className="shrink-0 px-4 pb-3 pt-4 sm:px-6">
                <TextField
                    label="Search documents"
                    labelHidden
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder={`Search ${documents.length} document${documents.length === 1 ? '' : 's'}…`}
                />
            </div>

            <div className="min-h-0 flex-1 overflow-auto px-4 sm:px-6">
                {documents.length === 0 ? (
                    <p className="py-6 text-center text-[13px] text-ink-faint">
                        Your library is empty. Upload a document to ask about it.
                    </p>
                ) : visible.length === 0 ? (
                    <p className="py-6 text-center text-[13px] text-ink-faint">
                        Nothing matches “{query}”.
                    </p>
                ) : (
                    <ul className="overflow-hidden rounded-lg border border-line-soft bg-paper-raised">
                        {visible.map((document) => {
                            const attached = attachedIds.has(document.id);
                            const status = describeIndexing(indexing[document.id]);
                            const checked = attached || selected.has(document.id);
                            const meta = [
                                document.extension?.replace('.', '') || 'file',
                                formatDate(document.uploaded_at)
                                    ? `uploaded ${formatDate(document.uploaded_at)}`
                                    : null,
                            ].filter(Boolean);

                            return (
                                <li
                                    key={document.id}
                                    className={`border-b border-line-softer last:border-b-0 ${attached ? 'bg-paper-tint' : ''}`}
                                >
                                    <label className="flex cursor-pointer items-center gap-3 px-3.5 py-3">
                                        <Checkbox
                                            checked={checked}
                                            // An attached document cannot be
                                            // detached one at a time – the API
                                            // only clears them all – so the row
                                            // is shown as settled, not editable.
                                            disabled={attached}
                                            onChange={() => toggle(document.id)}
                                        />
                                        <span className="min-w-0 flex-1">
                                            <span
                                                className={`block truncate text-sm text-ink ${checked ? 'font-semibold' : ''}`}
                                            >
                                                {document.original_file_name}
                                            </span>
                                            <span className="block text-xs text-ink-faint">
                                                {meta.join(' · ')}
                                            </span>
                                        </span>
                                        {attached && (
                                            <span
                                                className={`shrink-0 text-xs ${status && !status.done ? 'text-accent' : 'text-success'}`}
                                            >
                                                {status && !status.done ? status.label : 'Attached'}
                                            </span>
                                        )}
                                    </label>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </>
    );

    const detachAll = async () => {
        // The API clears a chat's documents all at once or not at all, so this
        // is the whole of what detaching can offer – said plainly rather than
        // dressed up as a per-row control that would not work.
        const confirmed = window.confirm(
            'Detach every document from this chat? They stay in your library, and re-attaching re-indexes them.',
        );
        if (!confirmed) return;

        setBusy(true);
        try {
            await onDetachAll();
        } finally {
            setBusy(false);
        }
    };

    const pending = uploads.filter((upload) => !['failed'].includes(upload.stage)).length;
    const failed = uploads.filter((upload) => upload.stage === 'failed').length;

    const libraryFooter = (
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="pt-1 text-center text-[13px] text-ink-faint sm:pt-0 sm:text-left">
                {attachedIds.size > 0 ? (
                    <button
                        type="button"
                        onClick={detachAll}
                        disabled={busy}
                        className="cursor-pointer underline hover:text-ink-muted disabled:cursor-not-allowed"
                    >
                        Detach all {attachedIds.size}
                    </button>
                ) : (
                    `${selected.size} selected`
                )}
            </span>
            <div className="flex flex-col gap-2.5 sm:flex-row">
                <Button onClick={attach} disabled={selected.size === 0 || busy} className="order-first py-3.5 sm:order-last sm:py-[11px]">
                    {busy
                        ? 'Attaching…'
                        : selected.size > 0
                          ? `Attach ${selected.size} document${selected.size === 1 ? '' : 's'}`
                          : 'Attach to chat'}
                </Button>
                <Button variant="secondary" onClick={close} className="py-3.5 sm:py-[11px]">
                    Cancel
                </Button>
            </div>
        </div>
    );

    const uploadFooter = (
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-[13px] text-ink-faint">
                {uploads.length === 0
                    ? 'Nothing uploading'
                    : [
                          pending > 0 ? `${pending} in progress` : null,
                          failed > 0 ? `${failed} failed` : null,
                      ]
                          .filter(Boolean)
                          .join(' · ')}
            </span>
            {/* No "Attach when ready" button: the Upload tab attaches as part of
                uploading, so by the time a file is indexing it is already on the
                chat. There is nothing left to confirm. */}
            <Button variant="secondary" onClick={close} className="py-3.5 sm:py-[11px]">
                Close
            </Button>
        </div>
    );

    const tabbed = (
        <>
            <div className="shrink-0 px-4 pt-4 sm:px-6">
                <Tabs
                    value={tab}
                    onChange={setTab}
                    items={[
                        { value: 'library', label: 'From library' },
                        { value: 'upload', label: 'Upload new' },
                    ]}
                />
            </div>

            {tab === 'library' ? (
                libraryBody
            ) : (
                <UploadTab
                    uploads={uploads}
                    indexing={indexing}
                    onFiles={onFiles}
                    onRetry={onRetryUpload}
                    onDismiss={onDismissUpload}
                />
            )}
        </>
    );

    const props = {
        open,
        onClose: close,
        title: 'Add documents',
        subtitle:
            tab === 'upload'
                ? 'You can close this – indexing continues in the background.'
                : chatTitle
                  ? `to “${chatTitle}”`
                  : undefined,
        footer: tab === 'library' ? libraryFooter : uploadFooter,
        children: tabbed,
    };

    return desktop ? <Modal {...props} /> : <Sheet {...props} />;
}
