# Brief Template

Copy this structure into `project/brief.md`. Keep it under 140 lines.

```markdown
# Project Brief — <name>

Status: draft|confirmed vX.Y
Date: YYYY-MM-DD
Owner: <name, email>
Company: <company>

## 1. Objective
<One paragraph: outcome, not activity. Include the definition of done.>

## 2. Context and stakeholders
<Business context, teams, approvers, working language, volume and frequency.>

## 3. Current workflow
<Numbered steps as they happen today, including manual work and delays.>

## 4. Target workflow
<Trigger, stages, artifacts, human gates, end state.>

## 5. Apps, data and artifacts
| System | Role | Input/Output | Authoritative? |
| --- | --- | --- | --- |

## 6. Access and constraints
<Accounts, licenses, admin consent, API access, retention/DLP, residency, security. Mark OPEN.>

## 7. Outputs and quality bar
<Exact sections, order, length, language, tone, naming, format, accuracy rules.>

## 8. Approvals and risk
<What needs sign-off, who approves, channel, timeout. Failure modes and fallbacks.>

## 9. Success metrics
<Measurable targets: time, accuracy, capture rate, zero unapproved writes, cost.>

## 10. Phases
<Phase, deliverable, exit criterion. One pilot first.>

## 11. Out of scope (v1)
<Explicit exclusions.>

## 12. Open questions
- OPEN: <question> — owner, due

## Assumptions
- ASSUMPTION: <claim> — verify by <method>

## Changelog
- YYYY-MM-DD vX.Y — <what changed>
```

## Rules

- A brief is a decision record, not a proposal. Write what is true, plus explicit unknowns.
- Every `OPEN:` has an owner or a verification method.
- Prefer tables for apps, phases and metrics.
- If a section is irrelevant, write `Not applicable` with one reason. Do not delete it.
