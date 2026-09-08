import { useDialog } from '../../hooks/useDialog';

/**
 * The sidebar as a drawer, for widths where it does not fit beside the chat.
 *
 * It is a dialog, so it behaves like one: Escape closes it, the page behind it
 * stops scrolling, focus moves in and comes back out, and Tab stays inside. The
 * same hook the modal and the sheet use — a panel covering the screen owes the
 * user the same things whichever side it slides from.
 */
export default function SidebarDrawer({ open, onClose, children }) {
    const dialogRef = useDialog(open, onClose);

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-40 flex dialog-backdrop"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) onClose();
            }}
        >
            <div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-label="Chats"
                tabIndex={-1}
                className="h-full shadow-modal"
            >
                {children}
            </div>
        </div>
    );
}
