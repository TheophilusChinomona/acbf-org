# Live Firestore rule comparison

Audited 13 November 2026 after successful Firebase CLI login to the configured
`acbf-rsa-backend` project. Retrieved the published `cloud.firestore` release and
its ruleset using authenticated, read-only Firebase Rules API calls. The private
baseline is outside the repository; no credentials or application data are saved
in this report. Nothing has been published or imported.

## Findings and resolution

| Area | Live behavior | Proposed release behavior |
|---|---|---|
| Voting | No access rules | Public catalogue; approved-admin-only votes/totals; server-only writes |
| Nominations | Public creates, admin changes/deletes | Public creates closed; admin reads/updates preserved; deletes denied |
| Member registration | Client may create a profile with admin/super-admin role | Pending member only; privileged invitation acceptance is server-side |
| Admin authority | Profile role or approved-admin record | Approved-admin record or fixed super-admin identity; profile role alone grants nothing |
| Invitations | Tokens publicly readable | Admin-only reads; server lookup/acceptance callable |
| Membership reads | Matching signed-in applicant email or admin | Same privacy boundary restored after finding a public-read regression in the proposed file |
| Membership linking | Matching applicant email | Matching applicant email and linking UID must equal caller UID |
| Membership input | Required name/email/phone/business type strings | Same type requirements restored |
| Admin applications | Authenticated caller may submit their own pending application | Same create flow restored; owner/super-admin reads remain |
| Contact submissions | Public validated create, admin management | Same functional access retained with hardened admin authority |

All live collection match blocks are represented in the proposed rules. No new
unrelated collection access is assumed. Preserve the intentional security changes
for profile roles and invitation tokens; do not restore public access merely to
make the frontend work.

## Release checks still required

- Check legitimate existing administrators have approved `approved_admins`
  records before switching away from role-only authority. Do not automatically
  promote every profile labelled admin: live profile creation permits self-assigned
  roles, so those labels are not trustworthy evidence.
- The existing registration page attempts pre-login application prefill, but the
  deployed rules already deny unauthenticated access. Do not solve that existing
  mismatch by exposing applicants' details. A separate secure registration lookup
  would require its own authorization design.
- `firebase functions:list` returned no functions. Validate backend billing/IAM
  and SMTP configuration before the first production function deployment. Scope
  a voting/invitation release explicitly rather than assuming email triggers
  already run in production.
- Production import requires Admin SDK application-default credentials; Firebase
  CLI login alone is not proof that the importer can authenticate.
- Re-fetch the live rules immediately before approved publication. Deploy the
  invitation/voting functions before rules and Dokploy frontend as described in
  the release runbook. Keep voting closed until final smoke checks and approval.

## Confirmed billing blocker

Authenticated read-only Cloud Billing API check on 13 November 2026 returned
`billingEnabled: false` for `acbf-rsa-backend`. The project must have billing
linked / be on Blaze before deploying the callable backend. This audit did not
change the billing plan, deploy code/rules, import nominees, or open voting.

## Subsequent authorized preparation

After owner authorization, the official catalogue was imported closed and
additive voting-only rules were published. Existing nomination/invitation rules
are deliberately retained until the coordinated Dokploy API/frontend deployment.
Full hardening in the repository's firestore.rules is still pending that release.
Three approved admin records match all three existing admin-role profiles; no
profile needed promotion. Dedicated API credentials were verified successfully.
