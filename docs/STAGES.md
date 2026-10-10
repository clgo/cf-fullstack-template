# Build Stages — My App

Track every phase and its completion status here.
After each commit, update the relevant item: mark `[x]`, add commit hash, note any D1 migrations.

---

## Phase 1 — Foundation 🔄 (in progress)

- [ ] Clone/init from template
- [ ] Replace `myapp` with real app name in all files
- [ ] Create Cloudflare D1 database + R2 bucket
- [ ] Apply `schema.sql` to remote D1
- [ ] Add `APP_DOMAIN` as a Pages custom domain
- [ ] Create the Cloudflare Access application for `APP_DOMAIN`; set `ACCESS_TEAM_DOMAIN` and `ACCESS_AUD` in `wrangler.toml.example`
- [ ] Deploy Worker manually (`cd worker && npm run deploy`)
- [ ] Deploy Frontend manually (`npm run build && wrangler pages deploy dist --project-name=myapp`)
- [ ] Add GitHub Actions secrets (CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID, D1_DATABASE_ID)
- [ ] Verify auto-deploy on push to `main`
- **Last commit:** `(TBD)`
- **Branch:** `main`

---

## Phase 2 — Core Data Model ⏳ (planned)

- [ ] Define real schema in `worker/src/db/schema.sql`
- [ ] Run D1 migration + record in `schema_migrations`
- [ ] Implement CRUD routes in `worker/src/routes/`
- [ ] Implement API module in `frontend/src/api/`
- [ ] Build data pages in `frontend/src/pages/`
- **Last commit:** `(TBD)`

---

## Phase 3 — Features ⏳ (planned)

- [ ] (Add your feature checklist here)
- **Last commit:** `(TBD)`

---

**Resume instructions:** Read the first incomplete phase, check out its branch (or create from main), and start from the first unchecked item. After each commit update this file.
