const API_BASE = window.APP_CONFIG.API_BASE_URL;

async function authHeaders(includeContentType = true) {
  const token = await getToken();
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (includeContentType) headers['Content-Type'] = 'application/json';
  return headers;
}

async function checkResponse(res) {
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try { const body = await res.json(); msg = body.error || msg; } catch {}
    throw new Error(msg);
  }
  if (res.status === 204) return null;
  return res.json();
}

const api = {
  get: async (path) => {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: await authHeaders(false),
      cache: 'no-cache',
    });
    return checkResponse(res);
  },
  post: async (path, body) => {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify(body),
    });
    return checkResponse(res);
  },
  put: async (path, body) => {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'PUT',
      headers: await authHeaders(),
      body: JSON.stringify(body),
    });
    return checkResponse(res);
  },
  delete: async (path) => {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'DELETE',
      headers: await authHeaders(false),
    });
    return checkResponse(res);
  },
};
