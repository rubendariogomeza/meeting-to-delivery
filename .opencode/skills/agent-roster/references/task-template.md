# Task Template

One file per task: `project/tasks/NNN-slug.md`.

```markdown
# T-<NNN> <title>

Phase: <0-4>
Owner: <agent id>
Status: todo|doing|blocked|done
Depends on: <task ids or none>
Approval gate: <none | named gate>
Token budget: <input + output tokens>

## Objective
<One sentence: the user-visible result.>

## Inputs
- `<path>` — <what it contains>
- <system/API> — <scope needed>

## Steps
1. <deterministic step>
2. <model or human step>
3. <write artifact>

## Output
- Artifact: `<path>`
- Handoff: STATUS / ARTIFACT / SUMMARY (<=300 tokens) / NEXT

## Acceptance criteria
- [ ] <verifiable condition>
- [ ] <verifiable condition>

## Failure handling
- <failure> -> <retry/fallback/escalation>

## Notes
<Links, open questions, risks.>
```

## Rules

- Acceptance criteria must be checkable by a script or a reviewer, not by vibes.
- One owner. If two agents are needed, split the task.
- Every external write names its approval gate.
- Keep the file under 60 lines.
