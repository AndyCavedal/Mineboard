const API_BASE = window.APP_CONFIG.API_BASE_URL;

async function authHeaders(includeContentType = true) {
  const token = await getToken();
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (includeContentType) headers['Content-Type'] = 'application/json';
  return headers;
}

const api = {
  get: async (path) => {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: await authHeaders(false),
      cache: 'no-cache',
    });
    return res.json();
  },
  post: async (path, body) => {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify(body),
    });
    return res.json();
  },
  put: async (path, body) => {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'PUT',
      headers: await authHeaders(),
      body: JSON.stringify(body),
    });
    return res.json();
  },
  delete: async (path) => {
    return fetch(`${API_BASE}${path}`, {
      method: 'DELETE',
      headers: await authHeaders(false),
    });
  },
};
