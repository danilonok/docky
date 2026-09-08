/**
 * What the upload flow accepts, and how it describes a file.
 *
 * These limits are enforced here and nowhere else: the API stores whatever it
 * is handed, with no size cap and no content-type check. Checking in the browser
 * spares the user a slow upload that was never going to index, but it is a
 * courtesy, not a guarantee — the server needs its own limits.
 */

export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;

// The parsers read PDFs. Docling can handle more formats than pypdfium, but a
// deployment can be configured either way and the narrower set is the safe one.
export const ACCEPTED_EXTENSIONS = ['.pdf'];
export const ACCEPT_ATTRIBUTE = 'application/pdf,.pdf';

export function formatBytes(bytes) {
    if (!Number.isFinite(bytes)) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Returns a reason the file cannot be uploaded, or null if it can. */
export function rejectionReason(file) {
    const name = file.name ?? '';
    const extension = name.slice(name.lastIndexOf('.')).toLowerCase();

    if (!ACCEPTED_EXTENSIONS.includes(extension)) {
        return `Only PDF files can be indexed. “${name}” is not one.`;
    }

    if (file.size > MAX_UPLOAD_BYTES) {
        const size = formatBytes(file.size);
        const limit = formatBytes(MAX_UPLOAD_BYTES);
        // Just over the limit rounds to the same label, and "50.0 MB is over
        // the 50.0 MB limit" reads as a bug rather than a rule.
        return size === limit
            ? `This file is just over the ${limit} limit.`
            : `${size} is over the ${limit} limit.`;
    }

    if (file.size === 0) {
        return 'This file is empty.';
    }

    return null;
}
