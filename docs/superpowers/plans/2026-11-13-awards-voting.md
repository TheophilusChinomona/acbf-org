# Awards Voting Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace public nominations with official nominee voting and private live admin results.

**Architecture:** Keep existing Firebase authentication and nomination history. Publish a sanitized nominee catalogue in Firestore; accept votes only through a callable Cloud Function with transactional deduplication and private counters. React hooks feed the public ballot and a distinct admin voting panel.

**Tech Stack:** Existing React/Vite/Tailwind, Firebase JS SDK, Firestore, Cloud Functions, XLSX; Node built-in tests and Firebase Emulator security/integration checks.

**Spec:** `docs/superpowers/specs/2026-11-13-awards-voting-design.md`

## Global Constraints

- Deadline: `2026-11-19T14:00:00Z` (19 November 2026, 16:00 SAST); server rejects at or after it.
- Public voting, no login or email verification; optional name/email and explicit anonymous mode.
- One shared category ballot across all countries; one accepted vote per browser/category/competition. Browser protection cannot guarantee unique people.
- All 139 nominees from version 5; display available person/business names, country, category. Source contact details never enter public records.
- Preserve nomination history; disable public nomination submissions. Private votes and counters are admin-only.
- Do not modify `src/lib/firebase.js`, SMTP secrets, legacy PHP, brand assets, or unrelated existing package-lock changes. No PostgreSQL work.
- Theo approves PRs and deployments. No production writes or deployment during implementation. Default voting closed.

## Review Focus

- Concurrent requests and ambiguous network failure must never double-count a category vote (Task 2).
- A browser with unavailable storage must receive an explanation rather than silently generating a fresh identity on each submission (Task 4).
- Hidden tabs and stale pages cannot accept votes after the deadline (Tasks 2 and 4).
- Admin authorization must be enforced by rules, including attempts to self-assign admin roles (Task 3).
- Import retries and late catalogue changes must never reset totals, duplicate nominees, or silently reinterpret existing votes (Task 1).

## File and data boundaries

Create `scripts/awards/normalize-nominees.mjs`, `scripts/awards/category-map.json`, `scripts/awards/import-nominees.mjs`, and normalization tests. Keep private import input outside public assets.

Create `functions/src/awards/voting.js`, `functions/src/awards/policy.js`, and `functions/test/awards-voting.test.js`; wire callable `castAwardVote` in `functions/index.js`. Create `firestore.rules` (currently referenced by firebase.json but absent), emulator tests, and emulator configuration without replacing unrelated deployed access rules blindly.

Create `src/hooks/useAwardsVoting.js`, `src/hooks/useAwardsResults.js`, `src/components/awards/AwardsBallot.jsx`, `src/components/admin/AwardsVotingPanel.jsx`, and `src/utils/awardsVoting.js`. Modify `src/pages/Awards.jsx` and `src/pages/admin/AdminDashboard.jsx`. Keep nomination/archive hooks intact.

Firestore layout: `award_competitions/2026` contains `{isOpen:false, closesAt:Timestamp}`; public subcollections `categories/{categoryId}` and `nominees/{nomineeId}` contain only display data. Private subcollections `votes/{voteKey}`, `totals/{nomineeId}`, `rate_limits/{key}`. No aggregate total in public nominee documents.

`Nominee = {id, categoryId, businessName, personName, country}`; `Category = {id, name}`. `VoteInput = {competitionId, categoryId, nomineeId, browserToken, name?, email?}`. Callable returns `{status:'accepted'|'already-voted', nomineeId}`. Server errors use `invalid-argument`, `failed-precondition`, `resource-exhausted`, and `unavailable`; never return private vote details. A duplicate choosing another nominee returns only already-voted, without disclosing the prior choice. Update the response type to make nomineeId optional for duplicates.

### Task 1: Reproducible nominee catalogue

**Files:** import/normalization files above; `scripts/awards/normalize-nominees.test.mjs`.

**Interfaces:** `normalizeNominees(rows, categoryMap) -> {nominees:Nominee[], categories:Category[], issues:Issue[]}`; CLI accepts an XLSX path and defaults to dry run. Import uses Admin SDK through the functions package and application default credentials, never frontend configuration as authorization.

