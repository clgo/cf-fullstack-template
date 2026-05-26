#!/usr/bin/env bash
# =============================================================================
# create-app.sh — Bootstrap a new Cloudflare full-stack app from this template
# =============================================================================
#
# Usage:
#   ./create-app.sh <app-name> [display-name] [output-dir]
#
# Arguments:
#   app-name      Kebab-case identifier used in all Cloudflare resource names,
#                 package names, and wrangler config.
#                 Example: my-budget-app
#
#   display-name  (Optional) Human-readable title for the UI + HTML title.
#                 Defaults to title-cased app-name.
#                 Example: "My Budget App"   ← quote if it contains spaces
#
#   output-dir    (Optional) Where to create the new project.
#                 Defaults to <current-working-directory>/<app-name>.
#                 Example: ~/projects/my-budget-app
#
# Examples:
#   ./create-app.sh my-budget-app
#   ./create-app.sh my-budget-app "My Budget App"
#   ./create-app.sh my-budget-app "My Budget App" ~/projects/my-budget-app
#
# What it does:
#   1. Copies this template (excluding itself) to output-dir
#   2. Replaces all 'myapp' / 'My App' placeholders with your names
#   3. Applies Cloudflare naming: <name>-api · <name>-db · <name>-docs
#   4. Initialises a git repo + first commit
#   5. (Optional) Creates a GitHub repo and pushes — requires `gh` CLI
# =============================================================================

set -euo pipefail

# ── Colours ───────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; RESET='\033[0m'

info()    { echo -e "${CYAN}▶ $*${RESET}"; }
success() { echo -e "${GREEN}✓ $*${RESET}"; }
warn()    { echo -e "${YELLOW}⚠ $*${RESET}"; }
error()   { echo -e "${RED}✗ $*${RESET}" >&2; exit 1; }
header()  { echo -e "\n${BOLD}$*${RESET}"; }

# ── Parse & validate arguments ────────────────────────────────────────────────
APP_NAME="${1:-}"
DISPLAY_NAME="${2:-}"
OUTPUT_DIR="${3:-}"

if [[ -z "$APP_NAME" ]]; then
  echo ""
  echo "  ${BOLD}Cloudflare App Bootstrapper${RESET}"
  echo "  Template: https://github.com/clgo/cf-fullstack-template"
  echo ""
  echo "  Usage: $0 <app-name> [display-name] [output-dir]"
  echo ""
  echo "  Examples:"
  echo "    $0 my-budget-app"
  echo "    $0 my-budget-app \"My Budget App\""
  echo "    $0 my-budget-app \"My Budget App\" ~/projects/my-budget-app"
  echo ""
  exit 1
fi

# Validate: app-name must be lowercase kebab-case
if ! [[ "$APP_NAME" =~ ^[a-z][a-z0-9-]*[a-z0-9]$|^[a-z]$ ]]; then
  error "app-name must be lowercase letters, digits, and hyphens (e.g. my-cool-app)"
fi

# Auto-generate display name: my-budget-app → My Budget App
if [[ -z "$DISPLAY_NAME" ]]; then
  DISPLAY_NAME="$(echo "$APP_NAME" | sed 's/-/ /g' | \
    awk '{for(i=1;i<=NF;i++) $i=toupper(substr($i,1,1)) tolower(substr($i,2)); print}')"
fi

# SCRIPT_DIR = the root of the cloned template repo (where this script lives)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Default output: <current-working-directory>/<app-name>
if [[ -z "$OUTPUT_DIR" ]]; then
  OUTPUT_DIR="${PWD}/${APP_NAME}"
fi
OUTPUT_DIR="${OUTPUT_DIR/#\~/$HOME}"
OUTPUT_DIR="$(realpath -m "$OUTPUT_DIR" 2>/dev/null || echo "$OUTPUT_DIR")"

# ── Cloudflare resource names ─────────────────────────────────────────────────
WORKER_NAME="${APP_NAME}-api"
DB_NAME="${APP_NAME}-db"
BUCKET_NAME="${APP_NAME}-docs"
PAGES_PROJECT="${APP_NAME}"

