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
| **backend (Atlas)** | Backend | Firebase Functions, Firestore queries, email triggers, PHP API, auth logic |
| **forge** | Infrastructure | GitHub Actions, FTP deployment, Firebase config, env vars, build pipeline |

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
├── .github/workflows/              # auto-deploy.yml (push to main) + manual-deploy.yml
├── api/                            # Legacy PHP API (contact + membership email endpoints)
├── functions/                      # Firebase Cloud Functions (Node.js 18)
│   ├── index.js                    # Firestore onCreate triggers
│   └── src/
│       ├── sendEmail.js            # Nodemailer wrapper
│       └── templates/             # HTML email templates
├── public/                         # Static assets (images, videos, robots.txt, sitemap.xml)
└── src/
    ├── App.jsx                     # Router setup + lazy-loaded routes
    ├── main.jsx                    # React entry point
    ├── index.css                   # Tailwind + global CSS
    ├── pages/
    │   ├── Home.jsx, About.jsx, Blog.jsx, BlogPost.jsx
    │   ├── Portfolio.jsx           # Member directory
    │   ├── Awards.jsx, Contact.jsx, Search.jsx
    │   ├── admin/                  # Admin dashboard pages
    │   ├── auth/                   # Register, Invite pages
    │   └── member/                 # Member dashboard, PendingApproval
    ├── components/
    │   ├── admin/                  # Admin-specific UI
    │   ├── auth/                   # ProtectedRoute, AdminProtectedRoute
    │   ├── forms/                  # Form components
    │   ├── layout/                 # Layout wrapper
    │   ├── member/                 # Member-specific UI
    │   └── common/                 # Loading, ErrorBoundary, ScrollToTop
    ├── context/
    │   ├── AuthContext.jsx         # Auth state + methods
    │   └── SiteContext.jsx         # Site-wide data
    ├── hooks/                      # Custom hooks (useAuth, useMembers, useSubmissions, etc.)
    ├── lib/firebase.js             # Firebase initialization
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
- **Backend:** Firebase Cloud Functions (Node.js 18) — email triggers on Firestore events
- **Email:** Nodemailer via Mailtrap SMTP (Functions) / PHP SMTP API (legacy)
- **Deployment:** GitHub Actions → FTP to cPanel (executus-ent.co.za hosting)

---

## Branch Strategy

| Branch | Purpose |
|--------|---------|
| `main` | Production — auto-deploys to acbf.org.za on push |
| `pixel/<slug>` | Frontend feature branches |
| `backend/<slug>` | Backend/Firebase branches |
| `forge/<slug>` | Infra branches |

All PRs target `main`. CI (lint + build) must pass before merge.

---

## Deployment

Push to `main` → GitHub Actions runs:
1. `npm ci`
2. `npm run build:prod` (Vite build → `dist/`)
3. Sitemap generated
4. FTP deploy to cPanel via `SamKirkland/FTP-Deploy-Action`

Firebase Functions are deployed separately via `firebase deploy --only functions`.

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

**Firebase Functions (`functions/.env`):**
```
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
ADMIN_EMAIL=
FROM_EMAIL=
FROM_NAME=
ORGANIZATION_NAME=
```

**GitHub Actions Secrets (forge manages these):**
```
FTP_SERVER=
FTP_USERNAME=
FTP_PASSWORD=
FTP_REMOTE_PATH=
VITE_FIREBASE_*=   (all VITE_ vars injected at build time)
```

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
- `functions/.env` — Theo manages SMTP credentials
- PHP files in `api/` — legacy, only modify if explicitly tasked
- `dist/` — build output, never edit manually
