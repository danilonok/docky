const API_BASE = '/api';

const TOKEN_KEY = 'access_token';

class ApiError extends Error {
    constructor(message, status, detail) {
        super(message);
        this.status = status;
        this.detail = detail;
    }
}

/**
 * Turn an error payload into a sentence worth showing.
 *
 * The API speaks in three shapes and only one of them is a plain string:
 * `{detail: "..."}` from an HTTPException, `{detail: [...]}` from request
 * validation — which is how the server's own password rules come back — and
 * `{error: "..."}` from the rate limiter. Reading only the first left the other
 * two rendering as "[object Object]" or a bare status code.
 */
function formatError(payload, status, retryAfter) {
    if (status === 429) {
        const seconds = Number(retryAfter);
        return Number.isFinite(seconds) && seconds > 0
            ? `Too many attempts. Try again in ${seconds} second${seconds === 1 ? '' : 's'}.`
            : 'Too many attempts. Try again in a minute.';
    }

    const detail = payload?.detail;

    if (typeof detail === 'string') return detail;

    if (Array.isArray(detail)) {
        const messages = detail
            .map((item) => item?.msg)
            .filter(Boolean)
            // Pydantic prefixes its own validators; the user did not write one.
            .map((message) => message.replace(/^Value error,\s*/, ''));
        if (messages.length > 0) return messages.join(' ');
    }

    if (typeof payload?.error === 'string') return payload.error;

    return `Request failed with status ${status}`;
}

/**
 * Where the access token lives.
 *
 * localStorage when the user asked to stay signed in, sessionStorage otherwise —
 * which is what makes "Keep me signed in" mean anything: without it the token
 * outlives the browser session whether or not the box was ticked. Reads check
 * both, so a session either way is found.
 */
function readToken() {
    try {
        return localStorage.getItem(TOKEN_KEY) ?? sessionStorage.getItem(TOKEN_KEY);
    } catch {
        // Private modes and blocked site data throw on access rather than
        // returning null. An unauthenticated app is better than a broken one.
        return null;
    }
}

function writeToken(token, persist) {
    try {
        clearToken();
        (persist ? localStorage : sessionStorage).setItem(TOKEN_KEY, token);
    } catch {
        // Nothing stored means the next request is unauthenticated, which the
        // app already handles by sending the user back to sign in.
    }
}

function clearToken() {
    try {
        localStorage.removeItem(TOKEN_KEY);
        sessionStorage.removeItem(TOKEN_KEY);
    } catch {
        // Ignore: see writeToken.
    }
}

async function request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const config = {
        headers: {},
        ...options,
    };

    const token = readToken();
    if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
    }

    if (config.body && !(config.body instanceof FormData)) {
        config.headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(url, config);

    if (!response.ok) {
        let payload = null;
        try {
            payload = await response.json();
        } catch {
            // ignore
        }
        throw new ApiError(
            formatError(payload, response.status, response.headers.get('Retry-After')),
            response.status,
            payload
        );
    }

    // 204 has no body to parse, and several endpoints answer with one.
    if (response.status === 204) return null;

    return response.json();
}

// ── Auth ──────────────────────────────────────────────
export async function registerUser(email, password) {
    return request('/users', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
    });
}

/**
 * Exchange credentials for a token.
 *
 * OAuth2 calls the field `username`; this deployment authenticates by email, so
 * that is what goes in it. The name is the spec's, not the product's.
 */
export async function loginUser(email, password, { persist = true } = {}) {
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);
    formData.append('grant_type', 'password');

    const response = await fetch(`${API_BASE}/token`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData,
    });

    if (!response.ok) {
        let payload = null;
        try {
            payload = await response.json();
        } catch {
            // ignore
        }
        throw new ApiError(
            formatError(payload, response.status, response.headers.get('Retry-After')),
            response.status,
            payload
        );
    }

    const data = await response.json();
    writeToken(data.access_token, persist);
    return data;
}

