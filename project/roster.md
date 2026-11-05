# Agent Roster — Meeting to Delivery

Status: approved v1.0
Date: 2026-11-05
Brief: project/brief.md (confirmed v0.3)

## Team

| ID | Mission | Mode | Model | Owns | Skills | Token budget |
| --- | --- | --- | --- | --- | --- | --- |
| lead | Interview, brief, decisions, phase control | primary | claude-sonnet-5-5 | `project/brief.md`, `project/decisions.md`, `project/roster.md` | project-brief, agent-roster, token-discipline | 40k/session |
| architect | Contracts, pipeline boundaries, code review | subagent | claude-sonnet-5-5 | `docs/contracts.md`, `src/core/` | engine-contracts | 25k/run |
| jira | Jira plan, field mapping, idempotency | subagent | gpt-6-luna | `src/jira/`, `docs/jira.md` | jira-sync | 15k/run |
| qa | Synthetic fixtures, regression, end-to-end demo | subagent | claude-haiku-5-5 | `tests/`, `fixtures/` | qa-fixtures | 20k/run |
| ops | Runbook, deployment, monitoring, cost | subagent | gpt-6-luna | `docs/runbook.md` | deployment-runbook | 12k/run |

Five roles, no ornamental ones. Deterministic parsing lives in scripts, not in an agent.

## Handoffs

| From | To | Artifact | Contract | Approval |
| --- | --- | --- | --- | --- |
| lead | architect | confirmed brief + decisions | `project/brief.md` | none |
| architect | qa | schemas and invariants | `docs/contracts.md` | review |
| qa | jira | validated `tasks.json` in a synthetic run | task schema | none |
| jira | ops | verified `jira-plan.json` and dry-run log | plan schema | G3 before any write |
| ops | lead | runbook and incident notes | `docs/runbook.md` | none |

## Permissions matrix

| Agent | Files | Shell | External tools | Subagents |
| --- | --- | --- | --- | --- |
| lead | `project/**` write, rest read | deny | none | explore only |
| architect | `src/core/**`, `docs/**` | ask | none | none |
| jira | `src/jira/**` | ask | Jira REST, dry-run by default | none |
| qa | `tests/**`, `fixtures/**` | ask | none | none |
| ops | `docs/runbook.md` | ask | none | none |

## Skills to build

| Skill | Used by | Purpose | Phase |
| --- | --- | --- | --- |
| engine-contracts | architect | Schema changes without breaking artifacts | 1 (done) |
| jira-sync | jira | Field mapping and duplicate avoidance | 3 |
| qa-fixtures | qa | Synthetic transcripts and regression runs | 1 (done) |
| deployment-runbook | ops | Azure Function / Power Automate packaging | 4 |

## Risks

- **Agent reads real content** — forbidden by D-015 and D-018; tests use synthetic data only.
- **Schema drift** — one source of truth in `src/core/schemas.ts`; every artifact is parsed before use.
- **Duplicate Jira issues** — meeting label checked before writing; dry run is the default.
- **Model cost creep** — the model is optional and never used for extraction.
