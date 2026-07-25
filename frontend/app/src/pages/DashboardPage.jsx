import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    getChats,
    createChat,
    deleteChat,
    getMessages,
    sendMessage,
    getDocuments,
    uploadDocument,
    getChatDocuments,
    addDocumentToChat,
    deleteChatDocuments,
    getChat,
} from '../services/api';

/* ───────────────────── Icons ───────────────────── */
const PlusIcon = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
);

const SendIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
    </svg>
);

const DocIcon = () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
    </svg>
);

const ChatIcon = () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
    </svg>
);

const TrashIcon = () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
    </svg>
);

const SourceIcon = () => (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
    </svg>
);

/* ───────── Source-nodes hover popup ───────── */
function SourceNodesPopup({ sourceNodes }) {
    if (!sourceNodes || sourceNodes.length === 0) return null;

    return (
        <div className="source-popup absolute left-0 top-full z-50 w-[360px] max-w-[90vw] pt-1"
            onClick={(e) => e.stopPropagation()}
        >
            <div className="rounded-2xl border border-surface-700/50 bg-surface-900/95 backdrop-blur-xl shadow-2xl shadow-black/40 overflow-hidden">
                {/* Header */}
                <div className="flex items-center gap-2 px-4 py-2.5 border-b border-surface-700/40 bg-surface-800/40">
                    <div className="w-5 h-5 rounded-md bg-accent-500/15 flex items-center justify-center text-accent-400">
                        <SourceIcon />
                    </div>
                    <span className="text-xs font-semibold text-surface-300 tracking-wide uppercase">Sources</span>
                    <span className="ml-auto text-[10px] text-surface-500 bg-surface-800/80 px-2 py-0.5 rounded-full">
                        {sourceNodes.length} node{sourceNodes.length !== 1 ? 's' : ''}
                    </span>
                </div>

                {/* Nodes */}
                <div className="max-h-64 overflow-y-auto p-2 space-y-1.5">
                    {sourceNodes.map((sn, i) => {
                        const scorePercent = Math.round((sn.score ?? 0) * 100);
                        const nodeText = sn.node || '';
                        const truncated = nodeText.length > 180 ? nodeText.slice(0, 180) + '…' : nodeText;
                        return (
                            <div
                                key={i}
                                className="source-node-card rounded-xl border border-surface-700/30 bg-surface-800/50 px-3 py-2.5"
                            >
                                <p className="text-xs text-surface-300 leading-relaxed mb-2">
                                    {truncated}
                                </p>
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 h-1 rounded-full bg-surface-700/60 overflow-hidden">
                                        <div
                                            className="score-bar-fill h-full rounded-full bg-gradient-to-r from-accent-500 to-primary-400"
                                            style={{ width: `${scorePercent}%` }}
                                        />
                                    </div>
                                    <span className="text-[10px] font-medium text-surface-400 tabular-nums">
                                        {scorePercent}%
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

/* ───────────────────── Component ───────────────────── */
export default function DashboardPage() {
    const { user, logout: authLogout } = useAuth();
    const navigate = useNavigate();
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const prevMsgCountRef = useRef(0);

    // Data state
    const [chats, setChats] = useState([]);
    const [activeChatId, setActiveChatId] = useState(null);
    const [activeChatInfo, setActiveChatInfo] = useState(null);
    const [messages, setMessages] = useState([]);
    const [documents, setDocuments] = useState([]);
    const [chatDocuments, setChatDocuments] = useState([]);

    // UI state
    const [messageInput, setMessageInput] = useState('');
    const [sendingMessage, setSendingMessage] = useState(false);
    const [creatingChat, setCreatingChat] = useState(false);
    const [newChatTitle, setNewChatTitle] = useState('');
    const [showNewChatInput, setShowNewChatInput] = useState(false);
    const [uploadingDoc, setUploadingDoc] = useState(false);
    const [hoveredMsgId, setHoveredMsgId] = useState(null);

    // ── Fetch data ──────────────────────────────────────
    const fetchChats = useCallback(async () => {
        try {
            const data = await getChats();
            setChats(data || []);
        } catch {
            setChats([]);
        }
    }, []);

    const fetchDocuments = useCallback(async () => {
        try {
            const data = await getDocuments();
            setDocuments(data || []);
        } catch {
            setDocuments([]);
        }
    }, []);

    const fetchMessages = useCallback(async (chatId) => {
        if (!chatId) return;
        try {
            const data = await getMessages(chatId);
            setMessages(data || []);
        } catch {
            setMessages([]);
        }
    }, []);

    const fetchChatInfo = useCallback(async (chatId) => {
        if (!chatId) return;
        try {
            const chatData = await getChat(chatId);
            setActiveChatInfo(chatData);

            const docsData = await getChatDocuments(chatId);
            setChatDocuments(docsData || []);
        } catch {
            setActiveChatInfo(null);
            setChatDocuments([]);
        }
    }, []);

    useEffect(() => {
        fetchChats();
        fetchDocuments();
    }, [fetchChats, fetchDocuments]);

    useEffect(() => {
        if (activeChatId) {
            fetchMessages(activeChatId);
            fetchChatInfo(activeChatId);
        } else {
            setMessages([]);
            setActiveChatInfo(null);
            setChatDocuments([]);
        }
    }, [activeChatId, fetchMessages, fetchChatInfo]);

    // Auto-scroll only when new messages arrive
    useEffect(() => {
        if (messages.length > prevMsgCountRef.current) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
        prevMsgCountRef.current = messages.length;
    }, [messages]);

    // Polling for messages when a chat is active
    useEffect(() => {
        if (!activeChatId) return;
        const interval = setInterval(() => fetchMessages(activeChatId), 3000);
        return () => clearInterval(interval);
    }, [activeChatId, fetchMessages]);

    // ── Handlers ────────────────────────────────────────
    const handleLogout = () => {
        authLogout();
        navigate('/login');
    };

    const handleSelectChat = (chatId) => {
        setActiveChatId(chatId);
    };

    const handleCreateChat = async () => {
        if (!newChatTitle.trim()) return;
        setCreatingChat(true);
        try {
            const chat = await createChat(newChatTitle.trim());
            setChats((prev) => [chat, ...prev]);
            setActiveChatId(chat.id);
            setNewChatTitle('');
            setShowNewChatInput(false);
        } catch {
            // ignore
        } finally {
            setCreatingChat(false);
        }
    };

    const handleDeleteChat = async (e, chatId) => {
        e.stopPropagation();
        try {
            await deleteChat(chatId);
            setChats((prev) => prev.filter((c) => c.id !== chatId));
            if (activeChatId === chatId) {
                setActiveChatId(null);
            }
        } catch {
            // ignore
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!messageInput.trim() || !activeChatId) return;
        setSendingMessage(true);
        try {
            await sendMessage(activeChatId, messageInput.trim());
            setMessageInput('');
            await fetchMessages(activeChatId);
        } catch {
            // ignore
        } finally {
            setSendingMessage(false);
        }
    };

    const handleUploadDocument = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadingDoc(true);
        try {
            await uploadDocument(file);
            await fetchDocuments();
        } catch {
            // ignore
        } finally {
            setUploadingDoc(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleDeleteAllChatDocuments = async () => {
        if (!activeChatId || chatDocuments.length === 0) return;
        try {
            await deleteChatDocuments(activeChatId);
            setChatDocuments([]);
        } catch {
            // ignore
        }
    };

    const handleAttachDocument = async (documentId) => {
        if (!activeChatId || !documentId) return;
        try {
            await addDocumentToChat(documentId, activeChatId);
            const docsData = await getChatDocuments(activeChatId);
            setChatDocuments(docsData || []);
        } catch {
            // ignore
        }
    };

    const getFileExtension = (name) => {
        if (!name || typeof name !== 'string') return '';
        const parts = name.split('.');
        return parts.length > 1 ? `.${parts.pop()}` : '';
    };

    const getFileName = (name) => {
        if (!name || typeof name !== 'string') return 'Document';
        const parts = name.split('.');
        if (parts.length > 1) parts.pop();
        return parts.join('.');
    };

    // ── Render ──────────────────────────────────────────
    return (
        <div className="h-screen flex flex-col bg-surface-950 overflow-hidden">
            {/* ▸ Top bar */}
            <header className="shrink-0 flex items-center justify-center gap-4 px-6 py-3 border-b border-surface-800/80 bg-surface-950/80 backdrop-blur-md z-20">
                <span className="text-sm text-surface-400">
                    logged as: <span className="text-surface-200 font-medium">{user?.email?.split('@')[0] || 'user'}</span>
                </span>
                <button
                    onClick={handleLogout}
                    id="logout-btn"
                    className="text-sm text-surface-500 hover:text-surface-200 transition-colors cursor-pointer underline underline-offset-2"
                >
                    logout
                </button>
            </header>

            {/* ▸ Main 3-column layout */}
            <div className="flex flex-1 min-h-0">
                {/* ── Left sidebar: My chats ── */}
                <aside className="w-64 shrink-0 border-r border-surface-800/80 flex flex-col bg-surface-900/40">
                    <div className="p-4 pb-2">
                        <h2 className="text-sm font-semibold text-surface-300 tracking-wide uppercase">My chats</h2>
                    </div>

                    <div className="flex-1 overflow-y-auto px-3 pb-2 space-y-1">
                        {chats.map((chat) => (
                            <button
                                key={chat.id}
                                onClick={() => handleSelectChat(chat.id)}
                                className={`group w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-left text-sm transition-all duration-200 cursor-pointer ${activeChatId === chat.id
                                    ? 'bg-primary-500/15 text-primary-300 border border-primary-500/20'
                                    : 'text-surface-300 hover:bg-surface-800/60 hover:text-surface-100 border border-transparent'
                                    }`}
                            >
                                <ChatIcon />
                                <span className="truncate flex-1">{chat.title}</span>
                                <span
                                    onClick={(e) => handleDeleteChat(e, chat.id)}
                                    className="opacity-0 group-hover:opacity-100 text-surface-500 hover:text-danger-400 transition-all cursor-pointer p-0.5"
                                >
                                    <TrashIcon />
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* New chat */}
                    <div className="p-3 border-t border-surface-800/60">
                        {showNewChatInput ? (
                            <div className="flex gap-2 min-w-0">
                                <input
                                    type="text"
                                    value={newChatTitle}
                                    onChange={(e) => setNewChatTitle(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleCreateChat()}
                                    placeholder="Chat title…"
                                    autoFocus
                                    className="flex-1 min-w-0 px-3 py-2 text-sm bg-surface-800/60 border border-surface-600/50 rounded-lg text-surface-100 placeholder-surface-500 focus:outline-none focus:ring-1 focus:ring-primary-500/50"
                                />
                                <button
                                    onClick={handleCreateChat}
                                    disabled={creatingChat || !newChatTitle.trim()}
                                    className="px-3 py-2 bg-primary-500/20 text-primary-400 rounded-lg hover:bg-primary-500/30 transition-colors disabled:opacity-40 cursor-pointer"
                                >
                                    {creatingChat ? '…' : '✓'}
                                </button>
                                <button
                                    onClick={() => { setShowNewChatInput(false); setNewChatTitle(''); }}
                                    className="px-2 py-2 text-surface-500 hover:text-surface-300 transition-colors cursor-pointer"
                                >
                                    ✕
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => setShowNewChatInput(true)}
                                id="new-chat-btn"
                                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm text-surface-400 hover:text-surface-200 hover:bg-surface-800/60 border border-dashed border-surface-700/60 hover:border-surface-600 transition-all duration-200 cursor-pointer"
                            >
                                <PlusIcon />
                            </button>
                        )}
                    </div>
                </aside>

                {/* ── Center: Chat messages ── */}
                <main className="flex-1 flex flex-col min-w-0">
                    {activeChatId ? (
                        <>
                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto overflow-x-hidden px-6 py-4" style={{ scrollbarGutter: 'stable' }}>
                                <div className="max-w-2xl mx-auto space-y-4">
                                    {messages.length === 0 && (
                                        <div className="flex flex-col items-center justify-center h-full pt-32 text-center">
                                            <ChatIcon />
                                            <p className="text-surface-500 mt-3 text-sm">No messages yet. Start the conversation!</p>
                                        </div>
                                    )}
                                    {messages.map((msg) => {
                                        const isAgent = msg.agentic;
                                        const isThinking = isAgent && (!msg.content || msg.content.trim() === '') && !msg.finished;
                                        const hasSources = isAgent && msg.source_nodes && msg.source_nodes.length > 0;
                                        return (
                                            <div
                                                key={msg.id}
                                                className={`flex ${isAgent ? 'justify-start' : 'justify-end'}`}
                                            >
                                                <div
                                                    className="relative"
                                                    onMouseEnter={() => hasSources && setHoveredMsgId(msg.id)}
                                                    onMouseLeave={() => setHoveredMsgId(null)}
                                                >
                                                    <div
                                                        className={`max-w-[100%] rounded-2xl px-4 py-3 ${isAgent
                                                            ? 'bg-surface-800/70 border border-surface-700/50 rounded-tl-md'
                                                            : 'bg-primary-500/15 border border-primary-500/20 rounded-tr-md'
                                                            } ${hasSources ? 'cursor-default' : ''}`}
                                                    >
                                                        <div className="flex items-center gap-1.5">
                                                            <p className={`text-xs font-medium mb-1 ${isAgent ? 'text-accent-400' : 'text-primary-400'}`}>
                                                                {isAgent ? 'Agent' : user?.email?.split('@')[0] || 'You'}
                                                            </p>
                                                            {hasSources && (
                                                                <span className="mb-1 inline-flex items-center gap-1 text-[10px] text-accent-400/70 bg-accent-500/10 px-1.5 py-0.5 rounded-full">
                                                                    <SourceIcon />
                                                                    {msg.source_nodes.length}
                                                                </span>
                                                            )}
                                                        </div>
                                                        {isThinking ? (
                                                            <div className="flex items-center gap-2">
                                                                <span className="inline-block w-2 h-2 rounded-full bg-accent-400 animate-pulse" />
                                                                <p className="text-sm text-surface-400 italic">
                                                                    Agent is producing answer…
                                                                </p>
                                                            </div>
                                                        ) : isAgent ? (
                                                            <div className="prose-agent text-sm text-surface-200 leading-relaxed break-words">
                                                                <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
                                                                    {msg.content}
                                                                </ReactMarkdown>
                                                            </div>
                                                        ) : (
                                                            <p className="text-sm text-surface-200 leading-relaxed whitespace-pre-wrap break-words">
                                                                {msg.content}
                                                            </p>
                                                        )}
                                                    </div>
                                                    {hoveredMsgId === msg.id && hasSources && (
                                                        <SourceNodesPopup sourceNodes={msg.source_nodes} />
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                    <div ref={messagesEndRef} />
                                </div>
                            </div>

                            {/* Input */}
                            <div className="shrink-0 px-6 py-4 border-t border-surface-800/60">
                                <form onSubmit={handleSendMessage} className="max-w-2xl mx-auto flex gap-3">
                                    <input
                                        type="text"
                                        value={messageInput}
                                        onChange={(e) => setMessageInput(e.target.value)}
                                        placeholder="Text entry..."
                                        id="message-input"
                                        className="flex-1 px-4 py-3 bg-surface-800/50 border border-surface-700/50 rounded-xl text-surface-100 placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500/40 transition-all duration-200"
                                    />
                                    <button
                                        type="submit"
                                        disabled={sendingMessage || !messageInput.trim()}
                                        id="send-message-btn"
                                        className="px-4 py-3 bg-primary-500/20 hover:bg-primary-500/30 text-primary-400 rounded-xl transition-all duration-200 disabled:opacity-30 cursor-pointer"
                                    >
                                        <SendIcon />
                                    </button>
                                </form>
                            </div>
                        </>
                    ) : (
                        /* No chat selected state */
                        <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
                            <div className="w-16 h-16 rounded-2xl bg-surface-800/60 border border-surface-700/40 flex items-center justify-center mb-4">
                                <svg className="w-8 h-8 text-surface-600" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
                                </svg>
                            </div>
                            <h2 className="text-lg font-semibold text-surface-400 mb-1">Select a chat</h2>
                            <p className="text-sm text-surface-500 max-w-xs">Pick a conversation from the sidebar or create a new one to get started.</p>
                        </div>
                    )}
                </main>

                {/* ── Right sidebar: My documents ── */}
                <aside className="w-64 shrink-0 border-l border-surface-800/80 flex flex-col bg-surface-900/40">

                    {/* Section: Attached to chat */}
                    {activeChatId && (
                        <div className="flex flex-col max-h-[40%] border-b border-surface-800/60">
                            <div className="p-4 pb-2">
                                <h2 className="text-sm font-semibold text-primary-400 tracking-wide uppercase">Attached to chat</h2>
                            </div>
                            <div className="flex-1 overflow-y-auto px-3 pb-2 space-y-1.5 min-h-0">
                                {chatDocuments.length === 0 && (
                                    <p className="text-xs text-surface-600 px-3 py-2 text-center italic">No documents attached</p>
                                )}
                                {chatDocuments.map((doc, idx) => {
                                    const name = doc.name || doc.original_file_name || doc.title || doc.file_name || `Document ${doc.id ?? idx + 1}`;
                                    return (
                                        <div
                                            key={`chat-doc-${doc.id ?? idx}`}
                                            className="group flex items-start gap-2.5 px-3 py-2 rounded-xl bg-primary-500/10 border border-primary-500/20"
                                        >
                                            <div className="w-6 h-6 rounded-lg bg-primary-500/20 flex items-center justify-center text-primary-400 shrink-0 mt-0.5">
                                                <DocIcon />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm text-surface-200 truncate">{getFileName(name)}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            {chatDocuments.length > 0 && (
                                <div className="px-3 pb-3">
                                    <button
                                        onClick={handleDeleteAllChatDocuments}
                                        className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-danger-400 hover:bg-danger-500/10 border border-danger-500/20 hover:border-danger-500/30 transition-all duration-200 cursor-pointer"
                                    >
                                        <TrashIcon />
                                        Delete all
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Section: All documents */}
                    <div className="flex flex-col flex-1 min-h-0">
                        <div className="p-4 pb-2">
                            <h2 className="text-sm font-semibold text-surface-300 tracking-wide uppercase">All documents</h2>
                        </div>

                        <div className="flex-1 overflow-y-auto px-3 pb-2 space-y-1.5">
                            {documents.length === 0 && (
                                <p className="text-xs text-surface-600 px-3 py-4 text-center">No documents yet</p>
                            )}
                            {documents.map((doc, idx) => {
                                const name = doc.name || doc.original_file_name || doc.title || doc.file_name || `Document ${doc.id ?? idx + 1}`;
                                const isAttached = chatDocuments.some((cd) => cd.id === doc.id);
                                return (
                                    <div
                                        key={doc.id ?? idx}
                                        className="group flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-surface-800/40 border border-surface-700/30 hover:border-surface-600/50 transition-all duration-200"
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-surface-700/50 flex items-center justify-center text-surface-400 shrink-0">
                                            <DocIcon />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm text-surface-200 truncate">{getFileName(name)}</p>
                                            <p className="text-xs text-surface-500">{getFileExtension(name) || '.file'}</p>
                                        </div>
                                        {activeChatId && (
                                            <button
                                                onClick={() => handleAttachDocument(doc.id)}
                                                disabled={isAttached}
                                                title={isAttached ? 'Already attached' : 'Attach to chat'}
                                                className={`shrink-0 p-1.5 rounded-lg transition-all duration-200 cursor-pointer ${isAttached
                                                    ? 'text-accent-400 opacity-60 cursor-default'
                                                    : 'text-surface-500 hover:text-primary-400 hover:bg-primary-500/10'
                                                    }`}
                                            >
                                                {isAttached ? (
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                                                    </svg>
                                                ) : (
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.112 2.13" />
                                                    </svg>
                                                )}
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Upload button */}
                    <div className="p-3 border-t border-surface-800/60">
                        <input
                            ref={fileInputRef}
                            type="file"
                            onChange={handleUploadDocument}
                            className="hidden"
                            id="doc-upload-input"
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploadingDoc}
                            id="upload-doc-btn"
                            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm text-surface-400 hover:text-surface-200 hover:bg-surface-800/60 border border-dashed border-surface-700/60 hover:border-surface-600 transition-all duration-200 disabled:opacity-40 cursor-pointer"
                        >
                            {uploadingDoc ? (
                                <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                            ) : (
                                <PlusIcon />
                            )}
                        </button>
                    </div>
                </aside>
            </div>
        </div>
    );
}
