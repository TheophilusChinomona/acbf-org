# Awards voting release runbook

Companion to `docs/superpowers/plans/2026-11-13-awards-voting.md`. Everything here
requires Theo's approval. Authorized Firebase preparation is recorded below;
the Dokploy application is not deployed.

Voting closes at **2026-11-19T14:00:00Z** (19 November 2026, 16:00 SAST). The
server rejects votes at or after that instant regardless of the admin flag, and
the competition stays closed until someone deliberately opens it.

---

## 1. Pre-flight (blockers)

All of these must be true before a production deploy.

### 1.1 Category mapping sign-off

1. Put the supplied workbook outside the repository (for example
   `~/private/Awards Nominees 5.xlsx`) — never in `public/`.
2. Run the dry run and read the report:

   ```bash
   node scripts/awards/import-nominees.mjs "$HOME/private/Awards Nominees 5.xlsx"
   ```

3. Every `unmapped-category` and `ambiguous-category` issue is blocking. Add the
   reviewed labels to `scripts/awards/category-map.json` (aliases for obvious
   case/punctuation variants; separate categories where the meaning differs).
   Never merge two labels whose meaning differs.
4. Confirm the report shows **139 nominees**, **9 countries**, 3 nominees without
   a business name, 21 without a person name, and no contact data.
5. Re-run the normalizer tests with the real file to lock the assertion in:

   ```bash
   AWARDS_NOMINEES_XLSX="$HOME/private/Awards Nominees 5.xlsx" \
     node --test scripts/awards/normalize-nominees.test.mjs
   ```

### 1.2 Deployed rules baseline comparison

Live rules were retrieved read-only on 13 November 2026 after Firebase login.
See `docs/awards-live-rules-audit.md` for the comparison. No rules were published.
A private baseline copy is held outside the repository under
`/tmp/acbf-live-rules/live-0.rules`; re-export the live rules before release to
ensure nobody changed them after the audit.

Compare the local file with the rules currently shown in the Firebase console
(Firestore → Rules). Confirm, one collection at a time:

- `contact_submissions`, `membership_applications`: public create still allowed,
  admin read/update/delete preserved; membership details remain applicant-email/admin-only.
- `users`, `approved_admins`: role escalation closed; approve/reject flows still
  work for admins and the super admin.
- `awards_nominations`: reads and status/archive updates still allowed for admins,
  creation denied, deletion denied.
- `admin_applications`: unchanged read/update expectations.
- Any collection present in the live rules but missing locally must be added
  before publishing.

### 1.3 Backend deployment readiness (Dokploy API, no Cloud Functions)

Voting and invitation acceptance run in the Compose `api` service; nothing is
deployed to Cloud Functions and no Blaze upgrade is needed. Full setup is in
`docs/awards-dokploy-api-operations.md`.

- Node 22 everywhere: `api` image, CI and `functions/package.json` engines.
- The dedicated service account, its runtime credential and the exact
  `ACBF_TRUSTED_PROXY_CIDR` must exist **before** merging, because `main`
  auto-deploys through Dokploy.
- `GET /api/v1/ready` must return `{"data":{"status":"ready"}}` after deploy.
- The legacy callable exports remain only as compatibility adapters; production
  browser flows call `/api/v1/`.
- Existing email triggers (`onContactSubmissionCreated`,
  `onMembershipApplicationCreated`, `testEmail`) are outside this transport
  migration and remain undeployed; do not promise email notifications.
- Firestore rules are still published separately (they do not require Blaze).

### 1.4 Test the deployment path

Run the suites locally once more and confirm the CLI can authenticate:

```bash
npm run test:awards
npm run test:api
npm run test:emulator
docker compose config --quiet    # with the real deployment variables set
firebase projects:list
```

If `firebase projects:list` fails, rules deployment access is missing. Report it
rather than working around it.

---

## 2. Release order

Credentials and proxy trust first, then code (Dokploy auto-deploys `main`), then
rules, then the catalogue import. The `api` service must be configured before the
new frontend is served; there is no function deployment step.

