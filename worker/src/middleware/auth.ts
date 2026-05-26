import type { Context, Next } from 'hono';
import type { Env } from '../index';

/**
 * Bearer token auth middleware.
 *
 * Checks the `Authorization: Bearer <token>` header against the API_KEY secret.
 * Uses constant-time comparison to prevent timing attacks.
 *
 * Usage in index.ts:
 *   api.use('*', authMiddleware);
 *
 * For production with multiple users, replace with Cloudflare Access (SSO):
 * - Enable Access on your Workers/Pages domain
 * - Remove this middleware — Access blocks unauthenticated requests at the edge
 */
export async function authMiddleware(
  c: Context<{ Bindings: Env }>,
  next: Next
): Promise<Response | void> {
  const apiKey = c.env.API_KEY;

  // If no API_KEY is set, skip auth (useful during initial local dev)
  if (!apiKey) {
    console.warn('[auth] API_KEY not set — all requests allowed');
    return next();
  }

  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized — Bearer token required' }, 401);
  }

  const token = authHeader.slice(7);

  // Constant-time comparison to prevent timing attacks
  if (!timingSafeEqual(token, apiKey)) {
    return c.json({ error: 'Forbidden — invalid API key' }, 403);
  }

  return next();
}

/** Constant-time string comparison (prevents timing side-channel attacks). */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}
