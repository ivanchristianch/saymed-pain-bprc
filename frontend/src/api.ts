const API_BASE = import.meta.env?.VITE_API_BASE || 'http://localhost:8000/api';

export function getAuthHeaders() {
  const token = localStorage.getItem('access_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/** Clear auth state and redirect to login. */
function handleUnauthorized() {
  localStorage.removeItem('access_token');
  window.location.replace('/login');
}

/** Fallback UUID v4 generator for non-secure contexts (plain HTTP). */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-request-id': crypto.randomUUID?.() ?? generateUUID(),
    ...getAuthHeaders(),
    ...options.headers,
  } as Record<string, string>;

  // if uploading file, remove content-type so browser sets multipart boundary
  if (options.body instanceof FormData) {
    delete (headers as any)['Content-Type'];
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    handleUnauthorized();
    throw new Error('Session expired. Please log in again.');
  }

  if (!response.ok) {
    let errText = 'Server Error';
    try {
      const data = await response.json();
      errText = data.error || errText;
    } catch {
      errText = await response.text() || errText;
    }
    throw new Error(errText);
  }

  return response.json();
}
