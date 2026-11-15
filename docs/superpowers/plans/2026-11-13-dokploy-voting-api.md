# Dokploy Voting API Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans or superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Run voting and invitation acceptance on Dokploy without deploying Firebase Cloud Functions or upgrading Firebase billing.

**Architecture:** Add an internal Node 22 API to existing Compose and route same-origin `/api/v1/` requests through nginx. Reuse Firestore transaction services, preserving all rules and ballot behavior. Keep legacy callable exports as compatibility adapters only; the new frontend must not call them.

**Tech Stack:** Node built-in HTTP/fetch/test, existing firebase-admin, React, nginx, Docker Compose, Firebase Emulator.

**Spec:** `docs/superpowers/specs/2026-11-13-dokploy-voting-api-design.md`; original voting spec remains applicable except the Cloud Functions release requirement.

## Global Constraints

- Node 22; deadline `2026-11-19T14:00:00Z`; optional voter identity, one browser/category/competition, private results, archived nominations.
- Retain 139 real-workbook nominees and audited Firestore rules. No PostgreSQL, public totals, or email migration.
- Screenshot confirms Compose from main with on-push deployment. No merge/main push/production settings changes until Theo approves release.
- Never expose backend credentials in Vite, images, logs or Git. Never use interactive CLI login tokens as server credentials.
- Do not modify legacy PHP, brand assets, SMTP credentials or `src/lib/firebase.js`.

## Review Focus

- Spoofed forwarded headers must not bypass the network vote limit (Task 2/4).
- Lost HTTP responses and concurrent retries must still count one vote (Task 1/3).
- Credentials unavailable or for the wrong project must fail startup/readiness safely (Task 2/4).
- Expired/replayed invitation tokens and existing Auth accounts must not lead to duplicate privilege grants (Task 1/2).
- Reverse-proxy or backend failures must return API errors, never SPA HTML or false vote success (Task 2/3/4).

## File boundaries and interfaces

Keep existing business logic under `functions/src/awards/` and `functions/src/admin/`; make errors transport independent. Add `functions/src/api/errors.js`, `config.js`, `app.js`, `index.js`, and Node tests under `functions/test/api/`. Reuse the existing functions dependency manifest rather than introducing an unrelated service package. Installing the firebase-functions compatibility SDK does not require deploying Cloud Functions.

Add `src/lib/backendApi.js` and `src/lib/backendApi.test.js`; modify `src/hooks/useAwardsVoting.js` and `src/hooks/useAdminInvitations.js`. Create `Dockerfile.api`; modify `docker-compose.yml`, `nginx.conf`, `.dockerignore` only if required, root/functions package scripts and CI. Update runbook/task files. Do not edit frontend presentation unless needed for accurate backend-unavailable messaging.

Contract: `POST /api/v1/awards/vote` accepts existing VoteInput; `POST /api/v1/admin/invitations/lookup` accepts `{token}`; `POST /api/v1/admin/invitations/accept` accepts `{token,password,name}`. Responses are `{data: result}` or `{error:{code,message}}`. Preserve `accepted`/`already-voted` and existing error codes. Health: `GET /api/v1/health` for process liveness, `GET /api/v1/ready` for credential/project/Firestore readiness; no secrets in either response.

### Task 1: Separate domain logic from Firebase callable transport

**Files:** existing voting and invitation factories, `functions/index.js`, new domain error helper, existing voting tests and new `functions/test/api/invitations.test.js`.

**Interfaces:** retain `createCastAwardVote({db,now}) -> handler(data,context)`; `createGetAdminInvitation({db,now}) -> handler(data)`; `createAcceptAdminInvitation({db,auth,now}) -> handler(data)`. Factories throw errors with safe `code`/`message`, without importing Cloud Functions. Callable adapters alone construct HttpsError.

