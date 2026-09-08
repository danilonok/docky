import { useCallback, useSyncExternalStore } from 'react';

/**
 * Subscribe to a media query.
 *
 * Built on `useSyncExternalStore` rather than an effect: the match is external
 * state that can change between render and commit, and this is the hook that
 * exists to read exactly that without tearing.
 */
export function useMediaQuery(query) {
    const subscribe = useCallback(
        (onChange) => {
            const list = window.matchMedia(query);
            list.addEventListener('change', onChange);
            return () => list.removeEventListener('change', onChange);
        },
        [query],
    );

    return useSyncExternalStore(
        subscribe,
        () => window.matchMedia(query).matches,
        // No media queries during server rendering; the mobile layout is the
        // safer thing to send, since it is the one that fits either way.
        () => false,
    );
}

/**
 * Above this, the desktop layout holds: 244px sidebar plus a 720px reading
 * column, with room left over. Below it the sidebar collapses behind a button.
 *
 * Mirrored by `--breakpoint-desk` in index.css, which is how CSS says the same
 * thing. Change one and the other has to change with it.
 */
export const DESKTOP_QUERY = '(min-width: 900px)';

export function useIsDesktop() {
    return useMediaQuery(DESKTOP_QUERY);
}
