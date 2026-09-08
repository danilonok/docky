import { NavLink } from 'react-router-dom';
import { Button, Logo, cx } from '../ui';
import { groupChats } from '../../lib/chatGroups';

/**
 * Chat list and account footer.
 *
 * On a desktop it is a fixed column; below the layout breakpoint the same
 * markup is what the menu button slides in, so there is one sidebar rather than
 * two that drift apart.
 */
export default function Sidebar({
    chats,
    activeChatId,
    libraryCount,
    userEmail,
    creating,
    onNewChat,
    onDeleteChat,
    onLogout,
    onNavigate,
}) {
    const groups = groupChats(chats);

    return (
        <div className="flex h-full min-h-0 w-[244px] shrink-0 flex-col overflow-hidden border-r border-line bg-paper-sunk">
            <div className="flex items-center justify-between px-[18px] pb-3.5 pt-[18px]">
                <Logo size="sm" />
            </div>

            <div className="px-3 pb-3">
                <Button size="sm" className="w-full py-2.5" onClick={onNewChat} disabled={creating}>
                    {creating ? 'Creating…' : 'New chat'}
                </Button>
            </div>

            <nav className="min-h-0 flex-1 overflow-auto px-2.5">
                {groups.length === 0 && (
                    <p className="px-2.5 py-3 text-[13px] leading-relaxed text-ink-faint">
                        No chats yet. Start one to attach documents and ask about them.
                    </p>
                )}

                {groups.map(([label, items]) => (
                    <div key={label}>
                        <div className="px-2.5 pb-1.5 pt-3 text-[11px] uppercase tracking-[0.12em] text-ink-faint">
                            {label}
                        </div>
                        <ul className="flex flex-col gap-0.5">
                            {items.map((chat) => {
                                const active = chat.id === activeChatId;
                                return (
                                    <li key={chat.id} className="group relative">
                                        <NavLink
                                            to={`/chats/${chat.id}`}
                                            onClick={onNavigate}
                                            className={cx(
                                                'flex items-center justify-between gap-2 rounded-[5px] py-2.5 pl-2.5 pr-8',
                                                active
                                                    ? 'bg-paper font-semibold text-ink'
                                                    : 'text-ink-muted hover:bg-paper/60',
                                            )}
                                        >
                                            <span className="truncate text-sm">{chat.title}</span>
                                            {chat.document_count > 0 && (
                                                <span className="shrink-0 text-[11px] text-accent">
                                                    {chat.document_count} doc
                                                    {chat.document_count === 1 ? '' : 's'}
                                                </span>
                                            )}
                                        </NavLink>

                                        {/* Revealed on hover, but always reachable
                                            by keyboard — focus-within keeps it
                                            visible once tabbed to. */}
                                        <button
                                            type="button"
                                            onClick={() => onDeleteChat(chat)}
                                            aria-label={`Delete chat ${chat.title}`}
                                            className="absolute right-0.5 top-1/2 flex h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded text-sm text-ink-faint hover:text-danger focus-visible:opacity-100 desk:h-8 desk:w-8 desk:opacity-0 desk:group-hover:opacity-100"
                                        >
                                            ×
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                ))}
            </nav>

            <div className="shrink-0 border-t border-line px-3.5 py-3">
                <div className="flex justify-between text-[13px] text-ink-muted">
                    <span>Library</span>
                    <span className="text-ink-faint">{libraryCount}</span>
                </div>
                <div className="mt-2.5 flex items-center justify-between gap-2 text-xs text-ink-faint">
                    <span className="truncate" title={userEmail}>
                        {userEmail}
                    </span>
                    <button
                        type="button"
                        id="logout-btn"
                        onClick={onLogout}
                        className="shrink-0 cursor-pointer underline hover:text-ink-muted"
                    >
                        Log out
                    </button>
                </div>
            </div>
        </div>
    );
}
