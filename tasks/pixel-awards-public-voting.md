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
