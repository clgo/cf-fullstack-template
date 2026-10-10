import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { accessAuth } from './middleware/auth';
import itemsRoute from './routes/items';

// ── Env bindings ──────────────────────────────────────────────────────────────
// These match the bindings declared in wrangler.toml
export type Env = {
  // D1 database
  DB: D1Database;
  // R2 bucket for file storage
  BUCKET: R2Bucket;
  // Workers AI (free models — no API key needed)
  AI: Ai;
  // Non-secret vars (wrangler.toml [vars])
  ENVIRONMENT?: string;
  CRON_ENABLED?: string;
  // Cloudflare Access (wrangler.toml [vars]; see middleware/auth.ts)
  ACCESS_TEAM_DOMAIN?: string;
  ACCESS_AUD?: string;
  // Secrets (set via `wrangler secret put` or .dev.vars)
  OPENAI_API_KEY?: string;
};

// ── App ───────────────────────────────────────────────────────────────────────
const app = new Hono<{ Bindings: Env }>();

// Global middleware
// No CORS: the frontend calls /api on its own hostname (same origin), so other
// sites can't call this API from a browser.
app.use('*', logger());

// Public health check (no auth)
app.get('/', (c) =>
  c.json({
    name: 'myapp-api',
    version: '0.1.0',
    status: 'ok',
    environment: c.env.ENVIRONMENT ?? 'development',
  })
);

// ── API routes (protected by Cloudflare Access) ───────────────────────────────
const api = new Hono<{ Bindings: Env }>();

// Every /api/* route requires a valid Cloudflare Access login
api.use('*', accessAuth);

api.get('/ping', (c) =>
  c.json({ message: 'pong', timestamp: new Date().toISOString() })
);

// Example AI endpoint using Workers AI (free)
api.post('/ai/generate', async (c) => {
  const { prompt } = await c.req.json<{ prompt: string }>();
  if (!prompt) return c.json({ error: 'prompt is required' }, 400);

  const response = await c.env.AI.run('@cf/meta/llama-3.1-70b-instruct', {
    messages: [{ role: 'user', content: prompt }],
  });

  return c.json({ result: response });
});

// Mount route modules
api.route('/items', itemsRoute);

// Mount API under /api prefix
app.route('/api', api);

// ── Cron handlers ─────────────────────────────────────────────────────────────
export default {
  fetch: app.fetch,

  async scheduled(event: ScheduledEvent, env: Env): Promise<void> {
    if (env.CRON_ENABLED === 'false') {
      console.log('[cron] Skipped — CRON_ENABLED=false');
      return;
    }

    switch (event.cron) {
      // Daily job example — runs at 16:00 UTC (00:00 SGT)
      case '0 16 * * *': {
        console.log('[cron] Running daily job...');
        // TODO: implement your daily logic here
        // e.g. fetch & process data, send notifications, etc.
        break;
      }

      // Monthly job example — runs on the 1st at 01:00 UTC
      case '0 1 1 * *': {
        const now = new Date(event.scheduledTime);
        const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const period = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}`;
        console.log(`[cron] Running monthly job for period: ${period}`);
        // TODO: implement your monthly logic here
        break;
      }

      default:
        console.warn(`[cron] No handler for schedule: ${event.cron}`);
    }
  },
};
