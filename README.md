# ☁️ cf-fullstack-template

A production-ready **Cloudflare full-stack app template** — bootstrap a new project in one command.

## Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18 + Vite + Tailwind CSS → **Cloudflare Pages** |
| Backend | Hono (TypeScript) → **Cloudflare Workers** |
| Database | **Cloudflare D1** (SQLite-compatible) |
| File Storage | **Cloudflare R2** |
| AI | **Cloudflare Workers AI** (free models) |
| CI/CD | GitHub Actions → auto-deploy on push to `main` |

## Quick start — `/new-cf-app` Claude skill (recommended)

If you have [Claude Code](https://claude.ai/code), use the global `/new-cf-app` skill:

```
/new-cf-app my-budget-app "My Budget App"
```

This clones this template, replaces all placeholders, creates a new GitHub repo and pushes the code.

## Quick start — shell script

```bash
git clone https://github.com/clgo/cf-fullstack-template
cd cf-fullstack-template
./create-app.sh my-budget-app "My Budget App"
```

## What gets replaced

| Placeholder | Becomes |
|-------------|---------|
| `myapp-api` | `<name>-api` (Cloudflare Worker) |
| `myapp-db` | `<name>-db` (D1 database) |
| `myapp-docs` | `<name>-docs` (R2 bucket) |
| `myapp` | `<name>` (package names, Pages project) |
| `My App` | `<display-name>` (UI + HTML title) |
| `REPLACE_WITH_APP_DOMAIN` | `APP_DOMAIN` (default `<name>.aipropfolio.com`) |
| `REPLACE_WITH_ZONE` | the Cloudflare zone, e.g. `aipropfolio.com` |

## Security model

Every app runs on **one hostname behind Cloudflare Access**:

- Pages serves the frontend on `APP_DOMAIN` (Pages → Custom domains).
- The Worker answers `APP_DOMAIN/api/*` through a route; the frontend calls `/api` (same origin, no CORS).
- A Cloudflare Access application on `APP_DOMAIN` puts a login in front of both.
- `workers_dev = false` and `preview_urls = false`, so there's no second address that skips the login.
- The Worker also checks the Access token itself (`worker/src/middleware/auth.ts`) and **fails closed**:
  until `ACCESS_TEAM_DOMAIN` and `ACCESS_AUD` are set in `wrangler.toml.example`, every `/api` request gets 503.
  Local `wrangler dev` skips the check via `ENVIRONMENT=development` in `.dev.vars`.

Earlier versions of this template put the API on `<name>-api.<account>.workers.dev` with an optional
`API_KEY` that allowed every request when unset, so the API was public even when the page was behind Access.

## GitHub Actions secrets needed (after bootstrap)

| Secret | Description |
|--------|-------------|
| `CLOUDFLARE_API_TOKEN` | API token with Worker + Pages + D1 + R2 permissions |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare Dashboard → right sidebar |
| `D1_DATABASE_ID` | UUID from `wrangler d1 create <name>-db` |

No `VITE_API_URL`: the frontend always calls `/api` on its own hostname.

## Template structure

```
.
├── create-app.sh                  # Bootstrap script (not copied to new projects)
├── .github/workflows/deploy.yml   # GitHub Actions CI/CD
├── worker/                        # Cloudflare Worker (Hono + TypeScript)
│   ├── src/index.ts               # App entry + D1/R2/AI bindings
│   ├── src/middleware/auth.ts     # Cloudflare Access token check (fails closed)
│   ├── src/db/schema.sql          # D1 schema + migrations tracker
│   ├── src/routes/items.ts        # Example CRUD route
│   └── wrangler.toml.example      # Config template (committed; real IDs gitignored)
├── frontend/                      # React 18 + Vite + Tailwind SPA
│   └── src/
│       ├── api/client.ts          # Fetch wrapper (same-origin /api)
│       ├── components/            # Layout, Modal, StatCard
│       ├── hooks/useSortFilter    # Sort + filter for tables
│       └── pages/                 # Dashboard + Items example pages
└── docs/                          # Living documentation
    ├── CLAUDE.md                  # AI assistant context + rules
    ├── Changes.md                 # Canonical changelog
    ├── STAGES.md                  # Build phases tracker
    ├── PROJECT_SPECS.md           # Feature requirements
    └── TECH_STACK.md              # Architecture + design tokens
```

---

Made with ❤️ for Cloudflare's free tier.
