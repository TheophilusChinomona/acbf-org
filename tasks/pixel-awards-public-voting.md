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

The supplied workbook was not present in this environment, so the 139-nominee
dry run against the real file is still outstanding. `AWARDS_NOMINEES_XLSX=<path>`
turns on the same assertion in
`node --test scripts/awards/normalize-nominees.test.mjs`, which currently runs it
against a committed synthetic fixture of the same shape.

### Deployed rules baseline could not be retrieved

`firestore.rules` did not exist in the repository even though `firebase.json`
referenced it, and no authenticated Firebase tooling was available here to read
the deployed rules. The unrelated collections in the new rules file therefore
follow the audited behaviour in `tasks/complete-firestore-rules.md` and the code
paths under `src/`, with admin provisioning tightened. **The rules must be
diffed against the live rules by Theo before deployment** — see the release
runbook.

### Admin provisioning moved server-side

The previous invitation flow let a fresh account write its own
`users.role = 'admin'` profile and its own `approved_admins` record, and
`admin_invitations` (including live tokens) was publicly readable. Neither can be
authorised by security rules, so `getAdminInvitation` and `acceptAdminInvitation`
now perform the privileged writes with the Admin SDK and the rules deny client
writes. Existing pending invitations keep working because the server still looks
them up by token.
