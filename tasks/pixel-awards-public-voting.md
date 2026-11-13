# Awards Public Voting

**Agent:** pixel
**Status:** done
**Priority:** high
**Branch:** pixel/awards-public-voting

## Objective

Replace the public awards nomination experience with voting on the official 2026
nominees, and give admins a private live results view. Nominations stop being
public and become a read-only archive.

- Spec: `docs/superpowers/specs/2026-11-13-awards-voting-design.md`
- Plan: `docs/superpowers/plans/2026-11-13-awards-voting.md`
- Release runbook: `docs/awards-voting-release.md`

## Scope

- [x] Nominee catalogue pipeline: normalization, reviewed category map, dry-run
      importer, stable IDs, contact-field exclusion (`scripts/awards/*`).
- [x] `castAwardVote` callable: deadline, category/nominee validation, one vote
      per browser per category, atomic totals, hourly browser/network ceilings.
- [x] `firestore.rules`: public catalogue reads only, private votes/totals,
      nomination creation denied, admin archive access preserved.
- [x] Public ballot on `/awards`: category picker, search, country filter,
      labelled radios, optional anonymous identity, accessible status messaging.
- [x] Admin "Voting Results" tab with live totals; nominations relabelled
      "Nomination Archive".
- [x] Tests: nominee pipeline, ballot utilities, vote transactions and rules
      against the Firestore emulator; lint and production build.

## Owner actions (not executed by the implementing agent)

- [ ] Theo reviews the branch and the rules diff against the live console rules.
- [ ] Run the importer against the supplied workbook (`docs/awards-voting-release.md`).
- [ ] Deploy functions, rules and frontend in the documented order.
- [ ] Open voting in the console only after launch approval.

## Acceptance Criteria

- 139 nominees appear once each, with the agreed display fallback and country.
- Anyone can vote without login; optional name/email are validated and private.
- Duplicate/concurrent submissions count once; another category stays available.
- Votes at or after `2026-11-19T14:00:00Z` are rejected by the server.
- Public and member clients cannot read votes/totals or write voting data.
- Admin totals update live and equal the accepted vote records.
- Existing nomination records remain readable by admins and cannot be deleted.

## Notes

### Category mapping needs a review pass

`scripts/awards/category-map.json` seeds the 28 official categories from
`src/data/award-categories.json`. Any spreadsheet label that is not in that map is
reported as a **blocking** `unmapped-category` issue, and ambiguous labels (for
example "Legal Services" with and without "Excellence") are blocked explicitly.
Run the dry run against the real workbook and add the reviewed mappings before
`--apply`:

```
node scripts/awards/import-nominees.mjs "/path/Awards Nominees 5.xlsx"
```

The real supplied workbook is now available and validated. The importer recognizes
its blank sixth heading only for the known seven-column layout and imports the
Business Person column correctly. Real validation: **139 unique nominees,
9 countries, 32 populated categories, zero blocking errors**, 3 missing business
names and 21 missing person names. See `docs/awards-nominee-validation.md` for
category counts and explicit mapping decisions. Legal award titles with and
without Excellence remain separate; owner publication signoff is still pending.

Fresh verification: 52 awards tests passed on Node 22 using the actual workbook;
33 voting emulator tests and 25 rules tests passed; production build and targeted
lint passed. Independent review found no blocking issues. Build outputs were
restored and are not part of the change.

### Deployed rules baseline audited

Firebase login succeeded and the deployed Firestore rules were retrieved read-only
on 13 November 2026. The audit found the proposed membership permissions were
broader than live: public application reads and cross-email linking. Restore the
live email-matched boundary and field types; preserve pending admin application
submission. Tests cover the regression. See `docs/awards-live-rules-audit.md`.
No production rules, catalogue records, functions or voting settings were changed.

### Admin provisioning moved server-side

The previous invitation flow let a fresh account write its own
`users.role = 'admin'` profile and its own `approved_admins` record, and
`admin_invitations` (including live tokens) was publicly readable. Neither can be
authorised by security rules, so `getAdminInvitation` and `acceptAdminInvitation`
now perform the privileged writes with the Admin SDK and the rules deny client
writes. Existing pending invitations keep working because the server still looks
them up by token.

### Real workbook and Dokploy follow-up

- [x] Support the supplied blank category heading and Business Person column.
- [x] Validate all 139 actual nominees and document category decisions.
- [x] Update Dokploy/Firebase release guidance and supported runtime.
- [x] Run relevant tests/build; push follow-up to PR #11.

Dokploy follow-up: frontend build arguments documented, Docker build context now
excludes credentials/private workbooks, Node 22 configured for Functions/build/CI,
and CI runs awards regression tests. Firebase CLI is now authorized and live rules audited; production import,
functions/rules deployment and opening voting are not performed. Docker image execution cannot be verified here because
this user cannot access the Docker socket; native production build passed.

