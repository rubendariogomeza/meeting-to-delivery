# Roster Template

```markdown
# Agent Roster — <project>

Status: draft|approved vX.Y
Date: YYYY-MM-DD
Brief: project/brief.md (confirmed vX.Y)

## Team

| ID | Mission | Mode | Model | Owns | Skills | Token budget |
| --- | --- | --- | --- | --- | --- | --- |
| lead | ... | primary | claude-sonnet-5-5 | brief, roster | project-brief, agent-roster | 40k/session |
| analyst | ... | subagent | gpt-6-luna | normalized transcript + task candidates | meeting-analysis | 20k/run |
| writer | ... | subagent | claude-sonnet-5-5 | report.md/.docx | report-writing | 25k/run |
| operator | ... | subagent | gpt-6-luna | emails, Jira issues | graph-mail, jira-sync | 15k/run |
| reviewer | ... | subagent | claude-sonnet-5-5 | QA findings | quality-review | 10k/run |

## Handoffs

| From | To | Artifact | Contract | Approval |
| --- | --- | --- | --- | --- |

## Permissions matrix

| Agent | Files | Shell | External tools | Subagents |
| --- | --- | --- | --- | --- |

## Skills to build

| Skill | Used by | Purpose | Phase |
| --- | --- | --- | --- |

## Risks

- <risk> — <mitigation>
```

## Rules

- Every role appears in a handoff and owns at least one task.
- Budgets are per run, not per month; the lead tracks the sum.
- If two roles can be merged without losing a checkpoint, merge them.
