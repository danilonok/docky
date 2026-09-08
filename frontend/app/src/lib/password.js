/**
 * Password rules, mirrored from the server.
 *
 * The API enforces these in `check_password` (app/schemas/user.py) and rejects a
 * registration that breaks any of them. Repeating them here is duplication, but
 * the alternative is a user who only learns the rules by failing to submit. If
 * the server's rules change, this file has to change with them.
 */

// Kept character-for-character in step with SPECIAL_CHARACTERS on the server.
// String.raw so the backslash in the set stays a backslash: written as a normal
// literal, `\|` is an unrecognised escape and silently collapses to `|`, which
// would quietly drop a character the server does accept.
const SPECIAL_CHARACTERS = new Set([
    ...String.raw`!@#$%^&*()-_=+[]{};:,.<>?/\|`,
    '`',
    ...String.raw`~'"`,
]);

export const PASSWORD_RULES = [
    { id: 'length', label: 'at least 8 characters', test: (value) => value.length >= 8 },
    { id: 'upper', label: 'an uppercase letter', test: (value) => /[A-Z]/.test(value) },
    { id: 'digit', label: 'a digit', test: (value) => /\d/.test(value) },
    {
        id: 'special',
        label: 'a special character',
        test: (value) => [...value].some((char) => SPECIAL_CHARACTERS.has(char)),
    },
];

const LABELS = ['', 'Weak', 'Fair', 'Good', 'Strong'];

/**
 * Score a password out of four, and say what it is still missing.
 *
 * `missing` is what turns a meter into guidance: a bar that stops at three of
 * four tells the user they failed without telling them why.
 */
export function passwordStrength(value) {
    if (!value) return { score: 0, label: '', missing: [], satisfied: false };

    const failed = PASSWORD_RULES.filter((rule) => !rule.test(value));
    const score = PASSWORD_RULES.length - failed.length;

    return {
        score,
        label: LABELS[score],
        missing: failed.map((rule) => rule.label),
        satisfied: failed.length === 0,
    };
}
