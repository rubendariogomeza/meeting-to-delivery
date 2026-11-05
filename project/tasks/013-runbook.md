# T-013 Runbook and deployment

Phase: 4
Owner: ops
Status: todo
Depends on: T-010, T-011
Approval gate: none
Token budget: 10k in + 4k out

## Objective
Document how to run the engine unattended for a client: where it runs, how it fails, who gets notified and how to roll back.

## Inputs
- `src/commands/meeting.ts`, `src/commands/brief.ts`
- `project/architecture.md` — Power Automate stages
- Client infrastructure decision (Azure Function, container or Power Automate)

## Steps
1. Choose the runtime per client: container, Azure Function, or Power Automate with a custom connector.
2. Write install, upgrade and rollback steps.
3. Define alerts: failed run, missing transcript, Jira rejection, model fallback.
4. Define retention for transcripts, reports and run manifests.

## Output
- Artifact: `docs/runbook.md`
- Handoff: STATUS / ARTIFACT / SUMMARY / NEXT

## Acceptance criteria
- [ ] A new operator can install from the runbook without asking questions.
- [ ] Every failure mode has a named alert and an owner.
- [ ] Retention is explicit for transcripts, reports and logs.
- [ ] Rollback restores the previous version without data loss.

## Failure handling
- No runtime decision -> document both options and mark the task blocked.

## Notes
Do not store transcripts longer than the client's policy allows.
