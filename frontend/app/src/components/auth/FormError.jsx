/**
 * The failure message above the submit button.
 *
 * Deliberately in the flow rather than a toast: it sits where the user is
 * looking when a submit fails, it does not time out while they read it, and it
 * survives long enough to act on. The design calls for this explicitly.
 */
export default function FormError({ children }) {
    if (!children) return null;

    return (
        <p
            role="alert"
            className="rounded-lg border border-danger-line bg-paper-raised px-3.5 py-3 text-[13px] leading-relaxed text-danger"
        >
            {children}
        </p>
    );
}
