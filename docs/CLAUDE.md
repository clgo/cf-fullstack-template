# My App — Claude AI Master Context

You are building **My App** (replace with your app name), a full-stack application on Cloudflare.

The stack: Cloudflare Pages (frontend) · Workers (backend) · D1 (SQLite) · R2 (files) · Workers AI (LLMs).

---

## Every session you must

1. Load `PROJECT_SPECS.md` (requirements) and `TECH_STACK.md` (architecture).
2. Read `STAGES.md` to know the exact build phase and last completed commit.
3. **Never implement anything outside the active phase** unless explicitly asked.
4. After every meaningful change, update `STAGES.md` with the new commit hash and a brief progress note.
5. If the session is interrupted, the next session MUST resume from the last commit logged in `STAGES.md`.
6. **After every change, append a description to `docs/Changes.md`** — what changed, files affected, why.

---

## Docs update rules (mandatory after every change)

| File | Update when |
|------|-------------|
| `docs/Changes.md` | **Every** code change — append under the current version heading. |
| `docs/STAGES.md` | A checklist item is completed or a phase finishes. Mark `[x]`, add commit hash, note migrations. |
| `docs/PROJECT_SPECS.md` | A feature is spec'd (planned) or ships (mark implemented + version). Never leave "planned" after it ships. |
| `docs/TECH_STACK.md` | A new dependency, service, or architectural pattern is introduced. |
| `frontend/src/version.ts` | **Every** code change — increment the minor number. |

**Rule: docs are part of the commit.** Never commit code without the relevant doc updates in the same commit.

**Rule: push to GitHub after every commit.** After every `git commit`, immediately run `git push origin main`. Never leave commits unpushed.

---

## Database migration rules (mandatory)

Every D1 schema change (`ALTER TABLE`, `CREATE TABLE`, `DROP COLUMN`) **must** be recorded in `schema_migrations`. Run DDL and the INSERT in a single wrangler command:

```bash
cd worker && npx wrangler@3 d1 execute myapp-db --remote --command="
<DDL here>;
INSERT OR IGNORE INTO schema_migrations (version, description)
VALUES ('vX.XX-short-slug', 'description');
"
```

- **Version slug format:** `vX.XX-short-kebab-description`
- **Also update `worker/src/db/schema.sql`** to match (source of truth for fresh installs)
- **Document the full wrangler command in `docs/Changes.md`**

**Check migration state:**
```bash
cd worker && npx wrangler@3 d1 execute myapp-db --remote \
  --command="SELECT version, description, applied_at FROM schema_migrations ORDER BY applied_at;"
```

**Rollback:** No automatic rollback. Use `ALTER TABLE ... DROP COLUMN` (D1 supports SQLite 3.35+) or recreate from `schema.sql`. Record every rollback as its own migration entry.

---

## Strict rules

- Use **only** Cloudflare-compatible code (no Node.js `fs`, no heavy dependencies that don't run in Workers).
- Never commit secrets. Sensitive values go in `.dev.vars` (local) or `wrangler secret put` (production).
- Use conventional commits (`feat:`, `fix:`, `docs:`, `chore:`). All work committed directly to `main`.
- Provide clear, step-by-step instructions for any manual actions (deploy, migrations, secret setting).
- **After every code change, increment the minor version in `frontend/src/version.ts`.** Format: `vMAJOR.MINOR`. Only increment major on full rewrites or milestones.
- Use `lucide-react` for all icons — no Unicode symbols or ASCII art in UI.
- All interactive elements must have `transition-colors duration-150` or `transition-shadow duration-200`.
- Every new table in the UI **must** use `useSortFilter` + `SortTh` + `FilterInput`.
- **Security:** the API lives only at `APP_DOMAIN/api/*`, behind Cloudflare Access. Never set
  `workers_dev` or `preview_urls` to true, never add CORS or a second route/domain for the Worker, and
  keep `api.use('*', accessAuth)` ahead of every `/api` route. The frontend calls `/api` (same origin).
- Don't set `ENVIRONMENT=development` anywhere except `worker/.dev.vars`: it turns off the Access check.