### Authenticated release audit follow-up

Firebase CLI login and Rules API access confirmed. Retrieved and compared the
published rules without modifying production. Restored membership privacy/type
validation and pending admin application creation; 28 rules emulator tests pass
and independent review found no blocking regression. Targeted lint passes.

Read-only Cloud Billing lookup reports **billingEnabled: false**. Functions list
is empty. Owner must enable Blaze/billing before the voting backend can deploy;
no billing configuration was changed. Production import, backend deploy, Dokploy
release and opening voting remain owner actions, not completed launch steps.

---

## Amendment: run the voting backend on Dokploy (approved 13 November 2026)

The Cloud Functions release requirement in the original plan is replaced by an
internal Node 22 API served by the existing Dokploy Compose deployment. Voting and
invitation acceptance keep their Firestore transactions, rules and ballot
behaviour; only the browser transport changes. No Firebase billing upgrade, no
functions deployment.

- Amendment spec: `docs/superpowers/specs/2026-11-13-dokploy-voting-api-design.md`
- Implementation plan: `docs/superpowers/plans/2026-11-13-dokploy-voting-api.md`
- Operations runbook: `docs/awards-dokploy-api-operations.md`

### Amendment scope

- [x] Domain services (`functions/src/awards/voting.js`,
      `functions/src/admin/invitations.js`) load without the Cloud Functions
      runtime and throw transport-independent domain errors; `functions/index.js`
      keeps the callables as compatibility adapters only.
- [x] Internal API (`functions/src/api/`) on `0.0.0.0:3001`, private Compose
      service, same-origin `/api/v1/` proxy through nginx.
- [x] Browser transport (`src/lib/backendApi.js`) replaces `httpsCallable` in the
      voting and invitation hooks.
- [x] `Dockerfile.api`, Compose service/health checks, nginx proxy, CI coverage
      and release/operations documentation.

### Amendment acceptance criteria

- No production browser flow depends on a deployed Firebase function.
- `POST /api/v1/awards/vote`, `POST /api/v1/admin/invitations/lookup` and
  `POST /api/v1/admin/invitations/accept` accept the existing payloads and return
  `{data}` / `{error:{code,message}}`, preserving `accepted`/`already-voted` and
  the existing error codes.
- `GET /api/v1/health` is process liveness only; `GET /api/v1/ready` verifies
  credentials, project identity and a real Firestore read. Neither returns
  secrets.
- A caller-supplied `X-Forwarded-For` or multi-value client-IP header cannot
  choose the rate-limit identity; missing/invalid proxy identity fails the vote
  safely.
- Concurrent or retried requests still count one vote and one total increment.
- Missing, unreadable, malformed or wrong-project credentials fail startup and
  readiness; no credential contents or request bodies are logged.
- Reverse-proxy/backend failure returns a JSON 503 through nginx, never SPA HTML
  or a false vote success.
- Voting stays closed through deployment; rules are still published separately.

### Amendment implementation notes

- `functions/src/errors.js` holds the transport-independent `DomainError` and its
  approved safe messages. `functions/index.js` is the only place that builds an
  `HttpsError`; `functions/src/api/errors.js` is the only place that maps codes to
  HTTP statuses. No domain module requires `firebase-functions` (asserted by a
  test).
- Invitation acceptance still derives the granted email and role from the stored
  invitation, never from the payload. A conflicting Auth account returns
  `already-exists` without touching the existing account, and a failed profile
  write removes only the account created by that call.
- The API requires the exact `PUBLIC_ORIGIN` and a JSON content type on
  mutations, caps bodies at 16 KiB, and rejects unknown fields per route.
- The rate-limit identity comes only from the single `X-ACBF-Client-IP` header
  that nginx overwrites with `$remote_addr`. `X-Forwarded-For`, `Forwarded`,
  multi-value and malformed addresses fail the vote with JSON `503`; they never
  select a bucket. nginx trusts forwarded addresses only from
  `ACBF_TRUSTED_PROXY_CIDR`.
- Readiness performs a real Firestore read (3 s timeout) and startup fails on a
  missing/unreadable/malformed/wrong-project credential file. Only the port and
  origin are logged.
- `Dockerfile.api` runs as uid 1000 with production dependencies from the
  functions lockfile and copies only `src/{api,awards,admin}` plus
  `src/errors.js`. Compose mounts the credential read-only at
  `/run/secrets/firebase-admin.json`; `api` publishes no host port.
- nginx resolves the `api` service per request through Docker DNS, so a recreated
  container is picked up without pinning a stale address, and backend failures
  return JSON `503`, never `index.html`.

### Amendment verification (13 November 2026)