- [ ] Read/update task board with this amendment and mark in-progress before product code.
- [ ] Add failing tests that domain services load without the Cloud Functions runtime and preserve validation/error codes. Invitation tests cover malformed/expired/cancelled/accepted tokens, sanitized lookup, stored-email/role authority, conflicting Auth account, and concurrent acceptance. Preserve current acceptance input and post-accept sign-in flow.
- [ ] Run `node --test functions/test/api/invitations.test.js functions/test/awards-voting.test.js`; confirm expected failures first.
- [ ] Extract safe domain errors and callable-only mapping, preserving factory signatures and transaction semantics. Do not change accepted email/role from client fields. On partial Auth/Firestore failure, never delete a pre-existing account or silently grant access; return a safe recoverable error.
- [ ] Run new unit tests and `npm run test:emulator:voting`; require all pass, including exact closing boundary and concurrency, before committing `refactor: separate voting services from callable transport`.

### Task 2: Internal HTTP API and runtime credentials

**Files:** new `functions/src/api/{errors,config,app,index}.js`, `functions/test/api/{http,config}.test.js`, functions start/test scripts.

**Interfaces:** `createApiServer({castVote,lookupInvitation,acceptInvitation,readiness,allowedOrigin}) -> http.Server`; `loadApiConfig(env) -> {port,projectId,allowedOrigin,credentialsPath}`. Entry point loads credentials via `GOOGLE_APPLICATION_CREDENTIALS` mounted read-only, initializes Admin SDK, injects existing services, and listens on `0.0.0.0:3001`.

- [ ] Write failing HTTP tests using an ephemeral local port and injected services: three successful routes, existing error-code/status translation, invalid JSON, non-object input, unknown fields, oversized body, wrong method, unsupported content type, unrecognized route, unexpected exception with no internal data, timeout, and health/readiness failure. Limit body to 16 KiB and request/header timeouts to 15/10 seconds.
- [ ] Write failing config tests: missing/unreadable/malformed credentials, wrong credential project, invalid PUBLIC_ORIGIN, and missing Firebase project cause controlled startup failure with no credential contents logged.
- [ ] Implement Node HTTP adapter; map invalid-argument to 400, unauthenticated 401, permission-denied 403, not-found 404, already-exists 409, failed-precondition 409, resource-exhausted 429, unavailable/internal 503. Recognized errors expose approved safe messages only; other errors become generic unavailable. Require exact configured Origin on mutation routes and JSON content type. No wildcard CORS.
- [ ] Client IP contract: nginx supplies a single `X-ACBF-Client-IP`, overwriting browser input. API ignores all other forwarded headers and rejects missing/invalid custom IP for votes. The API has no public port. Unit tests assert spoofed X-Forwarded-For and multi-value custom IP cannot choose the rate-limit identity. Task 4 validates nginx's own source address trust before this identity is accepted in production.
- [ ] Use an actual harmless Firestore read for readiness with a short timeout; check config project matches credential project. Fail startup if credential file/config absent. Handle SIGTERM gracefully. Never log request bodies, passwords, browser tokens or credential JSON.
- [ ] Run `node --test functions/test/api/*.test.js` and injected HTTP tests; commit `feat: serve voting and invitations through internal API`.

### Task 3: Browser API transport

**Files:** new `src/lib/backendApi.js`, its Node tests, two existing hooks; root scripts.

**Interfaces:** `postBackendApi(path,payload,{fetchImpl,timeoutMs}={}) -> Promise<{data}>`; allow only the three fixed relative API paths. Errors preserve `{code,message}` used by the existing hooks. Default timeout 15 seconds, no automatic identity-changing retry.

- [ ] Write failing tests for valid JSON, timeout, connection failure, non-JSON/HTML reply, malformed success envelope, unknown vote status and safe server errors. Verify only accepted/already-voted responses cause successful local vote bookkeeping.
- [ ] Implement fetch transport and replace only callable imports/calls in voting and invitation hooks. Preserve Firebase Auth sign-in after account provisioning and Firestore real-time subscriptions. Do not send optional voter details when anonymous mode is chosen.
- [ ] Preserve duplicate status without exposing prior choice, deadline errors, storage failure, safe retry messaging and busy state cleanup. No getFunctions/httpsCallable in production voting/invitation hooks.
- [ ] Run browser-transport and existing awards tests with the actual workbook environment variable, targeted lint, and production build. Restore generated dist/sitemap changes. Commit `feat: connect awards frontend to Dokploy API`.

