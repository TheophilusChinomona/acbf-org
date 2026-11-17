# ACBF — African Community Business Federation

Marketing site, member portal and awards voting for https://acbf.org.za.

- **Site:** React + Vite single-page app, served by nginx.
- **API:** Node 22 service in `functions/src`, reached at `/api/v1/` (votes in SQLite, admin results, invitations, form notification emails via Resend).
- **Data:** Firestore (members, content) and SQLite (award votes).
- **Deploy:** Dokploy builds `docker-compose.yml` on push to `main`. CI (`.github/workflows/ci.yml`) only tests and lints.

See `AGENTS.md` for conventions and `docs/awards-dokploy-api-operations.md` for running the voting stack.
