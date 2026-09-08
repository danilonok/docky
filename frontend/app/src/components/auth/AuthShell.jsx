import { Logo } from '../ui';

/**
 * The shell both auth screens sit in.
 *
 * Wide enough, it is the split layout from the mocks: a fixed panel saying what
 * Docky is, and a form that never scrolls beside it. Narrower, the panel goes
 * away entirely rather than stacking above the form – its job is to fill space
 * that only exists on a desktop, and repeating it on a phone would push the
 * fields below the fold.
 *
 * The breakpoint is `lg` because that is where the panel and the form stop
 * competing: 520 + 400 plus the form's padding is 1016px.
 */
export default function AuthShell({ aside, back, footer, children }) {
    return (
        <div className="min-h-dvh flex bg-paper text-ink">
            <aside className="hidden lg:flex w-[520px] shrink-0 flex-col gap-16 bg-paper-sunk border-r border-line px-12 py-11">
                <Logo size="md" />
                {aside}
            </aside>

            <div className="flex-1 min-w-0 flex flex-col">
                {back && <div className="shrink-0 px-5 pt-4 lg:hidden">{back}</div>}

                <div className="flex-1 flex items-center justify-center px-6 py-8 lg:p-12">
                    <div className="w-full max-w-[400px] flex flex-col gap-7 lg:gap-[26px]">
                        {/* On a phone the mark stands in for the whole left panel. */}
                        <Logo size="lg" wordmark={false} className="lg:hidden" />
                        {children}
                    </div>
                </div>

                {footer && (
                    <div className="shrink-0 px-6 pb-5 text-center text-xs text-ink-faint lg:hidden">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
}