- [ ] Write Node tests for carried-forward country, person-only/business-only/both, ignored blank rows, exact 139 count on supplied file, contact-field exclusion, and repeat normalization yielding identical IDs.
- [ ] Run `node --test scripts/awards/normalize-nominees.test.mjs`; confirm failure before implementing.
- [ ] Implement trim and explicit category mapping; publish a dry-run report with counts and ambiguous categories. Normalize obvious punctuation/case variants; preserve semantically ambiguous categories until reviewed. Build IDs from normalized category/country/person/business; reject collisions rather than collapsing two rows.
- [ ] Implement importer with dry-run default and explicit `--apply`; upsert catalogue only, initialize competition only if absent, never write votes/totals or reset open state. If votes already exist, refuse category or identity changes. Do not run apply against production.
- [ ] Rerun tests; dry-run version 5. Confirm 139 unique nominees, nine countries, zero leaked contact fields. Document unresolved mapping review in the task board.
- [ ] Commit only task files with `feat: prepare official awards nominee import`.

### Task 2: Server vote acceptance and counting

**Files:** voting/policy files, function export, Node and emulator integration tests, `functions/package.json` test scripts if needed.

**Interfaces:** `createCastAwardVote({db, now}) -> callableHandler(data, context)`; `validateVoteInput(data) -> VoteInput`; `isVotingOpen(config, nowMs) -> boolean`. Client calls exported `castAwardVote` using `getFunctions(app)` with existing app export, not by editing Firebase initialization.

- [ ] Write policy tests asserting open before deadline, closed at `2026-11-19T14:00:00Z`, closed after it, and closed when flag false even before deadline. Write integration tests for two concurrent same-browser/category votes producing one vote and one increment, retry returning already-voted, and different categories accepting separately.
- [ ] Run `node --test functions/test/awards-voting.test.js`; confirm failure before implementation. Integration tests must run against the Firestore emulator, never production.
- [ ] Validate exact allowed fields, token UUID, IDs, optional trimmed name <=120 characters, email <=254 with basic email validation; reject unexpected fields. Store absent name/email as null. Ignore arbitrary client timestamps.
- [ ] Implement transaction reading competition, nominee/category, existing vote and rate-limit buckets before writing. Hash browser/category/competition for vote key. Record accepted votes with server timestamp and increment nominee totals atomically. Evaluate server time within each transaction attempt. Reject disabled/missing nominees and category mismatch.
- [ ] Apply transactional per-browser and hashed-IP accepted-vote ceilings of 60 and 600 per hour respectively; duplicates do not increase counters. Hash IP rather than storing it; do not log names/emails/tokens. Expired bucket cleanup can be manual for launch and must not be required for correctness. Shared-network rejection has a clear retry message.
- [ ] Verify deadline, malformed requests, concurrent contention across browsers, retry idempotency, tampered nominee/category, absent config, rate-limit rejection, and closed flag using emulator tests. Counters must equal accepted vote records. Preserve existing email function exports.
- [ ] Commit `feat: accept awards votes securely in firebase`.

### Task 3: Access rules and nomination archive

**Files:** `firestore.rules`, `firebase.json` emulator settings, `tests/firestore/awards.rules.test.mjs`, test-only rules-unit-testing/firebase-tools dependencies if unavailable.

**Interfaces:** public read for competition/category/nominee catalogue only; admin read for votes/totals; all client writes to new voting collections denied. Nomination creation denied; existing admin archive access preserved.

- [ ] Before writing rules, inspect project role/auth code and retrieve deployed rules read-only if authenticated tooling allows. Existing markdown rule examples are historical reference, not proof of live policy. If retrieval is unavailable, document the missing baseline and prohibit rules deployment until compared by Theo.
- [ ] Write emulator assertions for anonymous catalogue access, denied anonymous/member totals and vote reads, denied direct writes even by authenticated members, and allowed current admin reads. Test that members cannot escalate roles through profile creation/update or approved-admin records.
- [ ] Run emulator rules tests to confirm failure against the baseline, then add specific voting rules and nomination-create denial. Keep unrelated contact/member access consistent with audited policy. Avoid permissive wildcard grants that override collection restrictions.
- [ ] Verify archived nominations remain readable to admins, public nomination creation fails, and contact/membership flows retain baseline permissions. Run rules tests with `firebase emulators:exec --only firestore 'node --test tests/firestore/awards.rules.test.mjs'` using local tooling.
- [ ] Commit `fix: restrict awards voting data and archive nominations`.

### Task 4: Public ballot and optional voter details

**Files:** public hook/component/utility above, `src/pages/Awards.jsx`, `src/utils/awardsVoting.test.js`; remove public form usage but retain archived code where still useful.

