# Stage awards voting and hold production until payment

**Agent:** forge
**Status:** done
**Priority:** high
**Branch:** staging

## Objective

Provide a staging branch for the copied Dokploy service and a draft PR to main.
Theo explicitly requires that production is not released until the client pays.

## Scope

- [x] Create staging from the completed awards/API feature branch and push it.
- [x] Prepare private staging environment settings without committing secrets.
- [x] Document copied-service branch/domain settings and the payment hold.
- [x] Open draft staging-to-main PR and inspect CI status.

## Acceptance Criteria

The copied Dokploy service can select staging and docker-compose.yml. Main is not
changed, production is not deployed, no auto-merge is enabled, and voting stays
closed. Staging shares Firebase until explicitly isolated; previews must not be
described as an independent database environment.

## Notes

Existing feature PR #11 is retained for implementation history. Mark it draft
and update its description to direct release review to the staging PR. Do not
merge either PR before payment and Theo's explicit release approval.

### Result

Created/pushed staging from the completed feature work. Draft release PR:
https://github.com/TheophilusChinomona/acbf-org/pull/12. Feature PR #11 is now draft
with no auto-merge. Main remains at 9ad7984a6a11c75ff26670f6ea75b59827b81a09;
no live deploy or remote Dokploy setting change was performed.

Private .env.staging prepared and checked: origin staging.acbf.org.za, proxy
subnet 10.0.1.0/24, existing dedicated runtime credential, all excluded from Git.
CI is triggered through PR #12; require it green before requesting release review.
The remote branch/domain/environment settings must still be saved by the operator.
Production remains held until payment plus Theo's explicit release approval.