# ── Preview ───────────────────────────────────────────────────────────────────
header "Creating: ${APP_NAME}"
echo ""
echo "  Display name  : ${DISPLAY_NAME}"
echo "  Output dir    : ${OUTPUT_DIR}"
echo "  Worker        : ${WORKER_NAME}"
echo "  D1 database   : ${DB_NAME}"
echo "  R2 bucket     : ${BUCKET_NAME}"
echo "  Pages project : ${PAGES_PROJECT}"
echo ""

if [[ -d "$OUTPUT_DIR" ]]; then
  warn "Output directory already exists: $OUTPUT_DIR"
  read -r -p "  Overwrite? [y/N] " confirm
  [[ "$confirm" =~ ^[Yy]$ ]] || { echo "Aborted."; exit 0; }
  rm -rf "$OUTPUT_DIR"
fi

# ── Step 1: Copy template ─────────────────────────────────────────────────────
header "Step 1/4 — Copying template files"
mkdir -p "$OUTPUT_DIR"

rsync -a \
  --exclude='create-app.sh' \
  --exclude='.git' \
  --exclude='node_modules' \
  --exclude='dist' \
  --exclude='*.tsbuildinfo' \
  "${SCRIPT_DIR}/" "${OUTPUT_DIR}/"

success "Copied template to ${OUTPUT_DIR}"

# ── Step 2: Replace placeholders ─────────────────────────────────────────────
header "Step 2/4 — Replacing placeholders"

# Portable in-place sed (macOS BSD sed vs Linux GNU sed)
_sed() {
  if sed --version 2>&1 | grep -q GNU 2>/dev/null; then
    sed -i "$@"
  else
    sed -i '' "$@"
  fi
}

TEXT_FILES_LIST="$(mktemp)"
find "$OUTPUT_DIR" -type f \
  ! -path "*/node_modules/*" \
  ! -path "*/.git/*" \
  ! -path "*/dist/*" \
  ! -name "*.png" ! -name "*.jpg" ! -name "*.ico" \
  ! -name "*.woff" ! -name "*.woff2" ! -name "*.ttf" \
  2>/dev/null > "$TEXT_FILES_LIST"

# Order matters: compound forms before bare 'myapp'
while IFS= read -r f; do
  _sed \
    -e "s|myapp-api|${WORKER_NAME}|g" \
    -e "s|myapp-db|${DB_NAME}|g" \
    -e "s|myapp-docs|${BUCKET_NAME}|g" \
    -e "s|myapp-frontend|${APP_NAME}-frontend|g" \
    -e "s|myapp-worker|${APP_NAME}-worker|g" \
    -e "s|myapp|${APP_NAME}|g" \
    -e "s|My App|${DISPLAY_NAME}|g" \
    "$f"
done < "$TEXT_FILES_LIST"

success "Replaced all placeholders"

# Remove ⚠️ change-hint comments from config files
while IFS= read -r f; do
  _sed -e '/⚠️.*Change/d' "$f"
done < "$TEXT_FILES_LIST"
rm -f "$TEXT_FILES_LIST"

success "Cleaned up template hint comments"

# ── Step 3: Initialise git ────────────────────────────────────────────────────
header "Step 3/4 — Initialising git repository"
cd "$OUTPUT_DIR"
git init -q
git add .
git commit -q -m "chore: init ${APP_NAME} from cf-fullstack-template"
success "Git repo initialised with first commit"

# ── Step 4: GitHub repo (optional, requires gh CLI) ──────────────────────────
header "Step 4/4 — GitHub repository"

GH_REPO_URL=""

if ! command -v gh &>/dev/null; then
  warn "gh CLI not found — skipping GitHub repo creation."
  warn "Install: https://cli.github.com  then re-run: gh auth login"
elif ! gh auth status &>/dev/null 2>&1; then
  warn "gh CLI not authenticated. Run: gh auth login"
  warn "Then create the repo manually: gh repo create ${APP_NAME} --private --source=. --push"
