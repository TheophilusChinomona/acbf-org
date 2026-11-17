# AGENTS.md — African Community Business Federation (ACBF)

## Project Overview
Organization website and member management platform for the African Community Business Federation. Public-facing marketing site combined with a full admin dashboard, member portal, awards system, and automated email notifications.

**Live site:** https://acbf.org.za
**Repo:** https://github.com/TheophilusChinomona/acbf-org
**Theo approves:** all PRs before merge, all deployments before going live

---

## Agent Roster

| Agent | Role | Handles |
|-------|------|---------|
| **Zach** | Orchestrator | Plans work, creates task files, dispatches agents, reviews PRs |
| **pixel** | Frontend | React pages/components, Tailwind styling, Framer Motion animations, routing |
| **backend (Atlas)** | Backend | Voting/notification API (`functions/src`), Firestore rules and queries, auth logic |
| **forge** | Infrastructure | Dockerfiles, Compose, nginx, GitHub Actions CI, Dokploy env vars |

---

## Task Board — `tasks/`

All work is tracked in `tasks/`. Agents read their task file on session start and update status as they work.

### File naming
- `pixel-<slug>.md` — frontend tasks
- `backend-<slug>.md` — backend/Firebase tasks
- `forge-<slug>.md` — infra/deploy tasks
- `plan-<slug>.md` — Zach's breakdown plan (reference only, do not modify)

### Task file format
```markdown
# <Task Title>

**Agent:** pixel | backend | forge
**Status:** pending | in-progress | done | blocked
**Priority:** high | medium | low
**Branch:** <agent>/<feature-slug>

## Objective
## Scope
- [ ] deliverable
## Context
## Acceptance Criteria
## Notes
```

### Rules
1. Read your task file first, before touching any code
2. Update `Status:` to `in-progress` when you start
3. Check off scope items as you complete them
4. Update `Status:` to `done` when finished
5. Open a PR targeting `main` — never push directly
6. CI must pass before requesting review

---

## Repo Layout (agent-relevant)

```
acbf-org/
├── tasks/                          # Task board — read on session start
├── .github/workflows/ci.yml        # CI only: tests, lint, image builds (does not deploy)
├── Dockerfile, nginx.conf          # Site image: Vite build served by nginx, proxies /api/ to the API
├── Dockerfile.api                  # API image (copies only the folders it lists — add new ones!)
├── docker-compose.yml              # prod stack deployed by Dokploy (site + api + awards-data volume)
├── functions/src/                  # The Node API (Node 22). Not Firebase Cloud Functions.
│   ├── api/                        # HTTP server and routes (/api/v1/...)
│   ├── awards/                     # Voting policy, SQLite vote store, Firestore export
│   ├── admin/                      # Admin invitations
│   └── notifications/              # Contact + membership admin emails via Resend
├── firestore.rules, firebase.json  # Firestore rules (used by emulator tests)
├── public/                         # Static assets (images, videos, robots.txt, sitemap.xml)
└── src/
    ├── App.jsx                     # Router setup + lazy-loaded routes
    ├── pages/                      # Home, About, Blog, Portfolio, Awards, Contact, admin/, auth/, member/
    ├── components/                 # admin/, auth/, forms/, layout/, member/, common/, awards/
    ├── context/                    # AuthContext, SiteContext
    ├── hooks/                      # Custom hooks (useAuth, useAwardsVoting, useAwardsResults, ...)
    ├── lib/                        # firebase.js (init) and backendApi.js (the only way to call /api/v1)
    ├── utils/                      # exportData, formatDate, slugify, userRoles, invitationToken
    └── data/                       # Static constants and data files
```

---

## Stack

- **Framework:** React 18 + Vite (no SSR — pure SPA)
- **Routing:** React Router v6 with lazy-loaded pages
- **Styling:** Tailwind CSS 3 (custom gold/brown brand palette)
- **Animations:** Framer Motion
- **Forms:** React Hook Form + Zod
- **State:** React Context (auth + site data) + TanStack React Query
- **Database:** Firebase Firestore (primary, real-time)
- **Auth:** Firebase Authentication
- **Backend:** Node 22 API in Docker (`functions/src/api`), behind nginx at `/api/v1/`
- **Votes:** SQLite (`node:sqlite`) on the `awards-data` volume — not Firestore. Back up with `VACUUM INTO`, never a plain file copy (WAL).
- **Email:** Resend (admin notifications for the contact and membership forms)
- **Deployment:** Dokploy builds `docker-compose.yml` from GitHub on push to `main`

---

## Branch Strategy

| Branch | Purpose |
|--------|---------|
| `main` | Production — Dokploy rebuilds and redeploys on push. A merge restarts the API (a few seconds). |
| `pixel/<slug>` | Frontend feature branches |
| `backend/<slug>` | Backend/Firebase branches |
| `forge/<slug>` | Infra branches |

All PRs target `main`. CI (lint + build) must pass before merge.

---

## Deployment

Push to `main` → Dokploy builds `docker-compose.yml` (site image + API image) and redeploys. There is no FTP, cPanel, `deploy.sh` or Firebase Functions deploy any more.

GitHub Actions (`ci.yml`) only runs on push and pull requests: tests, lint, Compose validation and image build checks. It never deploys.

Votes live in SQLite on the `awards-data` volume. Never delete that volume while voting is open. See `docs/awards-dokploy-api-operations.md`.

---

## Environment Variables

Never commit values. Keys only:

**Frontend (`src/` — must be prefixed `VITE_`):**
```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

**API runtime (set in Dokploy, never committed):**
```
FIREBASE_PROJECT_ID=
FIREBASE_ADMIN_CREDENTIALS_BASE64=   # server-only service account
PUBLIC_ORIGIN=                       # e.g. https://acbf.org.za
ACBF_TRUSTED_PROXY_CIDR=             # private proxy network
AWARDS_ADMIN_EMAILS=                 # comma-separated admin login emails
RESEND_API_KEY=
RESEND_FROM=                         # on a domain verified in Resend
NOTIFY_TO=                           # where form notifications go
```
(`AWARDS_STORE_PATH` and `AWARDS_CATALOGUE_PATH` are set in `docker-compose.yml`.)

**Frontend build args:** the `VITE_FIREBASE_*` keys above are passed to the site image build in Dokploy.

---

## Conventions

- **Lazy load all pages** via `React.lazy` + `Suspense` — keep the initial bundle small
- **Business logic in hooks** — pages and components stay presentational
- **Firestore as source of truth** — no local state for server data, use React Query or Firestore listeners
- **Role-based routing** — use `ProtectedRoute` for member routes, `AdminProtectedRoute` for admin routes
- **Tailwind utility classes only** — no inline styles; add to `index.css` only for global/base styles
- **Toast notifications** via `react-hot-toast` — not browser `alert()`
- **Date formatting** via `date-fns` — no manual date string manipulation
- **Excel export** via `XLSX` utility in `utils/exportData.js` — do not add other export libs
- **Commit prefix:** `feat:` / `fix:` / `chore:` / `style:`
- **Do not add "Co-Authored-By: Claude"** to commit messages

## Do NOT touch
- `public/assets/images/` logos and brand assets — client-approved
- `src/lib/firebase.js` Firebase config — Theo manages credentials
- Dokploy environment variables and credentials — Theo manages them
- `dist/` — build output (git-ignored), never edit manually
