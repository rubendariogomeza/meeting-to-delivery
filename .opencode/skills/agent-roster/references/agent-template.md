# Agent File Template

Save as `.opencode/agents/<id>.md`.

```markdown
---
description: <what it does, when to launch it — shown to the model choosing a subagent>
mode: subagent
model: opencode/gpt-6-luna
steps: 12
permissions:
  - action: edit
    resource: "*"
    effect: deny
  - action: edit
    resource: "runs/**"
    effect: allow
  - action: shell
    resource: "*"
    effect: deny
  - action: question
    resource: "*"
    effect: deny
---

You are the <role> for <project>. Your only job is <mission>.

## Inputs
Read exactly these paths, nothing else:
- `runs/<id>/transcript.txt`
- `project/brief.md` section 7

## Output
Write `<artifact path>`. Then return only:
STATUS: done|blocked
ARTIFACT: <path>
SUMMARY: <=5 bullets
TOKENS: <estimate>
NEXT: <one action or none>

## Rules
- Do not read the full transcript into the summary.
- Do not send email, create Jira issues or modify other artifacts.
- If a required input is missing, return STATUS: blocked with the missing path.
```

## Rules

- `description` is mandatory for subagents; the parent uses it to choose.
- Permissions are the agent's own; a subagent does not inherit the parent's allow rules.
- `steps` should match the task: 8 to 15 for workers, 25 to 40 for the lead.
- Never grant `edit: *` allow to a worker. Scope it to its artifact folder.
