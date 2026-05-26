# Tech Stack — My App

## Architecture

```
[Browser (React + Vite)]
        │
        ▼
[Cloudflare Pages]   ← auto-deploy from GitHub main via GitHub Actions
        │
        ▼ HTTPS /api/*
[Cloudflare Worker (Hono)]
        │
        ├─► [D1 (SQLite)]         — structured data
        ├─► [R2 (S3-compatible)]  — file storage
        └─► [Workers AI]          — free LLM inference
```

---

## Frontend

| Tech | Version | Purpose |
|------|---------|---------|
| React | 18.x | UI framework |
| Vite | 6.x | Build tool + dev server |
| Tailwind CSS | 3.x | Utility-first styling |
| lucide-react | latest | Icon library |
| react-router-dom | 6.x | Client-side routing |
| recharts | 3.x | Charts (optional) |

### Design Tokens

| Role | Tailwind token | Usage |
|------|---------------|-------|
| Sidebar background | `slate-900` | Dark fixed sidebar |
| Sidebar hover | `slate-700/60` | Nav item hover state |
| Primary accent | `violet-600` | Active nav, buttons, focus rings |
| Page background | `slate-50` | Main content area |
| Card background | `white` | All content cards |
| Positive value | `emerald-*` | Growth, success |
| Negative value | `rose-*` | Errors, loss |
| Warning | `amber-*` | Caution states |
| Info | `sky-*` | Informational |

### Component Conventions

- **Sidebar**: Fixed dark (`slate-900`) left panel, `w-56`. Violet `violet-600` pill for active state.
- **StatCard**: White card with 4px left border accent (`border-l-4`). Icon in soft tinted box top-right.
- **Buttons (primary)**: `bg-violet-600 hover:bg-violet-700 text-white rounded-lg shadow-sm`
- **Buttons (secondary)**: `bg-slate-50 border border-slate-200`
- **Destructive**: `border-rose-200 text-rose-500 hover:bg-rose-50`
- **Loading**: `border-t-violet-500 animate-spin` spinner, centered
- **Empty state**: Centered icon in tinted box, descriptive subtext, primary CTA
- **Tables**: Always use `useSortFilter` + `SortTh` + `FilterInput`
- **Modals**: Use `Modal` component with optional `footer` prop for pinned actions

### Responsive Layout

- Sidebar: `hidden md:flex` on desktop, hamburger overlay on mobile
- Grids: `sm:grid-cols-2` or `sm:grid-cols-4` with single-column fallback

---

## Backend

| Tech | Purpose |
|------|---------|
| Cloudflare Workers | Serverless runtime |
| Hono | TypeScript web framework (Cloudflare-native) |
| TypeScript 5.x | Type safety throughout |

### Auth

- **Default**: Bearer token (`API_KEY` secret) — single-user or internal apps
- **Production multi-user**: Cloudflare Access (SSO at the network edge)

---

## Database — Cloudflare D1

- SQLite-compatible, managed by Cloudflare
- Query via D1 client bindings; raw SQL
- Schema source of truth: `worker/src/db/schema.sql`
- All migrations tracked in `schema_migrations` table

---

## File Storage — Cloudflare R2

- S3-compatible, managed by Cloudflare
- Presigned uploads or direct multipart POST to Worker
- Files stored with structured key prefixes

---

## AI — Cloudflare Workers AI (Free Models)

| Model | Use case |
|-------|----------|
| `@cf/meta/llama-3.1-70b-instruct` | Best quality, default |
| `@cf/meta/llama-3.2-3b-instruct` | Fastest |
| `@hf/mistral/mistral-7b-instruct-v0.2` | Balanced (note `@hf/` prefix) |
| `@cf/google/gemma-7b-it` | Multilingual |

Paid model option: OpenAI API via `OPENAI_API_KEY` secret.

---

## CI/CD

- GitHub Actions: `.github/workflows/deploy.yml`
- Triggers: every push to `main` + manual `workflow_dispatch`
- **Worker deploy**: `npm run deploy` (wrangler v3.114.17 pinned to avoid v4 CI issues)
  - `wrangler.toml` generated in CI from `wrangler.toml.example` + `D1_DATABASE_ID` secret
- **Frontend deploy**: `npm run build` with `VITE_API_URL` injected → `wrangler pages deploy`
- `VITE_API_URL` = base Worker URL (e.g. `https://myapp-api.xxx.workers.dev`); the client appends `/api`

---

## Conventions

- TypeScript throughout (strict mode)
- Conventional commits (`feat:`, `fix:`, `docs:`, `chore:`)
- Secrets: `.dev.vars` for local dev, `wrangler secret put` for production
- Version: `vMAJOR.MINOR` in `frontend/src/version.ts` — bump minor on every change

---

## Project Structure

```
worker/
  src/
    index.ts           # Hono app entry + cron handlers
    middleware/
      auth.ts          # Bearer token auth
    db/
      schema.sql       # D1 schema (source of truth)
    routes/
      items.ts         # Example CRUD route

frontend/
  src/
    api/
      client.ts        # Fetch wrapper
      items.ts         # Resource-specific API
    components/
      Layout.tsx        # App shell (sidebar + outlet)
      Modal.tsx         # Reusable dialog
      StatCard.tsx      # Metric summary card
    hooks/
      useSortFilter.tsx # Sort + filter hook for tables
    pages/
      DashboardPage.tsx
      ItemsPage.tsx
    App.tsx
    version.ts
```
