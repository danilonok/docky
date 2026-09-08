import { useCallback, useEffect, useRef, useState } from 'react';
import { getMessages } from '../services/api';

const IDLE_INTERVAL_MS = 8000;
const AWAITING_REPLY_INTERVAL_MS = 2000;

/**
 * The messages of one chat, kept current by polling.
 *
 * There is no stream to subscribe to: a question is handed to Celery, and the
 * empty assistant row it created is filled in later by the worker. Polling is
 * how the answer arrives.
 *
 * The interval follows what is actually happening. While a reply is outstanding
 * the answer could land at any moment and a few seconds of silence is visible,
 * so it polls hard; once every message is finished there is nothing to wait for
 * and it backs off, instead of asking a question nobody needs answered.
 */
export function useChatMessages(chatId) {
    const [fetched, setFetched] = useState([]);
    const [error, setError] = useState(null);

    // Reported rather than stored: with no chat selected the last chat's
    // messages are still in state, and clearing them would mean a setState in
    // an effect for something the caller can simply be told.
    const messages = chatId ? fetched : [];
    const awaiting = messages.some((message) => message.agentic && !message.finished);

    // Read by the polling loop without being one of its dependencies, so the
    // timer is not torn down and rebuilt on every message that arrives. Synced
    // in an effect, since render is not a safe place to write a ref.
    const awaitingRef = useRef(false);
    useEffect(() => {
        awaitingRef.current = awaiting;
    }, [awaiting]);

    const refresh = useCallback(async () => {
        if (!chatId) return;
        try {
            const data = await getMessages(chatId);
            setFetched(data ?? []);
            setError(null);
        } catch (caught) {
            setError(caught.message);
        }
    }, [chatId]);

    useEffect(() => {
        if (!chatId) return undefined;

        let cancelled = false;
        let timer;

        const tick = async () => {
            await refresh();
            if (cancelled) return;
            timer = setTimeout(tick, awaitingRef.current ? AWAITING_REPLY_INTERVAL_MS : IDLE_INTERVAL_MS);
        };

        tick();

        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [chatId, refresh]);

    return { messages, error, refresh, awaitingReply: awaiting };
}
