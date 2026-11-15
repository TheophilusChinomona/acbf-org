# Awards staging and production payment hold

## Release instruction

Theo requires this work to remain off the live site until the client pays.
Do not merge staging or feature PR #11 into main, enable auto-merge, change the
live Dokploy service's branch, or deploy the new app to the production domain.
Payment does not itself authorize a merge: Theo still approves the release.

## Copied Dokploy Compose service

Configure the **acbf (copy)** service only:

1. Branch: `staging`; Compose Path: `./docker-compose.yml`. Save the provider
   settings before triggering a staging deployment. Leave the live service alone.
2. In Domains, route `staging.acbf.org.za` to service `prod`, port `80`. This is
   the proposed staging hostname; if another subdomain is chosen, use its exact
   browser origin in PUBLIC_ORIGIN too. Wildcard DNS does not create this Dokploy
   hostname route or confirm the Cloudflare Tunnel ingress configuration.
3. Copy private `.env.staging` into the copied service's Environment editor.
   It uses `PUBLIC_ORIGIN=https://staging.acbf.org.za` and the verified proxy
   subnet `10.0.1.0/24`. Neither private environment file belongs in Git.
4. Deploy the copied service from staging after checking its branch/domain and
   environment. Check `/api/v1/health`, `/api/v1/ready`, and the awards page.
   Verify real client IP and forged-header behavior before considering launch.
5. Add the staging hostname to Firebase Auth's authorized domains if the chosen
   authentication flow requires it. No auth-domain settings were changed here.

The workspace cannot control the remote Dokploy service. The branch, private
environment preparation and PR can be completed here; saving the remote settings
and deploying the copied service are operator actions.

## Firebase data boundary

The prepared staging environment currently points to `acbf-rsa-backend`, the same
Firestore/Auth project as production. A copied Compose service is not a copied
database. Competition 2026 remains closed with the official nominees and no test
votes. Do not open it, create test admin invitations/accounts, or edit production
membership records to test a preview. Full write testing needs a separately
authorized isolated Firebase project/emulator environment.

Only additive voting rules have been published. The full archival/invitation
hardening rules remain tied to the coordinated production release; do not deploy
the full rules simply to make a staging login or invitation work, because those
rules also affect the current live site.

## After payment

Theo reviews the staging PR and explicitly approves release. Recheck production
environment/origin, proxy trust, rules baseline, backups, admin roster and the
deadline before merging. Main auto-deploys the original live service; merging is a
production action. Voting opens only on Theo's separate launch instruction.