**Interfaces:** `useAwardsVoting('2026') -> {categories, nominees, loading, error, isOpen, closesAt, castVote, votingCategoryId, votedCategoryIds}`; `castVote({categoryId, nomineeId, name?, email?}) -> Promise<VoteResult>`. Utils own token persistence and date formatting; hook owns subscriptions/callable and loading/error state.

- [ ] Write Node tests for persistent UUID reuse, unavailable storage causing a controlled disabled-voting state, optional identity validation, and display-name fallback. Confirm failing tests before implementing.
- [ ] Subscribe only to public catalogue/config; use a stable localStorage browser token and local accepted-category cache for feedback, while the server remains authoritative. On timeout, retry the same token/category. Do not silently switch identity after errors.
- [ ] Replace nomination CTA/form with category selection, nominee search, country filter, labelled radio choices, and explicit vote confirmation. Show both names when available, otherwise available name. Keep country and category visible; no nominee contact data or totals.
- [ ] Include optional name/email, explicit anonymous option clearing those fields before sending, no verification/login flow, and concise browser-limit explanation. Lock accepted categories; show success/duplicate/closed/rate-limit/network messages through accessible status text and existing toast conventions.
- [ ] Display `19 November 2026, 4:00 pm SAST`. Refresh local deadline state when page regains focus and with a timer, but handle authoritative closed response independently of device clock. Maintain closed state after deadline, preserving catalogue visibility.
- [ ] Run utility tests and production build. Manually check keyboard/radio labels, mobile layout, no-storage state, anonymous and identified submissions, double clicks, dropped response/retry, and an open page crossing deadline against emulators. Use existing styling, no inline styles.
- [ ] Commit `feat: replace public nominations with awards voting`.

### Task 5: Private live results and release package

**Files:** admin hook/panel, `src/pages/admin/AdminDashboard.jsx`, `docs/awards-voting-release.md`, `tasks/pixel-awards-public-voting.md`.

**Interfaces:** `useAwardsResults('2026') -> {nominees, categories, totals, loading, error}` subscribes only while authenticated admin panel is mounted. `AwardsVotingPanel` groups nominees by category and displays each count plus sum of accepted votes.

- [ ] Create/update task board before code execution: status in-progress, branch pixel/awards-public-voting, scope checklist linking spec and plan. Read it on execution start.
- [ ] Add separate Voting tab and relabel existing awards nominations section as Nomination Archive. Preserve old records without mass mutation, deletion, or counting them as votes.
- [ ] Implement real-time totals with zero fallback for nominees without votes, category filters, aggregate accepted-vote count, loading/error states, and listener cleanup. Use existing approved admin routing; Firestore rules remain authoritative. Do not fetch individual voter PII for the totals view.
- [ ] Verify two-browser emulator flow: vote accepted publicly, admin count changes without refresh, public cannot read counts, closed vote leaves count unchanged. Check archived nomination history and unrelated dashboard tabs.
- [ ] Run `npm run lint`, `npm run build:prod`, Node tests, and emulator rules/transaction tests. Record pre-existing failures separately; fix introduced failures. Review branch diff for source-spreadsheet/contact leakage and unrelated lockfile edits.
- [ ] Write release instructions: category mapping signoff, private import dry run and apply, deployed-rules baseline comparison, runtime/billing/function deployment readiness, rule/function/frontend release order, smoke checks, and opening config only after Theo approves launch. Check current supported Firebase runtime/tooling from official docs during execution; upgrade obsolete runtime only as required, preserving email triggers. Test deployment availability before promising launch; missing admin credentials or deployment access must be reported rather than bypassed.
- [ ] Document rollback: close competition first, preserve all votes and nominees, restore frontend only if compatible, never restore public nomination writes or public result reads. Check production data only through authorized read-only access until deployment is approved.
- [ ] Commit `feat: add private live awards results`; request branch review, open PR to main when authorized tooling is available, require CI lint/build to pass, update task status done only when scope is complete. Do not merge or deploy.

## Self-review

Spec covered by catalogue/import (Task 1), server correctness (Task 2), private access/archive security (Task 3), public UX (Task 4), and live reporting/release checks (Task 5). Exact closing boundary is tested in both backend and public flow. Identity remains browser-based by design. PostgreSQL, paid voting, editable votes, and public rankings remain excluded. No production runtime or deployed-rule assumptions are treated as verified.
