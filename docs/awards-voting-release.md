# Awards voting release runbook

Companion to `docs/superpowers/plans/2026-11-13-awards-voting.md`. Everything here
requires Theo's approval; nothing in this repository has been deployed.

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
   node scripts/awards/import-nominees.mjs "~/private/Awards Nominees 5.xlsx"
   ```

3. Every `unmapped-category` and `ambiguous-category` issue is blocking. Add the
   reviewed labels to `scripts/awards/category-map.json` (aliases for obvious
   case/punctuation variants; separate categories where the meaning differs).
   Never merge two labels whose meaning differs.
4. Confirm the report shows **139 nominees**, **9 countries**, 3 nominees without
   a business name, 21 without a person name, and no contact data.
5. Re-run the normalizer tests with the real file to lock the assertion in:

   ```bash
   AWARDS_NOMINEES_XLSX="~/private/Awards Nominees 5.xlsx" \
     node --test scripts/awards/normalize-nominees.test.mjs
   ```

### 1.2 Deployed rules baseline comparison

`firestore.rules` was absent from the repository while `firebase.json` referenced
it, and no authenticated tooling was available during implementation to read the
live rules. The new file reproduces the audited behaviour of
`tasks/complete-firestore-rules.md` and `src/` for unrelated collections, and
tightens admin provisioning. **Before deploying:**

```bash
firebase deploy --only firestore:rules --dry-run   # inspect, do not publish
```

Compare the local file with the rules currently shown in the Firebase console
(Firestore → Rules). Confirm, one collection at a time:

- `contact_submissions`, `membership_applications`: public create still allowed,
  admin read/update/delete preserved.
- `users`, `approved_admins`: role escalation closed; approve/reject flows still
  work for admins and the super admin.
- `awards_nominations`: reads and status/archive updates still allowed for admins,
  creation denied, deletion denied.
- `admin_applications`: unchanged read/update expectations.
- Any collection present in the live rules but missing locally must be added
  before publishing.

### 1.3 Function deployment readiness

- Node runtime is `nodejs18` in `firebase.json` and `functions/package.json`. It
  is in end-of-life status upstream and 1st-generation functions do not accept
  `nodejs22`. If the deploy rejects `nodejs18`, change **both** files to
  `nodejs20` together, then re-run the email-trigger smoke test below.
- `functions/package.json` now includes `test` and `test:emulator` scripts; the
  emulator suites require `firebase-tools` (already a root dev dependency).
- Billing: callable functions and Firestore transactions require the Blaze plan
  for the `acbf-rsa-backend` project. Confirm billing is enabled.
- Existing triggers `onContactSubmissionCreated`,
  `onMembershipApplicationCreated` and `testEmail` are untouched and must still
  deploy. `testEmail` is an unauthenticated endpoint; removing it is a separate
  decision, not part of this change.
- New callables: `castAwardVote`, `getAdminInvitation`, `acceptAdminInvitation`.

### 1.4 Test the deployment path

Run the emulator suites locally once more and confirm the CLI can authenticate:

```bash
npm run test:awards
npm run test:emulator
firebase projects:list
```

If `firebase projects:list` fails, deployment access is missing. Report it rather
than working around it.

---

## 2. Release order

Functions first (the frontend calls them), then rules, then hosting. The
invitation callables must exist before the new frontend is served.

1. **Deploy functions**

   ```bash
   firebase deploy --only functions
   ```

2. **Deploy rules**

   ```bash
   firebase deploy --only firestore:rules
   ```

3. **Import the catalogue** (approved mapping, votes still closed)

   ```bash
   node scripts/awards/import-nominees.mjs "~/private/Awards Nominees 5.xlsx" \
     --apply --project acbf-rsa-backend
   ```

   The importer initialises `award_competitions/2026` as **closed** only if the
   document is absent. It never writes votes/totals and never rewrites an existing
   competition document.

4. **Deploy the frontend** (push to `main` → GitHub Actions build + FTP). CI must
   be green first.

5. **Smoke checks before opening**

   - `/awards` shows "Voting closed …" with the full nominee list browsable.
   - `castAwardVote` returns `failed-precondition` (closed) — check in the
     functions log, not in the browser console alone.
   - As an admin, `/admin` → **Voting Results** lists 139 nominees at zero.
   - **Nomination Archive** still lists the historical nominations.
   - Contact and membership form submissions still succeed and still send email.

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
   deployed rules and functions (the nomination form is gone from the build; do
   not restore a build that expects public nomination writes).
4. **Do not** restore public nomination writes or public reads of totals/votes to
   recover a broken page — the archive and private results are intentional.
5. If a function deploy is faulty, redeploy the previous function revision from
   the last green commit; votes already accepted remain valid and totals are
   unchanged by redeploys.
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
  the `getAdminInvitation` callable. Deploying the frontend before the functions
  will break invitation acceptance until the functions are deployed.
