const BASE = import.meta.env.VITE_API_URL || 'http://localhost:4001';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (res.status === 401) {
    const err = new Error('Unauthorized');
    err.unauthorized = true;
    throw err;
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  session: () => request('/api/session'),
  login: (pin) => request('/api/login', { method: 'POST', body: JSON.stringify({ pin }) }),
  logout: () => request('/api/logout', { method: 'POST' }),

  listEntries: (params = {}) => {
    const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v)).toString();
    return request(`/api/entries${qs ? `?${qs}` : ''}`);
  },
  createEntry: (data) => request('/api/entries', { method: 'POST', body: JSON.stringify(data) }),
  updateEntry: (id, data) => request(`/api/entries/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteEntry: (id) => request(`/api/entries/${id}`, { method: 'DELETE' }),

  listTags: () => request('/api/tags'),
  createTag: (name, color) => request('/api/tags', { method: 'POST', body: JSON.stringify({ name, color }) }),
  deleteTag: (id) => request(`/api/tags/${id}`, { method: 'DELETE' }),

  attachmentUrl: (id) => `${BASE}/api/attachments/${id}`,
  deleteAttachment: (id) => request(`/api/attachments/${id}`, { method: 'DELETE' }),
};