export async function getCurrentUser() {
    return request('/users/me', { method: 'GET' });
}

export function logout() {
    clearToken();
}

export function isAuthenticated() {
    return !!readToken();
}

// ── Chats ─────────────────────────────────────────────
export async function getChats(offset = 0, limit = 100) {
    return request(`/chats?offset=${offset}&limit=${limit}`, { method: 'GET' });
}

export async function getChat(chatId) {
    return request(`/chats/${chatId}`, { method: 'GET' });
}

export async function createChat(title, userIds = []) {
    return request(`/chats?title=${encodeURIComponent(title)}`, {
        method: 'POST',
        body: JSON.stringify(userIds),
    });
}

export async function deleteChat(chatId) {
    return request(`/chats/${chatId}`, { method: 'DELETE' });
}

// ── Messages ──────────────────────────────────────────
export async function getMessages(chatId, offset = 0, limit = 100) {
    return request(`/messages?chatId=${chatId}&offset=${offset}&limit=${limit}`, { method: 'GET' });
}

export async function sendMessage(chatId, content) {
    return request(`/messages?chatId=${chatId}&content=${encodeURIComponent(content)}`, {
        method: 'POST',
    });
}

export async function deleteMessage(messageId) {
    return request(`/messages?messageId=${messageId}`, { method: 'DELETE' });
}

// ── Documents ─────────────────────────────────────────
export async function getDocuments() {
    return request('/documents', { method: 'GET' });
}

/**
 * Upload a file, reporting how much of it has gone.
 *
 * XMLHttpRequest rather than fetch, for the one thing fetch cannot do: report
 * request upload progress. This is also the only percentage in the whole flow
 * that is real — indexing afterwards reports a state and nothing finer — so it
 * is worth the older API to have it.
 *
 * Resolves with the created document, whose id the caller needs to attach it.
 */
export function uploadDocument(file, { onProgress, signal } = {}) {
    return new Promise((resolve, reject) => {
        const request_ = new XMLHttpRequest();
        request_.open('POST', `${API_BASE}/documents/upload`);

        const token = readToken();
        if (token) request_.setRequestHeader('Authorization', `Bearer ${token}`);

        request_.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable && onProgress) {
                onProgress((event.loaded / event.total) * 100);
            }
        });

        request_.addEventListener('load', () => {
            let payload = null;
            try {
                payload = JSON.parse(request_.responseText);
            } catch {
                // A non-JSON body on an error is still an error worth reporting.
            }

            if (request_.status >= 200 && request_.status < 300) {
                resolve(payload);
                return;
            }

            reject(
                new ApiError(
                    formatError(payload, request_.status, request_.getResponseHeader('Retry-After')),
                    request_.status,
                    payload,
                ),
            );
        });

        request_.addEventListener('error', () =>
            reject(new ApiError('Upload failed — the connection dropped.', 0, null)),
        );
        request_.addEventListener('abort', () =>
            reject(new ApiError('Upload cancelled.', 0, null)),
        );

        if (signal) {
            signal.addEventListener('abort', () => request_.abort(), { once: true });
        }

        const formData = new FormData();
        formData.append('file', file);
        request_.send(formData);
    });
}

export async function getChatDocuments(chatId) {
    return request(`/chats/${chatId}/documents`, { method: 'GET' });
}

export async function addDocumentToChat(documentId, chatId) {
    return request(`/chats/${chatId}/documents?documentId=${documentId}`, {
        method: 'POST',
    });
}

export async function deleteChatDocuments(chatId) {
    return request(`/chats/${chatId}/documents`, { method: 'DELETE' });
}

// ── Deployment ────────────────────────────────────────
export async function getServerInfo() {
    return request('/meta', { method: 'GET' });
}

export async function getTaskStatus(taskId) {
    return request(`/tasks/${taskId}`, { method: 'GET' });
}

export { ApiError };