| Check | Command | Result |
|---|---|---|
| Awards + voting policy | `npm run test:awards` | 51 pass, 1 skipped (needs emulator) |
| HTTP/config/browser transport | `npm run test:api` | 36 pass |
| Vote + invitation transactions | `npm run test:emulator:voting` | 42 pass |
| HTTP concurrency through the real API | `npm run test:emulator:api` | 2 pass — 10 simultaneous same-browser requests produced one vote and one increment; `/ready` read Firestore |
| Private results rules | `npm run test:emulator:rules` | 28 pass |
| Lint (changed areas) | `npx eslint src/lib … functions/test` | clean |
| Production build | `npm run build:prod` | passed (generated `dist`/sitemap restored) |
| Compose configuration | `docker compose config` with placeholders | valid |
| Container build/smoke | CI run 43452816695 (`Build API image`, `API image must fail safely without credentials`, `Build frontend image`, `Proxy contract smoke test`) | passed — the API image starts non-root and fails safely without credentials; nginx renders the template and `/api/v1/health` returns JSON `503`, never SPA HTML (not runnable locally: no Docker socket for this user) |

Unrelated pre-existing lint findings were left untouched (`useAdminManagement.js`,
`src/templates/adminNotification.js`, `vite.config.js`).

### Independent review (13 November 2026)

Reviewed the amendment diff against the five review-focus risks (client-IP trust,
idempotency, startup/readiness, invitations, proxy failure): **no blocking
findings**. Two non-blocking nits fixed — the tautological `app().options.projectId`
assertion was removed (the real guard is the credential/project comparison in
`config.js`) and startup failures now go through the injected logger. Accepted
nits: client and server timeouts are both 15 s, so a slow vote can surface either
message; nginx's intercepted 503 reuses the API's own generic text; a duplicate
vote caches `nomineeId: null` locally (the server never discloses the choice).
Two pre-existing behaviours stay out of scope: an expired token still renders a
submittable form (the server refuses it), and an Auth account orphaned by a failed
batch *and* failed cleanup wedges that email until an admin removes it.

### Amendment owner gates (not executed by the implementing agent)

- [ ] Provision the dedicated service account and mount
      (`docs/awards-dokploy-api-operations.md` §3).
- [ ] Set the exact `ACBF_TRUSTED_PROXY_CIDR` and verify real-IP behaviour with a
      known client and a forged `X-Forwarded-For` (§4).
- [ ] Merge the PR (this triggers the Dokploy release) and publish rules.
- [ ] Run the private catalogue import while voting stays closed.
- [ ] Open voting only after Theo approves launch.

### Amendment status log

- 2026-11-13: amendment recorded; implementation started on
  `pixel/awards-public-voting`.
- 2026-11-13: implementation complete on the feature branch: domain/callable
  split, internal HTTP API, browser transport, Compose/nginx/CI/docs. Checks
  above recorded; no merge, deploy, production import or voting change performed.
- 2026-11-13: PR #11 description updated with the amendment; branch CI green
  (runs 43452816695 and 43453737384 after the socket-error guard), including both
  Docker image builds, the API-image no-credential startup check and the proxy
  `/api/v1/` JSON-503 smoke test. Callables remain undeployed.

### Authorized Firebase setup and environment-only credential follow-up

- [x] Verify Firebase project and live admin roster; save private backups.
- [x] Create dedicated API account and key outside the repository.
- [x] Import official catalogue with voting closed; publish staged voting rules.
- [x] Support Dokploy runtime credential via environment; prepare private .env.
- [x] Verify credential readiness and tests; document operator steps and push PR checks.

### Authorized Firebase preparation results

- Created dedicated `acbf-voting-api` account with only project-level
  `roles/datastore.user` and `roles/firebaseauth.admin`, plus one runtime key.
  Kept keys/backups in owner-only storage outside Git.
- Imported actual workbook: 139 nominees / 32 categories / nine countries.
  Verified zero votes, `isOpen: false`, closing time `2026-11-19T14:00:00Z`.
- Published tested additive voting rules only. Anonymous catalogue reads return
  HTTP 200; private votes/totals return HTTP 403. Existing site behavior remains
  unchanged pending coordinated final rule/website release. Eight staging-rule
  emulator checks passed; three-admin roster matches all admin profiles.
- Prepared private `.env` for remote Dokploy: Firebase project, public origin and
  dedicated base64 runtime credential. Removed the need for a remote key mount;
  file credentials remain supported for standalone deployments. Actual proxy
  CIDR is intentionally blank until the remote network can be inspected.
- Dedicated credential passed actual API readiness HTTP 200 and Firebase Auth
  read check. Initial IAM propagation delay resolved without broadening roles.
- Verification: 52 actual-workbook awards tests, 40 API tests, changed-file lint
  and Compose validation passed. Independent review found no blocking issues;
  stale Dockerfile credential comments were corrected. CI is checked after push.

Remote environment copy, real proxy CIDR/forged-header verification, approved
merge/deployment, final rules hardening and opening voting remain owner actions.
The original supplied key was moved out of the repository; no credentials were
committed. No Cloud Functions or billing changes were made.
