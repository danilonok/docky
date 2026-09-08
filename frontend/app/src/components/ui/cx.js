/**
 * Join class names, dropping anything falsy.
 *
 * A conditional class is the single most common thing these components do, and
 * this is the whole of what `clsx` would be used for here. Not worth a dependency.
 */
export function cx(...parts) {
    return parts.filter(Boolean).join(' ');
}
