/**
 * Lightweight fetch wrapper around the Worker API.
 *
 * The API is always called at /api on the app's own hostname:
 *   - Local dev:   Vite proxies /api → http://localhost:8787/api
 *   - Production:  APP_DOMAIN/api/* is routed to the Worker, behind the same
 *                  Cloudflare Access login as the page (no API key, no CORS)
 *
 * When the Access session expires, Access answers API calls with a redirect to
 * its login page; the client then reloads the page so the login can run.
 */

const BASE_URL = '/api';

function headers(extra: Record<string, string> = {}): Record<string, string> {
  return { 'Content-Type': 'application/json', ...extra };
}

async function request(path: string, init: RequestInit = {}): Promise<Response> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: headers(init.headers as Record<string, string> | undefined),
    credentials: 'same-origin',
    redirect: 'manual',
  });
  // Access session expired: reload so Cloudflare Access can sign you in again
  // (at most once a minute, so a misconfiguration can't cause a reload loop)
  if (res.type === 'opaqueredirect') {
    const last = Number(sessionStorage.getItem('access_reload') ?? 0);
    if (Date.now() - last > 60_000) {
      sessionStorage.setItem('access_reload', String(Date.now()));
      window.location.reload();
    }
    throw new Error('Session expired — please reload the page to sign in again');
  }
  return res;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`API ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  /** Check the API is reachable and the Access login is valid. */
  async ping(): Promise<boolean> {
    try {
      const res = await request('/ping');
      return res.ok;
    } catch {
      return false;
    }
  },

  async get<T>(path: string): Promise<T> {
    const res = await request(path);
    return handleResponse<T>(res);
  },

  async post<T>(path: string, body?: unknown): Promise<T> {
    const res = await request(path, {
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    return handleResponse<T>(res);
  },

  async put<T>(path: string, body?: unknown): Promise<T> {
    const res = await request(path, {
      method: 'PUT',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    return handleResponse<T>(res);
  },

  async patch<T>(path: string, body?: unknown): Promise<T> {
    const res = await request(path, {
      method: 'PATCH',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    return handleResponse<T>(res);
  },

  async delete<T>(path: string, body?: unknown): Promise<T> {
    const res = await request(path, {
      method: 'DELETE',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    return handleResponse<T>(res);
  },

  /** Build a full URL (for download links, file endpoints, etc.) */
  url(path: string): string {
    return `${BASE_URL}${path}`;
  },
};
