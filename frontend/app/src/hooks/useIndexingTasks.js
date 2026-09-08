import { useCallback, useEffect, useRef, useState } from 'react';
import { getTaskStatus } from '../services/api';

// Indexing runs on one worker and a large PDF on a small box is slow. Giving up
// only stops the polling, not the job – the document keeps indexing, and
// reopening the chat is how the user finds out it finished.
const POLL_INTERVAL_MS = 2000;
const POLL_MAX_ATTEMPTS = 150;

/**
 * Track the indexing job started by attaching a document to a chat.
 *
 * Celery reports a state and nothing finer: PENDING, STARTED, then SUCCESS with
 * a chunk count or FAILURE with a reason. There is no percentage to be had, so
 * nothing here invents one – the UI shows the state and an indeterminate bar.
 *
 * Keyed by document id, because that is what the chat header and the library
 * list both have in hand when they need to know whether a document is ready.
 */
export function useIndexingTasks() {
    const [tasks, setTasks] = useState({});
    const timers = useRef({});

    const stopAll = useCallback(() => {
        Object.values(timers.current).forEach(clearTimeout);
        timers.current = {};
    }, []);

    // Timers outlive the component unless they are cleared explicitly.
    useEffect(() => stopAll, [stopAll]);

    // The recursion lives in a local function rather than in `poll` calling
    // itself: a useCallback that references its own binding reads it before it
    // is assigned, which happens to work and is not worth relying on.
    const poll = useCallback((documentId, taskId) => {
        const step = (attempt) => {
            getTaskStatus(taskId)
                .then((status) => {
                    setTasks((current) => ({ ...current, [documentId]: status }));

                    if (status.state === 'SUCCESS' || status.state === 'FAILURE') return;

                    if (attempt >= POLL_MAX_ATTEMPTS) {
                        setTasks((current) => ({ ...current, [documentId]: { state: 'TIMEOUT' } }));
                        return;
                    }

                    timers.current[documentId] = setTimeout(
                        () => step(attempt + 1),
                        POLL_INTERVAL_MS,
                    );
                })
                .catch(() => {
                    setTasks((current) => ({ ...current, [documentId]: { state: 'TIMEOUT' } }));
                });
        };

        step(0);
    }, []);

    /** Begin following a job. `taskId` is null when nothing was dispatched. */
    const track = useCallback(
        (documentId, taskId) => {
            if (!taskId) return;
            setTasks((current) => ({ ...current, [documentId]: { state: 'PENDING' } }));
            poll(documentId, taskId);
        },
        [poll],
    );

    const reset = useCallback(() => {
        stopAll();
        setTasks({});
    }, [stopAll]);

    return { tasks, track, reset };
}

/** What a task state means for the user, in the words the UI shows. */
export function describeIndexing(status) {
    if (!status) return null;

    switch (status.state) {
        case 'SUCCESS': {
            const chunks = status.result?.chunks;
            return {
                tone: 'success',
                label: typeof chunks === 'number' ? `indexed · ${chunks} passages` : 'indexed',
                done: true,
            };
        }
        case 'FAILURE':
            return { tone: 'danger', label: status.error ?? 'indexing failed', done: true };
        case 'TIMEOUT':
            return { tone: 'muted', label: 'still indexing – reopen to check', done: false };
        case 'STARTED':
            return { tone: 'accent', label: 'indexing…', done: false };
        default:
            return { tone: 'accent', label: 'queued…', done: false };
    }
}
