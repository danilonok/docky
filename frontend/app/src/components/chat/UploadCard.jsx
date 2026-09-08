import { Button, ProgressBar, Stepper, cx } from '../ui';
import { formatBytes } from '../../lib/uploads';

// Three stages, not the five in the mocks. Uploading is a real percentage;
// everything after it is one opaque Celery task that reports a state, so
// "Parsed", "Chunking" and "Embedding" would be three labels for one unknown.
const STEPS = ['Uploaded', 'Indexing', 'Ready'];

/**
 * Work out what to show from the upload's own stage and, once indexing has
 * started, the task status polled alongside it.
 */
function describe(upload, status) {
    if (upload.stage === 'failed') {
        return { step: 0, tone: 'failed', detail: upload.error };
    }

    if (upload.stage === 'uploading') {
        return {
            step: 0,
            tone: 'busy',
            progress: upload.progress,
            detail: `Uploading · ${Math.round(upload.progress)}%`,
        };
    }

    if (upload.stage === 'attaching') {
        return { step: 1, tone: 'busy', detail: 'Queueing for indexing…' };
    }

    // The document was already attached, so no job ran and nothing is pending.
    if (upload.stage === 'indexing' && !upload.taskId) {
        return { step: 2, tone: 'done', detail: 'Already attached to this chat.' };
    }

    switch (status?.state) {
        case 'SUCCESS': {
            const { chunks, pages } = status.result ?? {};
            const parts = [
                typeof pages === 'number' ? `${pages} page${pages === 1 ? '' : 's'}` : null,
                typeof chunks === 'number' ? `${chunks} passage${chunks === 1 ? '' : 's'}` : null,
            ].filter(Boolean);
            return {
                step: 2,
                tone: 'done',
                detail: parts.length > 0 ? `Ready · ${parts.join(' · ')}` : 'Ready',
            };
        }
        case 'FAILURE':
            return {
                step: 1,
                tone: 'failed',
                // The server writes this one for the user — a scanned PDF gets
                // told it needs OCR, in those words.
                detail: status.error ?? 'Indexing failed.',
            };
        case 'TIMEOUT':
            return {
                step: 1,
                tone: 'busy',
                detail: 'Still indexing. It continues in the background — reopen the chat to check.',
            };
        case 'STARTED':
            return { step: 1, tone: 'busy', detail: 'Indexing…' };
        default:
            return { step: 1, tone: 'busy', detail: 'Queued…' };
    }
}

export default function UploadCard({ upload, status, onRetry, onDismiss }) {
    const state = describe(upload, status);
    const failed = state.tone === 'failed';

    return (
        <div
            className={cx(
                'rounded-[10px] border bg-paper-raised p-3.5 sm:rounded-lg sm:p-4',
                failed ? 'border-danger-line' : 'border-line-soft',
            )}
        >
            <div className="flex items-start gap-3.5">
                <div
                    aria-hidden="true"
                    className={cx(
                        'hidden h-12 w-[38px] shrink-0 rounded-[3px] rounded-tr-[10px] border bg-paper sm:block',
                        failed ? 'border-danger-line' : 'border-line-dark',
                    )}
                />

                <div className="flex min-w-0 flex-1 flex-col gap-2.5">
                    <div className="flex items-baseline justify-between gap-3">
                        <span className="truncate text-[15px] font-semibold text-ink" title={upload.name}>
                            {upload.name}
                        </span>
                        <span className="shrink-0 text-xs text-ink-faint">{formatBytes(upload.size)}</span>
                    </div>

                    {!failed && <Stepper steps={STEPS} current={state.step} />}

                    {state.tone === 'busy' && (
                        <ProgressBar
                            // A real fraction while the bytes are moving; after
                            // that there is no fraction to be had.
                            value={upload.stage === 'uploading' ? state.progress : null}
                            label={`${upload.name} progress`}
                        />
                    )}

                    <p
                        className={cx(
                            'text-xs leading-[1.5]',
                            failed ? 'text-danger' : state.tone === 'done' ? 'text-success' : 'text-ink-faint',
                        )}
                    >
                        {state.detail}
                    </p>
                </div>

                <div className="hidden shrink-0 gap-2 sm:flex">
                    {failed && (
                        <Button variant="secondary" size="sm" onClick={() => onRetry(upload)}>
                            Retry
                        </Button>
                    )}
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => onDismiss(upload)}
                        // Not "Remove": nothing here deletes a stored file,
                        // because no endpoint does.
                        title={
                            upload.documentId
                                ? 'Remove this card. The file stays in your library.'
                                : 'Remove this card.'
                        }
                    >
                        Dismiss
                    </Button>
                </div>
            </div>

            <div className="mt-3 flex gap-2 sm:hidden">
                {failed && (
                    <Button variant="secondary" onClick={() => onRetry(upload)} className="flex-1 py-3">
                        Retry
                    </Button>
                )}
                <Button variant="secondary" onClick={() => onDismiss(upload)} className="flex-1 py-3">
                    Dismiss
                </Button>
            </div>
        </div>
    );
}
