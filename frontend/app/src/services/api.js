const API_BASE = '/api';

class ApiError extends Error {
    constructor(message, status, detail) {
        super(message);
        this.status = status;
        this.detail = detail;
    }
}

async function request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const config = {
        headers: {},
        ...options,
    };

    const token = localStorage.getItem('access_token');
    if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
    }

    if (config.body && !(config.body instanceof FormData)) {
        config.headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(url, config);

    if (!response.ok) {
        let detail = null;
        try {
            detail = await response.json();
        } catch {
            // ignore
        }
        throw new ApiError(
            detail?.detail || `Request failed with status ${response.status}`,
            response.status,
            detail
        );
    }

    return response.json();
}

// ── Auth ──────────────────────────────────────────────
export async function registerUser(email, password) {
    return request('/users', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
    });
}

export async function loginUser(username, password) {
    const formData = new URLSearchParams();
    formData.append('username', username);
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
        let detail = null;
        try {
            detail = await response.json();
        } catch {
            // ignore
        }
        throw new ApiError(
            detail?.detail || 'Login failed',
            response.status,
            detail
        );
    }

    const data = await response.json();
    localStorage.setItem('access_token', data.access_token);
    return data;
}

export async function getCurrentUser() {
    return request('/users/me', { method: 'GET' });
}

export function logout() {
    localStorage.removeItem('access_token');
}

export function isAuthenticated() {
    return !!localStorage.getItem('access_token');
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

export async function uploadDocument(file) {
    const formData = new FormData();
    formData.append('file', file);
    return request('/documents/upload', {
        method: 'POST',
        body: formData,
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

export { ApiError };
