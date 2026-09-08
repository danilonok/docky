import { useCallback, useRef, useState } from 'react';
import { addDocumentToChat, uploadDocument } from '../services/api';
import { rejectionReason } from '../lib/uploads';

let nextId = 0;

/**
 * The queue behind the Upload tab.
 *
 * A file goes through two server round trips: it is stored in the library, then
 * attached to this chat, which is what starts indexing. Only the first has a
 * measurable percentage – the second is a Celery task that reports a state – so
 * a card shows a real bar while uploading and an indeterminate one afterwards.
 *
 * Indexing itself is followed by `useIndexingTasks`, whose `track` is passed in.
 * Two pollers for one job would be two answers to the same question.
 */
export function useUploads({ chatId, track, onUploaded, onAttached }) {
    const [uploads, setUploads] = useState([]);
    const controllers = useRef(new Map());

    const patch = useCallback((id, changes) => {
        setUploads((current) =>
            current.map((upload) => (upload.id === id ? { ...upload, ...changes } : upload)),
        );
    }, []);

    const run = useCallback(
        async (id, file) => {
            const controller = new AbortController();
            controllers.current.set(id, controller);

            try {
                patch(id, { stage: 'uploading', progress: 0, error: null });

                const document = await uploadDocument(file, {
                    signal: controller.signal,
                    onProgress: (progress) => patch(id, { progress }),
                });

                patch(id, { stage: 'attaching', progress: 100, documentId: document.id });
                onUploaded?.();

                const started = await addDocumentToChat(document.id, chatId);
                patch(id, { stage: 'indexing', taskId: started?.task_id ?? null });
                onAttached?.();

                // No task id means the document was already attached, so nothing
                // was dispatched and there is nothing to follow.
                if (started?.task_id) track(document.id, started.task_id);
            } catch (error) {
                patch(id, { stage: 'failed', error: error.message });
            } finally {
                controllers.current.delete(id);
            }
        },
        [chatId, onAttached, onUploaded, patch, track],
    );

    const enqueue = useCallback(
        (files) => {
            for (const file of files) {
                const id = `upload-${(nextId += 1)}`;
                const reason = rejectionReason(file);

                const card = {
                    id,
                    name: file.name,
                    size: file.size,
                    stage: reason ? 'failed' : 'uploading',
                    progress: 0,
                    error: reason,
                    documentId: null,
                    taskId: null,
                    // Kept so a rejected or failed upload can be retried without
                    // asking the user to find the file again.
                    file,
                };

                setUploads((current) => [...current, card]);
                if (!reason) run(id, file);
            }
        },
        [run],
    );

    const retry = useCallback(
        (upload) => {
            // A file that failed to parse is already in the library, so retrying
            // means re-running indexing, not uploading it a second time.
            if (upload.documentId) {
                patch(upload.id, { stage: 'indexing', error: null });
                addDocumentToChat(upload.documentId, chatId)
                    .then((started) => {
                        patch(upload.id, { taskId: started?.task_id ?? null });
                        if (started?.task_id) track(upload.documentId, started.task_id);
                    })
                    .catch((error) => patch(upload.id, { stage: 'failed', error: error.message }));
                return;
            }

            const reason = rejectionReason(upload.file);
            if (reason) {
                patch(upload.id, { stage: 'failed', error: reason });
                return;
            }
            run(upload.id, upload.file);
        },
        [chatId, patch, run, track],
    );

    /**
     * Take a card off the list.
     *
     * Only the card: there is no endpoint that deletes a document, so a file
     * that reached the library stays there. The UI says so rather than implying
     * a deletion it cannot perform.
     */
    const dismiss = useCallback((upload) => {
        controllers.current.get(upload.id)?.abort();
        controllers.current.delete(upload.id);
        setUploads((current) => current.filter((item) => item.id !== upload.id));
    }, []);

    const clear = useCallback(() => {
        controllers.current.forEach((controller) => controller.abort());
        controllers.current.clear();
        setUploads([]);
    }, []);

    return { uploads, enqueue, retry, dismiss, clear };
}
