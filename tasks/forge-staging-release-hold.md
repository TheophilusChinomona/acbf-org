# Stage awards voting and hold production until payment

**Agent:** forge
**Status:** in-progress
**Priority:** high
**Branch:** staging

## Objective

Provide a staging branch for the copied Dokploy service and a draft PR to main.
Theo explicitly requires that production is not released until the client pays.

## Scope

- [ ] Create staging from the completed awards/API feature branch and push it.
- [ ] Prepare private staging environment settings without committing secrets.
- [ ] Document copied-service branch/domain settings and the payment hold.
- [ ] Open draft staging-to-main PR and verify CI.

## Acceptance Criteria

The copied Dokploy service can select staging and docker-compose.yml. Main is not
changed, production is not deployed, no auto-merge is enabled, and voting stays
closed. Staging shares Firebase until explicitly isolated; previews must not be
described as an independent database environment.

## Notes

Existing feature PR #11 is retained for implementation history. Mark it draft
and update its description to direct release review to the staging PR. Do not
merge either PR before payment and Theo's explicit release approval.