else
  echo ""
  read -r -p "  Create a GitHub repo for '${APP_NAME}'? [Y/n] " create_gh
  create_gh="${create_gh:-Y}"

  if [[ "$create_gh" =~ ^[Yy]$ ]]; then
    echo ""
    echo "  Visibility:"
    echo "  [1] private  (default — recommended while setting up)"
    echo "  [2] public"
    read -r -p "  Choice [1/2]: " vis_choice
    vis_choice="${vis_choice:-1}"

    VISIBILITY="private"
    [[ "$vis_choice" == "2" ]] && VISIBILITY="public"

    GH_USER="$(gh api user -q .login 2>/dev/null || echo '')"

    info "Creating ${VISIBILITY} GitHub repo: ${GH_USER}/${APP_NAME}"
    gh repo create "${APP_NAME}" \
      "--${VISIBILITY}" \
      --description "${DISPLAY_NAME} — built on cf-fullstack-template" \
      --source="${OUTPUT_DIR}" \
      --remote=origin \
      --push

    GH_REPO_URL="https://github.com/${GH_USER}/${APP_NAME}"
    success "GitHub repo created: ${GH_REPO_URL}"
  else
    warn "Skipped. You can create it later:"
    echo "  cd ${OUTPUT_DIR}"
    echo "  gh repo create ${APP_NAME} --private --source=. --push"
  fi
fi

# ── Done ──────────────────────────────────────────────────────────────────────
echo ""
echo "  ┌──────────────────────────────────────────────────────────────────┐"
echo "  │  ✅  ${BOLD}${APP_NAME}${RESET} is ready!${RESET}"
echo "  └──────────────────────────────────────────────────────────────────┘"
echo ""
echo "  ${BOLD}Project location:${RESET}  ${OUTPUT_DIR}"
[[ -n "$GH_REPO_URL" ]] && echo "  ${BOLD}GitHub:${RESET}           ${GH_REPO_URL}"
echo ""
echo "  ${BOLD}Next steps:${RESET}"
echo ""
echo "  ${CYAN}1. Create Cloudflare resources${RESET}"
echo "     wrangler d1 create ${DB_NAME}"
echo "     wrangler r2 bucket create ${BUCKET_NAME}"
echo ""
echo "  ${CYAN}2. Edit worker/wrangler.toml.example${RESET}"
echo "     Paste the database_id from step 1 → REPLACE_WITH_YOUR_D1_DATABASE_ID"
echo "     Then: cp worker/wrangler.toml.example worker/wrangler.toml"
echo ""
echo "  ${CYAN}3. Apply schema to remote D1${RESET}"
echo "     cd worker"
echo "     npx wrangler@3 d1 execute ${DB_NAME} --remote --file=src/db/schema.sql"
echo ""
echo "  ${CYAN}4. Set Worker secrets${RESET}"
echo "     npx wrangler@3 secret put API_KEY"
echo ""
echo "  ${CYAN}5. Local dev${RESET}"
echo "     Terminal 1:  cd worker   && npm install && npm run dev"
echo "     Terminal 2:  cd frontend && npm install && npm run dev"
echo ""
echo "  ${CYAN}6. Add 4 GitHub Actions secrets${RESET}  (Settings → Secrets → Actions)"
printf "     %-28s %s\n" "CLOUDFLARE_API_TOKEN"  "← Create at dash.cloudflare.com/profile/api-tokens"
printf "     %-28s %s\n" "CLOUDFLARE_ACCOUNT_ID" "← Cloudflare Dashboard → right sidebar"
printf "     %-28s %s\n" "D1_DATABASE_ID"        "← UUID from step 1"
printf "     %-28s %s\n" "VITE_API_URL"          "← https://${WORKER_NAME}.YOUR_ACCOUNT.workers.dev"
echo ""
echo "  ${GREEN}${BOLD}After that, every push to main auto-deploys Worker + Pages. ✓${RESET}"
echo ""
