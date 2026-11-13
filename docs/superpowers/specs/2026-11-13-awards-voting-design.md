# ACBF public awards voting

Status: proposed; awaiting Theo's approval before implementation.

## Intent and agreed behavior

Replace the public awards nomination experience with voting on the official nominees. Keep Firebase for this launch; PostgreSQL migration is separate future work. Existing nomination submissions must remain available to admins as an archive.

Voting is open to everyone without membership, login, or email verification. Name and email are optional; anonymous voting is supported. Each voter may vote once per category for the competition. All countries compete on one ballot per category. Show both person and business names when present, otherwise whichever is available, plus country and category. Vote totals are private to admins and update as votes arrive.

## Source and import

Use Awards Nominees 5.xlsx supplied on 2026-11-13. It contains 139 nominees from nine countries. Three business names and 21 person names are missing; do not invent replacements. Country values must carry forward through blank country cells. Import only the public fields: category, business name, person name, country. Do not publish source contact numbers, emails, or notes.

Normalize whitespace and obvious category spelling/punctuation variants using an explicit reviewed mapping. Do not silently merge categories whose meaning differs, such as legal services titles with and without “Excellence”; flag ambiguous mappings before import. Give nominees stable IDs so rerunning an import cannot duplicate them or reset votes. Keep the source spreadsheet out of the public bundle.

## Approaches

1. Separate voting records alongside existing nominations: clean separation and clear reporting, with a little more setup. Originally recommended.
2. Convert nomination records to voting records: fewer initial structures, but confuses submissions with official nominees and risks historical data.

Theo chose to archive nominations and replace the public nomination experience. Use separate official nominees and votes, retaining historical nominations in admin. Do not reinterpret old nominations as votes.

## Proposed implementation choices for approval

- Replace nomination forms and calls to action on the awards page with a category ballot, search/filter controls, and clear confirmation. Preserve the existing brand and responsive layout. Public totals, rankings, and voter details are never shown.
- Keep existing Firebase Authentication and admin role checks. Use Firestore for competition configuration, categories, nominees, votes, and private totals. Follow existing hook/component separation.
- Accept votes through a server-controlled Firebase endpoint. Validate the active competition, category/nominee relationship, optional fields, and a browser token. Use an atomic transaction and a unique competition/category/browser key so concurrent submissions or retries count once. Deny direct public writes to votes, totals, and nominee/configuration records.
- Store a random persistent browser token and enforce one vote per category against it on the server. Add server-side rate limits to reduce automated abuse. No device fingerprinting. The product must not promise verified one-person-one-vote: clearing storage or using another browser/device can bypass the limit. Optional unverified email is not proof of identity.
- Votes are final for this launch. No vote editing, paid voting, public leaderboard, or automated winner declaration.
- Add a distinct admin voting view with live totals per nominee, category filters, and overall accepted vote count. Restrict any individual vote records, including optional personal details, to authorized admins. Anonymous entries show “Anonymous.” Reuse the existing Excel export utility if export is included in the implementation plan.
- Provide an explicit competition open/closed configuration, defaulting closed until the approved launch. Theo confirmed that voting closes on 19 November 2026 at 16:00 SAST (UTC+2), equivalent to 2026-11-19T14:00:00Z. Reject votes at or after this deadline using server time, regardless of browser time or whether the page remains open. Display the deadline and timezone publicly. An admin open flag cannot bypass the deadline. The opening time is not yet supplied. Closing retains results and history.
- Preserve the existing awards nominations admin functionality as a clearly labeled archive. Disable new public nomination submissions at both the UI and backend/security-rule layer, without deleting records or altering unrelated submission types.

## Constraints and safety

Do not change Firebase credentials, legacy PHP, approved brand assets, or SMTP secrets. Audit existing submission rules before tightening nominations so contacts and membership remain functional. Firebase function/rule changes need explicit deployment alongside frontend changes; a frontend-only release cannot safely launch voting. Theo approves PRs and production deployments. Leave the existing unrelated package-lock.json change untouched.

## Acceptance criteria

- All 139 source nominees appear once with the agreed display fallback and country; category mappings are reviewed before publication.
- Public visitors can vote without login or personal details. Optional fields are validated when supplied and are never public.
- Duplicate/concurrent submissions for the same browser/category count once; another category remains available. A failed request can be retried safely.
- Closed voting, invalid nominees, direct writes, and unauthorized reads of totals/voter data are rejected server-side. Verify the exact deadline boundary: votes before 2026-11-19T14:00:00Z may be accepted when open; votes at or after it are rejected.
- Admin totals update after accepted votes and remain correct under concurrent voting. Existing nomination records remain accessible.
- Mobile, keyboard navigation, loading/error states, and submission confirmation work. Relevant security/transaction checks, lint, and production build pass before review; pre-existing failures are reported separately.

## Left to the builder

Choose precise component layout, collection/endpoint names, rate-limit parameters, and transaction/counter structure after inspecting existing Firebase rules and hosting configuration. Avoid exposing voter data through subscriptions or public aggregates. Assess expected load and retain vote records as the source for reconciling counts. No additional provider or paid service is approved by this design.

## Separate future project

Full Firebase-to-PostgreSQL migration, including authentication, member data, permissions, and email workflows, is out of scope for voting launch.
