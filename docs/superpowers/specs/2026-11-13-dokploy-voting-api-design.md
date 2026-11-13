# Dokploy voting API amendment

Status: approved by Theo on 13 November 2026; replaces the Cloud Functions
deployment requirement in the approved awards voting design.

## Intent and deployment evidence

Run the voting backend on the existing Dokploy server, retaining Firestore and
Firebase Authentication. Avoid deploying Firebase Cloud Functions, which require
Blaze. The supplied screenshot confirms a GitHub-backed Compose deployment of
`main`, using `./docker-compose.yml`, with on-push deployment enabled. Updating a
feature branch does not release it; merging main can trigger a production release.

## Approaches and choice

1. Separate Node API service alongside nginx in Compose: recommended and accepted
   in principle. Separates runtime credentials and backend health from the static
   frontend; reuses the existing Compose deployment.
2. Combine nginx and Node in one container: fewer Compose entries but requires
   extra process supervision and couples failures. Not recommended.

## Proposed behavior and implementation boundaries

- Retain the existing `prod` frontend service and domain. Add an internal Node 22
  API service. nginx proxies `/api/` to that service; SPA fallback never handles
  API requests. Only the frontend receives public domain routing; do not publish
  a host port for the API.
- Replace browser Firebase callable transport for `castAwardVote`,
  `getAdminInvitation` and `acceptAdminInvitation` with same-origin JSON API
  requests. Reuse existing validation and transaction logic through transport
  independent services. Preserve the existing invitation-token-authorized new
  account provisioning; never accept a client-selected email or role instead of
  the invitation's stored identity. Any API operation relying on signed-in
  identity must verify a Firebase ID token server-side. Invitation lookup must
  not expose stored tokens or unnecessary personal data.
- Preserve all approved ballot behavior: optional identity/anonymous mode,
  browser/category deduplication, atomic totals, private results, archived
  nominations, and the fixed deadline `2026-11-19T14:00:00Z`. Keep Firestore client
  rules unchanged from the audited version. Admin SDK server access bypasses
  rules, so every API operation must validate its inputs and permissions.
- Provision a dedicated backend identity with the Firestore/Auth permissions
  needed for these operations. Supply its service-account credentials as a
  Dokploy runtime secret or read-only mounted secret. Never commit credentials,
  expose them through Vite variables, bake them into images, or reuse interactive
  Firebase CLI login tokens as production credentials. Missing credentials cause
  explicit startup/readiness failure.
- Bound JSON payload sizes and request timeouts, return consistent safe errors,
  and never log personal details or tokens. Keep existing transactional vote
  rate limits; explicitly validate the nginx/Dokploy proxy chain before trusting
  forwarded client IPs. An arbitrary caller-supplied forwarding header must not
  bypass rate limits. Restrict supported origins for browser mutation requests;
  do not treat an origin header as voter identity.
- Configure readiness checks and dependency handling so absent API/credentials
  cannot quietly produce an apparently working voting page. Retain the callable
  source where useful for compatibility/tests, but production browser flows must
  not depend on any deployed Firebase functions.
- Contact/membership email triggers are outside this transport migration. None
  were deployed at audit time; do not claim that moving voting fixes or replaces
  email delivery. Firestore quotas and existing Dokploy capacity still apply.

## Verification and release

Extend existing transaction tests to the Node API transport; test malformed and
oversized input, authentication failures for invitation acceptance, safe response
fields, retry/concurrency behavior, exact closing boundary, and spoofed proxy
headers. Re-run nominee, rules, build and CI checks. Validate Compose/nginx routing
and credential isolation where Docker access permits; disclose local Docker
socket limitations instead of claiming a container smoke test passed.

Update PR #11 and release instructions. Prepare credential setup and the private
nominee import before requesting production release approval. Keep voting closed
through deployment and smoke checks. Theo approves merge and deployment; do not
push directly to main or change Dokploy production settings during implementation.

## Builder choices

Exact API path names, Node HTTP framework, error envelope, service ports,
credential injection format, and proxy-chain configuration belong in the
implementation plan. Prefer existing dependencies or Node built-ins, and retain
server behavior proven by the current transaction tests.
