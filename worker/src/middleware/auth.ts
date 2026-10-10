import type { Context, Next } from 'hono';
import type { Env } from '../index';

/**
 * Cloudflare Access auth middleware.
 *
 * The app is served from one hostname (APP_DOMAIN): Pages serves the frontend
 * and this Worker answers APP_DOMAIN/api/* through a route. A Cloudflare Access
 * application on APP_DOMAIN puts a login in front of both.
 *
 * Access adds a signed JWT (`Cf-Access-Jwt-Assertion`) to every request it lets
 * through. This middleware checks that JWT, so a request that reaches the Worker
 * any other way (a workers.dev or preview URL turned back on, a new route
 * without Access, a misconfigured policy) is refused instead of served.
 *
 * It fails closed: in production, if ACCESS_TEAM_DOMAIN or ACCESS_AUD is not
 * set, every /api request gets 503. Local `wrangler dev` skips the check when
 * .dev.vars sets ENVIRONMENT=development.
 *
 * Usage in index.ts:
 *   api.use('*', accessAuth);
 */
export async function accessAuth(
  c: Context<{ Bindings: Env }>,
  next: Next
): Promise<Response | void> {
  if (c.env.ENVIRONMENT === 'development') {
    return next();
  }

  const team = normaliseTeamDomain(c.env.ACCESS_TEAM_DOMAIN);
  const aud = c.env.ACCESS_AUD?.trim();
  if (!team || !aud || aud.startsWith('REPLACE_')) {
    console.error('[auth] ACCESS_TEAM_DOMAIN / ACCESS_AUD not set — refusing all /api requests');
    return c.json({ error: 'Cloudflare Access is not configured for this API' }, 503);
  }

  const token = c.req.header('Cf-Access-Jwt-Assertion');
  if (!token) {
    return c.json({ error: 'Unauthorized — sign in through Cloudflare Access' }, 401);
  }

  try {
    const claims = await verifyAccessJwt(token, team, aud);
    if (!claims) {
      return c.json({ error: 'Unauthorized — invalid Access token' }, 401);
    }
  } catch (err) {
    console.error('[auth] Access token check failed:', err);
    return c.json({ error: 'Unauthorized — could not verify Access token' }, 401);
  }

  return next();
}

// ── Access JWT verification (RS256, keys from <team>/cdn-cgi/access/certs) ────

type AccessClaims = { aud: string | string[]; exp: number; nbf?: number; iss: string; email?: string };
type Jwk = JsonWebKey & { kid?: string };

let certCache: { team: string; keys: Jwk[]; fetchedAt: number } | null = null;
const CERT_TTL_MS = 60 * 60 * 1000;

export async function verifyAccessJwt(token: string, team: string, aud: string): Promise<AccessClaims | null> {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [headerB64, payloadB64, sigB64] = parts;

  const header = JSON.parse(decodeText(headerB64)) as { alg?: string; kid?: string };
  if (header.alg !== 'RS256') return null;

  // Re-fetch once if the key isn't cached yet (Access rotates its keys)
  let jwk = (await getKeys(team)).find((k) => k.kid === header.kid);
  if (!jwk) jwk = (await getKeys(team, true)).find((k) => k.kid === header.kid);
  if (!jwk) return null;

  const key = await crypto.subtle.importKey(
    'jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']
  );
  const valid = await crypto.subtle.verify(
    'RSASSA-PKCS1-v1_5', key, decodeBytes(sigB64), new TextEncoder().encode(`${headerB64}.${payloadB64}`)
  );
  if (!valid) return null;

  const claims = JSON.parse(decodeText(payloadB64)) as AccessClaims;
  const now = Math.floor(Date.now() / 1000);
  const auds = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
  if (!auds.includes(aud)) return null;
  if (claims.iss !== `https://${team}`) return null;
  if (typeof claims.exp !== 'number' || claims.exp < now) return null;
  if (claims.nbf && claims.nbf > now + 60) return null;
  return claims;
}

async function getKeys(team: string, refresh = false): Promise<Jwk[]> {
  if (!refresh && certCache?.team === team && Date.now() - certCache.fetchedAt < CERT_TTL_MS) {
    return certCache.keys;
  }
  const res = await fetch(`https://${team}/cdn-cgi/access/certs`);
  if (!res.ok) throw new Error(`Access certs: HTTP ${res.status}`);
  const { keys } = (await res.json()) as { keys: Jwk[] };
  certCache = { team, keys, fetchedAt: Date.now() };
  return keys;
}

/** "myteam", "myteam.cloudflareaccess.com" or "https://myteam.cloudflareaccess.com/" → "myteam.cloudflareaccess.com" */
function normaliseTeamDomain(value?: string): string | null {
  const v = value?.trim().replace(/^https?:\/\//, '').replace(/\/+$/, '');
  if (!v || v.startsWith('REPLACE_')) return null;
  return v.includes('.') ? v : `${v}.cloudflareaccess.com`;
}

function decodeBytes(b64url: string): Uint8Array {
  const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(b64url.length / 4) * 4, '=');
  return Uint8Array.from(atob(b64), (ch) => ch.charCodeAt(0));
}

function decodeText(b64url: string): string {
  return new TextDecoder().decode(decodeBytes(b64url));
}