0. **Provision the API** (`docs/awards-dokploy-api-operations.md` §2–§4): service
   account file mounted read-only, `FIREBASE_PROJECT_ID`, `PUBLIC_ORIGIN`,
   `FIREBASE_ADMIN_CREDENTIALS_FILE` and the exact `ACBF_TRUSTED_PROXY_CIDR`.

1. **Deploy the API and frontend together** by merging the approved PR; Dokploy
   rebuilds `prod` and `api`. Never publish a host port for `api`.

2. **Deploy rules**

   ```bash
   firebase deploy --only firestore:rules
   ```

3. **Import the catalogue** (approved mapping, votes still closed)

   ```bash
   node scripts/awards/import-nominees.mjs "$HOME/private/Awards Nominees 5.xlsx" \
     --apply --project acbf-rsa-backend
   ```

   The importer initialises `award_competitions/2026` as **closed** only if the
   document is absent. It never writes votes/totals and never rewrites an existing
   competition document.

4. **Deploy the frontend through Dokploy**, after Theo approves the PR and
   release. CI builds the app but does not deploy Firebase resources. Dokploy
   builds the repository Dockerfile (or Compose service `prod`) and serves the
   generated SPA through nginx on port 80. Do not use the legacy FTP path.

   Set all six required `VITE_FIREBASE_*` values in **build-time arguments** for
   Dockerfile applications, or in Compose environment interpolation for the
   existing `build.args`. Runtime-only values cannot change an already-built
   Vite bundle. Rebuild after changes. Never put Admin SDK/service-account or
   SMTP secrets into Vite variables or the frontend Docker image.

   Confirm the production domain and HTTPS routing in Dokploy, SPA deep-link
   fallback in nginx, and Firebase Auth authorized domains for any new host.
   Voting and invitation acceptance call the same-origin `/api/v1/` endpoints, so
   nginx must proxy them to the `api` service in the same deployment. See
   [Dokploy build arguments](https://docs.dokploy.com/docs/core/applications/build-type).


5. **Smoke checks before opening**

   - `/awards` shows "Voting closed …" with the full nominee list browsable.
   - `POST /api/v1/awards/vote` returns `409 failed-precondition` (closed) —
     verify with `docker compose logs api`, not from the browser console alone.
   - As an admin, `/admin` → **Voting Results** lists 139 nominees at zero.
   - **Nomination Archive** still lists the historical nominations.
   - Contact and membership form submissions still succeed and are stored in
     Firestore. Email triggers remain undeployed and outside this release.

6. **Open voting** only after Theo approves launch. In the Firebase console set
   `award_competitions/2026`:

   ```json
   { "isOpen": true, "closesAt": "<Timestamp for 2026-11-19T14:00:00Z>" }
   ```

   Never extend `closesAt` to work around the deadline; the flag cannot override
   it.

7. **Concurrent-release check**: two browsers, different categories, then repeat
   the same browser/category and confirm the total does not move.

---

## 3. Rollback

Order matters: close first, restore code second.

1. **Close voting immediately** by setting `award_competitions/2026.isOpen` to
   `false` in the console. Do not delete the document.
2. **Preserve data**: nominees, categories, votes, totals and nomination history
   stay as they are. Never run a bulk delete; never "reset" totals.
3. **Restore the frontend** only if the previous build is compatible with the
   deployed rules and `/api/v1/` contract (the nomination form is gone from the
   build; do not restore a build that expects public nomination writes).
4. **Do not** restore public nomination writes or public reads of totals/votes to
   recover a broken page — the archive and private results are intentional.
5. If an API deploy is faulty, redeploy the previous green commit (the `api`
   image rebuilds from it) and confirm `/api/v1/ready` before reopening; votes
   already accepted remain valid and totals are unchanged by redeploys. While the
   API is down, voting returns JSON `503` and the marketing pages keep serving.
6. Report the incident with the timeline and the exact configuration used.

---

## 4. Known limitations (by design)

- Identity is a random per-browser token in `localStorage`. Clearing storage or
  using another browser/device allows another vote; this is not
  one-person-one-vote and must not be advertised as such.
- Optional names and emails are unverified and stored only on the private vote
  record. The admin totals view never reads them.
- There is no vote editing, paid voting, public leaderboard, or automated winner
  declaration.
- Rate limits are hourly buckets keyed by hashed identity: a shared network is
  limited to 600 accepted votes per hour and a single browser to 60. Expired
  buckets are harmless and can be cleaned up manually.
- `admin_invitations` is no longer publicly readable; the acceptance page uses
  `/api/v1/admin/invitations/lookup`. Serving the new frontend without a working
  `api` service breaks invitation acceptance (and voting) until it is healthy.

## 5. What Dokploy changes about rules

Dokploy hosts the frontend and the internal API. Browser data reads still go
directly to Firestore from the SPA; voting and invitation writes go to
`/api/v1/`, which nginx proxies to the private `api` service. Firestore rules
remain deployed and enforced in the same Firebase project. No rule syntax,
public-access grant, or domain allowlist in Firestore is needed just because the
frontend host changes. Keep the admin-only totals and denied direct vote writes
intact. The API uses the Admin SDK, which bypasses Firestore rules, so its input
validation and invitation-token authority remain necessary.

Deploy rules separately with `npx firebase deploy --only firestore:rules --project
acbf-rsa-backend` from an authenticated, approved release environment. Do **not**
run `firebase deploy --only functions`. Do not add privileged Firebase credentials
to the frontend container, or to Vite variables, to work around this separation.

Firebase CLI login is now authorized and live rules have been retrieved for
comparison. Frontend `.env` API settings identify the project but are not Admin
SDK credentials. Production import uses application default credentials (a
separate authorization from CLI login); confirm that path without writing data
before applying. Production import, backend deployment and opening the ballot
remain pending release approval. `firebase functions:list` returned an empty list
on 13 November 2026, so do not assume existing email functions are live. Verify
SMTP readiness separately before deploying or promising email notifications.

References: [Deploy rules](https://firebase.google.com/docs/rules/manage-deploy),
[Server SDK access](https://firebase.google.com/docs/firestore/security/insecure-rules).

## Billing status

Authenticated read-only Cloud Billing API check on 13 November 2026 returned
`billingEnabled: false` for `acbf-rsa-backend`. That blocked deploying the callable
backend; it does **not** block this release, because voting and invitation
acceptance now run in the Dokploy `api` service (see
`docs/superpowers/specs/2026-11-13-dokploy-voting-api-design.md`). Deploying the
legacy Cloud Functions exports would still require Blaze; they must not be
deployed. This audit changed no billing plan, deployed no code or rules, imported
no nominees, and did not open voting.

## Authorized Firebase preparation — 13 November 2026

Completed on Theo's explicit instruction: dedicated API IAM account/key with
Firestore and Firebase Auth roles; backup of pre-import catalogue/admin data;
real workbook import of 139 nominees in 32 categories across nine countries;
three-admin roster check; additive voting-only rules publication. API readiness
using the dedicated credential returned HTTP 200 and Firebase Auth access passed.
Competition is closed, has zero votes and retains the exact closing deadline.

The published rules preserve the current main site's nomination/invitation
behavior until the API frontend ships. They expose only the public voting
catalogue and protect voting writes/results. The final `firestore.rules` file
still includes nomination archival and invitation/role hardening: publish that
full file only in the coordinated API/frontend release, after refreshing the live
rules baseline. Do not mistake additive staging for completion of that final step.

The private local `.env` now includes server-only runtime credentials for copying
to the remote Dokploy Environment editor. No remote filesystem mount is needed.
`ACBF_TRUSTED_PROXY_CIDR` remains blank until the real proxy network is identified.
Neither main nor Dokploy settings have been changed; voting has not been opened.
