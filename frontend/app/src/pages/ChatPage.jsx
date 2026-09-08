import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    addDocumentToChat,
    createChat,
    deleteChat,
    deleteChatDocuments,
    getChatDocuments,
    getChats,
    getDocuments,
    getServerInfo,
    sendMessage,
} from '../services/api';
import { useChatMessages } from '../hooks/useChatMessages';
import { useIndexingTasks } from '../hooks/useIndexingTasks';
import { useUploads } from '../hooks/useUploads';
import { useIsDesktop } from '../hooks/useMediaQuery';
import Sidebar from '../components/chat/Sidebar';
import ChatHeader from '../components/chat/ChatHeader';
import Transcript from '../components/chat/Transcript';
import Composer from '../components/chat/Composer';
import AttachDialog from '../components/chat/AttachDialog';

export default function ChatPage() {
    const { chatId } = useParams();
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const desktop = useIsDesktop();

    const [chats, setChats] = useState([]);
    const [documents, setDocuments] = useState([]);
    const [chatDocuments, setChatDocuments] = useState([]);
    const [serverInfo, setServerInfo] = useState(null);

    const [draft, setDraft] = useState('');
    const [sending, setSending] = useState(false);
    const [creating, setCreating] = useState(false);
    const [sendError, setSendError] = useState(null);
    const [attachOpen, setAttachOpen] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);

    const activeChatId = chatId ? Number(chatId) : null;
    const activeChat = chats.find((chat) => chat.id === activeChatId) ?? null;

    const { messages, refresh: refreshMessages, awaitingReply } = useChatMessages(activeChatId);
    const { tasks: indexing, track, reset: resetIndexing } = useIndexingTasks();

    const refreshChats = useCallback(async () => {
        try {
            setChats((await getChats()) ?? []);
        } catch {
            setChats([]);
        }
    }, []);

    const refreshDocuments = useCallback(async () => {
        try {
            setDocuments((await getDocuments()) ?? []);
        } catch {
            setDocuments([]);
        }
    }, []);

    useEffect(() => {
        refreshChats();
        refreshDocuments();
        // Model names are configuration; they do not change while the app is open.
        getServerInfo()
            .then(setServerInfo)
            .catch(() => setServerInfo(null));
    }, [refreshChats, refreshDocuments]);

    const refreshChatDocuments = useCallback(async (id) => {
        if (!id) return;
        try {
            setChatDocuments((await getChatDocuments(id)) ?? []);
        } catch {
            setChatDocuments([]);
        }
    }, []);

    // Declared after the refreshers it calls: an upload writes to the library
    // and to this chat's attachments, and both lists have to be told.
    const {
        uploads,
        enqueue,
        retry: retryUpload,
        dismiss: dismissUpload,
        clear: clearUploads,
    } = useUploads({
        chatId: activeChatId,
        track,
        onUploaded: refreshDocuments,
        onAttached: useCallback(() => {
            refreshChatDocuments(activeChatId);
            refreshChats();
        }, [activeChatId, refreshChatDocuments, refreshChats]),
    });

    useEffect(() => {
        resetIndexing();
        clearUploads();
        setSendError(null);
        setDraft('');
        if (activeChatId) refreshChatDocuments(activeChatId);
        else setChatDocuments([]);
    }, [activeChatId, refreshChatDocuments, resetIndexing, clearUploads]);

    const attachedIds = useMemo(
        () => new Set(chatDocuments.map((document) => document.id)),
        [chatDocuments],
    );

    const handleNewChat = async () => {
        setCreating(true);
        try {
            const chat = await createChat('New chat');
            await refreshChats();
            navigate(`/chats/${chat.id}`);
            setMenuOpen(false);
        } catch {
            // Leaving the list untouched is the right outcome: nothing was made.
        } finally {
            setCreating(false);
        }
    };

    const handleSend = async () => {
        const content = draft.trim();
        if (!content || !activeChatId) return;

        setSending(true);
        setSendError(null);
        try {
            await sendMessage(activeChatId, content);
            setDraft('');
            await refreshMessages();
        } catch (error) {
            setSendError(error.message);
        } finally {
            setSending(false);
        }
    };

    const handleRegenerate = async (answer) => {
        // Re-ask the question this answer replied to. There is no endpoint that
        // re-runs a query, so the honest equivalent is asking it again, which
        // appears as a new turn rather than replacing the old one.
        const question = messages.find((message) => message.id === answer.reply_to);
        if (!question?.content || !activeChatId) return;

        setSending(true);
        setSendError(null);
        try {
            await sendMessage(activeChatId, question.content);
            await refreshMessages();
        } catch (error) {
            setSendError(error.message);
        } finally {
            setSending(false);
        }
    };

    const handleCopy = (message) => {
        navigator.clipboard?.writeText(message.content ?? '');
    };

    const handleAttach = async (documentIds) => {
        for (const documentId of documentIds) {
            try {
                const started = await addDocumentToChat(documentId, activeChatId);
                // Null when the document was already attached and no job ran.
                track(documentId, started?.task_id);
            } catch {
                // One failure should not abandon the rest of the selection.
            }
        }
        await refreshChatDocuments(activeChatId);
        await refreshChats();
    };

    const handleDeleteChat = async (chat) => {
        // Deleting takes the chat's messages and its attachments with it, and
        // nothing here can put them back, so it is worth one question.
        const confirmed = window.confirm(
            `Delete “${chat.title}”? Its messages and attached documents go with it. The documents stay in your library.`,
        );
        if (!confirmed) return;

        try {
            await deleteChat(chat.id);
            await refreshChats();
            if (chat.id === activeChatId) navigate('/chats');
        } catch {
            // The list is refreshed either way, so a failed delete simply leaves
            // the chat where it was.
            await refreshChats();
        }
    };

    const handleDetachAll = async () => {
        if (!activeChatId) return;
        await deleteChatDocuments(activeChatId);
        resetIndexing();
        await refreshChatDocuments(activeChatId);
        await refreshChats();
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const sidebar = (
        <Sidebar
            chats={chats}
            activeChatId={activeChatId}
            libraryCount={documents.length}
            userEmail={user?.email ?? ''}
            creating={creating}
            onNewChat={handleNewChat}
            onDeleteChat={handleDeleteChat}
            onLogout={handleLogout}
            onNavigate={() => setMenuOpen(false)}
        />
    );

    return (
        <div className="flex h-dvh overflow-hidden bg-paper text-ink">
            {desktop ? (
                sidebar
            ) : (
                menuOpen && (
                    <div className="fixed inset-0 z-40 flex bg-scrim/80" onMouseDown={() => setMenuOpen(false)}>
                        <div onMouseDown={(event) => event.stopPropagation()}>{sidebar}</div>
                    </div>
                )
            )}

            <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
                {activeChat ? (
                    <>
                        <ChatHeader
                            chat={activeChat}
                            documents={chatDocuments}
                            indexing={indexing}
                            model={serverInfo?.llm_model}
                            messageCount={messages.length}
                            onAddDocuments={() => setAttachOpen(true)}
                            onMenu={desktop ? null : () => setMenuOpen(true)}
                        />

                        <Transcript
                            messages={messages}
                            onCopy={handleCopy}
                            onRegenerate={handleRegenerate}
                            emptyState={
                                <p className="font-serif text-[17px] leading-[1.65] text-ink-faint">
                                    {chatDocuments.length === 0
                                        ? 'Attach a document with “+ Add”, then ask about it here.'
                                        : 'Ask the first question about these documents.'}
                                </p>
                            }
                        />

                        {sendError && (
                            <p role="alert" className="shrink-0 px-4 text-[13px] text-danger sm:px-10">
                                {sendError}
                            </p>
                        )}

                        <Composer
                            value={draft}
                            onChange={setDraft}
                            onSubmit={handleSend}
                            sending={sending}
                            disabled={sending || awaitingReply}
                            hint={
                                chatDocuments.length === 0
                                    ? 'No documents attached yet — answers will have nothing to draw on.'
                                    : `Answers come from the ${chatDocuments.length} attached document${chatDocuments.length === 1 ? '' : 's'} only.`
                            }
                        />
                    </>
                ) : (
                    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
                        {!desktop && (
                            <button
                                type="button"
                                onClick={() => setMenuOpen(true)}
                                className="cursor-pointer text-sm text-accent underline"
                            >
                                Show chats
                            </button>
                        )}
                        <h1 className="font-serif text-2xl font-semibold text-ink">
                            {chats.length === 0 ? 'No chats yet' : 'Pick a chat'}
                        </h1>
                        <p className="max-w-[360px] text-[15px] text-ink-faint">
                            A chat holds its own documents, and answers only ever come from what is
                            attached to it.
                        </p>
                    </div>
                )}
            </div>

            {activeChat && (
                <AttachDialog
                    open={attachOpen}
                    onClose={() => setAttachOpen(false)}
                    chatTitle={activeChat.title}
                    documents={documents}
                    attachedIds={attachedIds}
                    indexing={indexing}
                    onAttach={handleAttach}
                    onDetachAll={handleDetachAll}
                    uploads={uploads}
                    onFiles={enqueue}
                    onRetryUpload={retryUpload}
                    onDismissUpload={dismissUpload}
                />
            )}
        </div>
    );
}
