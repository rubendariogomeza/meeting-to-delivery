# T-011 Jira live validation

Phase: 3
Owner: jira
Status: todo
Depends on: none
Approval gate: G3 (Jira create/update/assign)
Token budget: 8k in + 2k out

## Objective
Prove the dry-run plan against a real Jira Cloud project with one test issue, then document the exact field mapping.

## Inputs
- `src/jira/plan.ts`, `src/jira/client.ts`
- `.env.example` — `JIRA_*` variables
- A Jira Cloud project with permission to create issues

## Steps
1. Create one issue from `fixtures/history/tasks.json` with `--apply`.
2. Confirm assignee resolution by email and that `duedate` is accepted.
3. Re-run with the same meeting label; confirm the plan is skipped, not duplicated.
4. Write `docs/jira.md` with the mapping table and the accountId requirement.

## Output
- Artifact: `docs/jira.md`
- Handoff: STATUS / ARTIFACT / SUMMARY / NEXT

## Acceptance criteria
- [ ] First run creates exactly one issue per task.
- [ ] Second run creates zero issues and reports why.
- [ ] A task without email creates the issue unassigned and warns.
- [ ] Nothing is written without `--apply`.

## Failure handling
- 400 on a field -> stage the payload, do not create partial issues.
- Duplicate detection unavailable -> stop instead of guessing.

## Notes
The client decides the project and issue type. Defaults are `Task` and the plan's labels.
