/**
 * Lightweight fetch wrapper around the Worker API.
 *
 * Base URL:
 *   - Local dev:   Vite proxies /api → http://localhost:8787/api (no VITE_API_URL needed)
 *   - Production:  VITE_API_URL is the base Worker URL (e.g. https://myapp-api.xxx.workers.dev)
 *                  This client appends /api automatically.
 *
 * Auth:
 *   - Reads API_KEY from localStorage (set during login or hardcoded for single-user apps)
 *   - Set to empty string if you've switched to Cloudflare Access (no client-side auth needed)
 */

const BASE_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api';

function getApiKey(): string {
  return localStorage.getItem('api_key') ?? '';
}

function headers(extra: Record<string, string> = {}): Record<string, string> {
  const apiKey = getApiKey();
  return {
    'Content-Type': 'application/json',
    ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
    ...extra,
  };
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`API ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  /** Set the API key in localStorage (call after login). */
  setApiKey(key: string) {
    if (key) {
      localStorage.setItem('api_key', key);
    } else {
      localStorage.removeItem('api_key');
    }
  },

  /** Verify the API key is valid (pings the server). */
  async ping(): Promise<boolean> {
    try {
      const res = await fetch(`${BASE_URL}/ping`, { headers: headers() });
      return res.ok;
    } catch {
      return false;
    }
  },

  async get<T>(path: string): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`, { headers: headers() });
    return handleResponse<T>(res);
  },

  async post<T>(path: string, body?: unknown): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: headers(),
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    return handleResponse<T>(res);
  },

  async put<T>(path: string, body?: unknown): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'PUT',
      headers: headers(),
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    return handleResponse<T>(res);
  },

  async patch<T>(path: string, body?: unknown): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'PATCH',
      headers: headers(),
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    return handleResponse<T>(res);
  },

  async delete<T>(path: string, body?: unknown): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'DELETE',
      headers: headers(),
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    return handleResponse<T>(res);
  },

  /** Build a full URL (for download links, file endpoints, etc.) */
  url(path: string): string {
    return `${BASE_URL}${path}`;
  },
};
