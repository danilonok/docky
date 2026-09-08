/**
 * Deployment configuration, read at runtime rather than baked at build time.
 *
 * Vite would inline an `import.meta.env.VITE_*` value into the bundle, which
 * would mean one image per edition and a rebuild to change one. Instead the
 * container writes `/config.json` from its environment on start, so the same
 * image serves either edition and the switch is a variable on the deployment.
 */

/**
 * The edition a deployment falls back to when configuration cannot be read.
 *
 * Deliberately the neutral one. The self-hosted copy makes promises – nothing
 * leaves your machine, your files stay on this server – that are reassuring
 * when true and a lie when not. Showing neutral copy on a self-hosted instance
 * understates it; showing self-hosted copy on a hosted one misleads the user
 * about where their documents went. Only the first mistake is safe to make by
 * accident, so self-hosting has to be claimed explicitly.
 */
const FALLBACK_EDITION = 'cloud';

export const EDITIONS = ['selfhosted', 'cloud'];

let config = null;

/**
 * Fetch `/config.json` once, before the app renders.
 *
 * Never rejects: a deployment that cannot serve its own configuration should
 * still show a working login page, just without the self-hosted claims.
 */
export async function loadConfig() {
    let edition = FALLBACK_EDITION;

    try {
        const response = await fetch('/config.json', { cache: 'no-store' });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const parsed = await response.json();
        if (EDITIONS.includes(parsed?.edition)) {
            edition = parsed.edition;
        } else {
            console.warn(
                `Unknown edition ${JSON.stringify(parsed?.edition)}; using "${FALLBACK_EDITION}".`,
            );
        }
    } catch (error) {
        console.warn(`Could not read /config.json; using "${FALLBACK_EDITION}".`, error);
    }

    config = { edition };
    return config;
}

/**
 * The resolved configuration.
 *
 * Synchronous on purpose – `loadConfig` is awaited before the first render, so
 * components read copy without a loading branch in every one of them.
 */
export function getConfig() {
    if (!config) {
        throw new Error('getConfig() called before loadConfig() resolved.');
    }
    return config;
}

/** Test seam and dev escape hatch; the app itself goes through `loadConfig`. */
export function setConfig(next) {
    config = next;
}
