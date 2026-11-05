# T-012 Publish the case study

Phase: 4
Owner: lead
Status: doing
Depends on: none
Approval gate: none (publication is reviewed before push)
Token budget: 6k in + 3k out

## Objective
Publish the repository and a portfolio case that a recruiter can read in five minutes without opening the code.

## Inputs
- `README.md`
- `runs/2026-11-03-revision-de-sprint-plataforma-de-salud/report.md` (synthetic)
- `runs/brief-2026-W45/brief.md` (synthetic)
- `docs/contracts.md`

## Steps
1. Verify no client name, email, tenant or credential appears in any tracked file.
2. Publish the repository with the MIT license and topics.
3. Write the case: problem, decision, evidence, limits — no invented metrics.
4. Link the repository from the portfolio index.

## Output
- Artifact: public repository URL + `portfolio/cases/meeting-to-delivery.md`
- Handoff: STATUS / ARTIFACT / SUMMARY / NEXT

## Acceptance criteria
- [ ] `git grep` finds no client identifier, no real meeting content, no token.
- [ ] README explains the pipeline and shows the demo commands.
- [ ] The case links to a real, passing test run and a real artifact.
- [ ] A stranger can run the demo with two commands.

## Failure handling
- Any sensitive match -> block publication and sanitize before pushing.

## Notes
The method documents stay public; they are the strongest evidence of how the work is run.
