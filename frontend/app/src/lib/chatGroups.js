/**
 * Group chats the way the sidebar shows them.
 *
 * The design groups by last activity. The API exposes `created_at` and nothing
 * else, so that is what this sorts and buckets by — a chat returned to after a
 * week sorts by when it started, not when it was last used. Switching to real
 * activity means adding `updated_at` on the server, not guessing here.
 */

const DAY = 24 * 60 * 60 * 1000;

function startOfDay(date) {
    const copy = new Date(date);
    copy.setHours(0, 0, 0, 0);
    return copy.getTime();
}

export function groupChats(chats, now = new Date()) {
    const today = startOfDay(now);

    const buckets = new Map([
        ['Today', []],
        ['Yesterday', []],
        ['Earlier', []],
    ]);

    const sorted = [...chats].sort(
        (a, b) => new Date(b.created_at ?? 0) - new Date(a.created_at ?? 0),
    );

    for (const chat of sorted) {
        // A chat with no timestamp still has to appear somewhere; the oldest
        // bucket is the one place it cannot claim recency it has not earned.
        const day = chat.created_at ? startOfDay(new Date(chat.created_at)) : 0;

        if (day >= today) buckets.get('Today').push(chat);
        else if (day >= today - DAY) buckets.get('Yesterday').push(chat);
        else buckets.get('Earlier').push(chat);
    }

    return [...buckets.entries()].filter(([, items]) => items.length > 0);
}
