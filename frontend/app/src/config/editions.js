/**
 * Copy that differs between the self-hosted and the hosted edition.
 *
 * Every edition-dependent string lives here rather than in a conditional inside
 * a component. Two reasons: the claims a deployment makes about privacy are
 * worth being able to read in one place and check, and a component that renders
 * `copy.signIn.headline` needs no branch to test.
 *
 * The split is only ever about self-hosting. Shared product copy stays in the
 * components; adding a string here that reads the same in both editions is a
 * sign it does not belong here.
 */

import { getConfig } from './runtime';

const COPY = {
    selfhosted: {
        signIn: {
            headline: 'Chat with your documents. Nothing leaves your machine.',
            body: 'Upload a PDF, Docky chunks and indexes it locally, then answers from it with the passages it used shown alongside.',
        },
        register: {
            headline: 'Three steps to your first answer.',
            steps: [
                {
                    title: 'Create an account',
                    body: 'Stored on your own instance, hashed with Argon2.',
                },
                {
                    title: 'Upload a document',
                    body: 'Docling chunks it, Ollama embeds it, Qdrant stores it.',
                },
                {
                    title: 'Start a chat',
                    body: 'Ask questions and read the passages behind each answer.',
                },
            ],
            note: 'Registration is rate limited per IP. Your files stay on this server.',
            mobileNote: 'Registration is rate limited per IP.',
            mobileSub: 'On your own instance. Files never leave it.',
        },
        upload: {
            dropzoneHint: 'Up to 50 MB · parsed locally',
        },
        tagline: 'Docky — smart document management',
    },

    cloud: {
        signIn: {
            headline: 'Chat with your documents. Every answer shows its sources.',
            body: 'Upload a PDF, Docky indexes it, then answers from it with the passages it used shown alongside.',
        },
        register: {
            headline: 'Three steps to your first answer.',
            steps: [
                {
                    title: 'Create an account',
                    // Argon2 is a property of the password hashing, not a claim
                    // about where anything is hosted, so it survives the split.
                    body: 'Your password is hashed with Argon2, never stored in the clear.',
                },
                {
                    title: 'Upload a document',
                    body: 'Docky parses it, splits it into passages and indexes them.',
                },
                {
                    title: 'Start a chat',
                    body: 'Ask questions and read the passages behind each answer.',
                },
            ],
            note: 'Registration is rate limited per IP.',
            mobileNote: 'Registration is rate limited per IP.',
            mobileSub: 'Ask questions about your own documents.',
        },
        upload: {
            dropzoneHint: 'Up to 50 MB · PDF',
        },
        tagline: 'Docky — smart document management',
    },
};

/** The copy for the running deployment. */
export function copy() {
    return COPY[getConfig().edition];
}

/**
 * For the rare case where the difference is structural rather than wording —
 * a whole block that only one edition shows. Prefer `copy()` where a string
 * will do.
 */
export function isSelfHosted() {
    return getConfig().edition === 'selfhosted';
}
