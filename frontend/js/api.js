const API_BASE = window.APP_CONFIG.API_BASE_URL;

// Stale-while-revalidate cache
const _apiCache = new Map(); // path → data

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
  // Returns cached data synchronously (null if not cached)
  getCached(path) {
    return _apiCache.has(path) ? _apiCache.get(path) : null;
  },

  // Invalidate cache entries that start with prefix
  invalidate(prefix) {
    for (const key of _apiCache.keys()) {
      if (key === prefix || key.startsWith(prefix + '/')) {
        _apiCache.delete(key);
      }
    }
  },

  get: async (path) => {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: await authHeaders(false),
      cache: 'no-cache',
    });
    const data = await checkResponse(res);
    _apiCache.set(path, data);
    return data;
  },

  post: async (path, body) => {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify(body),
    });
    const data = await checkResponse(res);
    // Invalidate the collection
    api.invalidate('/' + path.split('/')[1]);
    return data;
  },

  put: async (path, body) => {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'PUT',
      headers: await authHeaders(),
      body: JSON.stringify(body),
    });
    const data = await checkResponse(res);
    api.invalidate('/' + path.split('/')[1]);
    return data;
  },

  delete: async (path) => {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'DELETE',
      headers: await authHeaders(false),
    });
    const data = await checkResponse(res);
    api.invalidate('/' + path.split('/')[1]);
    return data;
  },
};