### Task 4: Compose, proxy, CI and release preparation

**Files:** `Dockerfile.api`, Compose/nginx, `.github/workflows/deploy.yml`, package scripts, `docs/awards-voting-release.md`, `docs/awards-dokploy-api-operations.md`, task board.

**Interfaces:** Compose `api` runs Node 22 on private port 3001; `prod` remains frontend port 80. Mount `${FIREBASE_ADMIN_CREDENTIALS_FILE}` into API at `/run/secrets/firebase-admin.json:ro`; set GOOGLE_APPLICATION_CREDENTIALS to that path, FIREBASE_PROJECT_ID and PUBLIC_ORIGIN only at runtime. Host file path must exist on the Dokploy deployment server; provide exact file setup instructions, do not assume an environment variable creates the file.

- [ ] Build API image from functions lockfile with production dependencies; run as non-root with access to mounted credential file. Copy only required server sources. Keep credentials, original workbooks, `.env`, logs and local node_modules out of the build context.
- [ ] Proxy `/api/v1/` to internal api preserving paths; intercept backend-unavailable responses with JSON 503, never SPA fallback. Configure body/time limits consistently and overwrite custom client-IP header. Add Compose health checks, frontend API dependency readiness and restart policy; cover API restart/redeploy without nginx permanently caching an obsolete backend address.
- [ ] Confirm actual Dokploy/Traefik network behavior. Configure nginx real-IP trust only for the actual private proxy network, never 0.0.0.0/0; do not copy caller forwarding headers unchecked. Document required proxy CIDR/config as a launch gate if the platform cannot be inspected. Test a known client request and a forged forwarding-header request end to end before opening voting.
- [ ] Add API unit and HTTP tests to CI alongside current awards tests/build. Install functions lockfile dependencies. Extend emulator verification to call the vote endpoint with real service transactions, asserting 10 concurrent same-category HTTP requests produce one vote and one increment; verify private-result rules remain intact.
- [ ] Run `npm run test:awards`, new API tests, emulator voting/rules suites, targeted lint, production build and Compose configuration validation with non-production placeholder paths. Build and smoke-test containers if Docker access is available; otherwise record that check as not executed and require it before release. Require green PR CI, fix introduced failures, retain unrelated existing lint baseline.
- [ ] Update operations/runbook: no Firebase functions deployment or Blaze step; still deploy audited Firestore rules separately. Include dedicated service account/IAM setup (Firestore and Auth access needed for invitations), secret mount/rotation, readiness, backup/rollback, private import, and existing admin roster validation. Do not generate/export production service-account keys without explicit authorization. No interactive CLI tokens in the API.
- [ ] Before release approval, require credential provisioning, actual proxy trust verification, real catalogue mapping signoff, authenticated import readiness, and live rules refresh. Imports/default configuration keep voting closed. main auto-deploy means credential/proxy setup must precede merge. Existing email triggers remain out of scope.
- [ ] Request independent code review; fix blocking findings. Commit `feat: package voting API for Dokploy Compose`, push feature branch/update PR #11, and mark implementation done only once planned checks are recorded. Do not merge, deploy, import production data or open voting.

## Self-review

All amendment requirements map to Task 1 (domain/auth boundaries), Task 2 (HTTP/security/runtime), Task 3 (browser behavior), and Task 4 (Compose/proxy/CI/release). The five Review Focus risks have explicit tests or real deployment checks. Existing rules and real nominees remain unchanged; credentials/proxy facts are release gates, not guessed configuration. Email and PostgreSQL migrations remain excluded.
