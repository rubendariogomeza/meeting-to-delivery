---
name: Agent Roster
description: Design the minimal agent team, skills and phased task plan from a confirmed brief. Use after brief approval, or when the roster needs revision.
---

# Agent Roster

## Inputs

Confirmed `project/brief.md`, plus `project/feasibility.md`, `project/token-budget.md` and `project/decisions.md`. Read the templates in `references/`.

## Method

1. Map the target workflow as a value stream: trigger, stage, artifact, approval, next.
2. Mark each stage: deterministic (script), judgment (model), or human (approval).
3. Create a role only if it owns a decision or an artifact. Merge roles that share a model and permissions.
4. Assign the cheapest model that reliably does the job (table below).
5. Give each role: one mission, one input contract, one output path, explicit permissions, a token budget, and a handoff format.
6. Decompose into vertical slices, one per phase. Each task: ID, phase, owner, inputs (file paths), steps, output path, acceptance criteria, approval gate, dependencies, token budget, failure handling.
7. Cap at 6 agents and 12 tasks for phase 1. Cut anything that does not produce a user-visible result.
8. Write `project/roster.md` and `project/tasks/NNN-slug.md`. Ask for approval before scaffolding.

## Model routing (approved shortlist)

| Work | Model | Why |
| --- | --- | --- |
| Lead, report writing, review | `opencode/claude-sonnet-5-5` | judgment, Spanish quality |
| Extraction, normalization, Jira/email operations | `opencode/gpt-6-luna` | cheap, reliable tool use |
| Bulk formatting and classification | `opencode/claude-haiku-5-5` | cheapest |
| Integration code | `opencode/kimi-k2.7-code` | code quality per dollar |
| Compaction and titles | `opencode/claude-haiku-5-5` | cheap |

Alternates: `opencode/gpt-6.1-sol` (quality), `opencode/deepseek-v4-pro` (budget lead), `opencode/gemini-4-argon` (long context). Never use a free model for external writes.

## Rules

- Prefer 4 or 5 agents: lead, analyst, report writer, operator, reviewer.
- No agent for pure formatting; use a script.
- One writer per artifact. Never let two agents edit the same file.
- Operator roles get only the MCP/API tools they need; every write is `ask`.
- Every task ends in a verifiable artifact and a 300-token handoff.
- Any step touching email, Jira or participants requires a named approval gate.

## References

- `references/roster-template.md`
- `references/agent-template.md`
- `references/task-template.md`
