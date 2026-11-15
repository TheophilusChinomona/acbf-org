# Correct Dr Mandas Marikanda's nominee affiliation

**Agent:** backend
**Status:** done
**Priority:** high
**Branch:** staging

## Objective
Remove the former bank affiliation from the Financial Services Excellence Award nominee, as requested by Theo on 14 November 2026.

## Scope
- [x] Clear only the nominee's businessName in the shared Firestore catalogue.
- [x] Read back the record and retain name, country, category and stable nominee ID.

## Context
This is an authorized catalogue data correction, not a frontend deployment.
Original businessName: Zimbabwe Women Microfinance Bank.
Keep personName: Dr Mandas Marikanda.

## Acceptance Criteria
The ballot displays her name without the bank affiliation. Existing votes remain attached to the same nominee ID.

## Notes
A future workbook re-import must preserve this correction without regenerating the nominee ID.

Verified by Firestore read-back on 14 November 2026: businessName is empty; all other fields and the document ID are unchanged. No votes, totals, competition settings or deployment were modified. No application code change or PR is needed for this data-only correction.
