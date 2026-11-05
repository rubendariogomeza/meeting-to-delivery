---
name: Project Brief
description: Interview the user and produce a confirmed, file-based project brief. Use at project start, or when the brief is draft or stale.
---

# Project Brief

## Goal

A brief another agent could execute from without asking the user anything already answered. Target 80 to 140 lines. Facts, not prose.

## Steps

1. Read `project/brief.md` and `project/decisions.md`.
2. Read `references/brief-template.md`.
3. Build a gap list (maximum 10) across the 12 sections. Skip anything already answered.
4. Ask in up to three rounds: scope and outcome, then apps/data/access, then quality/approvals/metrics. Maximum 6 questions per round.
5. After each round: rewrite the brief in place, bump the version (0.1 to 0.2), add a changelog line, keep `OPEN:` and `ASSUMPTION:` markers.
6. When gaps are closed, ask for approval. On approval set `Status: confirmed`, date it, and append an entry to `project/decisions.md`.
7. Summarize in 6 lines or fewer and point to the file.

## Question quality

- One decision per question. No compound questions.
- Options are concrete and mutually exclusive; recommended first, labeled "(Recommended)".
- Ask for numbers: meetings per week, attendees, duration, issue volume, deadline.
- Ask for examples: one real meeting, one real report, one real Jira issue.
- Challenge scope: what is explicitly out of scope for phase 1?
- For access, ask what exists, never for the secret itself.

## Question bank

- **Scope:** Which single outcome proves the project works? What is out of scope? Hard deadline? Who signs off?
- **Workflow:** Trigger? Steps today? Who does each step? How often? Volume? Exceptions?
- **Apps:** Systems of record? Where does each artifact live? Which app is authoritative? Languages?
- **Access:** App registration? Admin consent? API tokens? Test tenant? DLP or retention policies?
- **Outputs:** Exact sections, order, length, language, tone, naming, format (.docx/.md/email)?
- **Approvals:** Which writes need sign-off? Who approves? Channel? Timeout?
- **Metrics:** Minutes saved per meeting? Accuracy threshold for names and decisions? Task capture rate? Adoption?
- **Failures:** Transcript late or empty? Wrong language? Jira field missing? Attendee list wrong?

## Brief quality gate

- Every section filled, or explicitly `OPEN:` with an owner.
- Trigger, inputs, outputs, approval points and failure handling are unambiguous.
- Success is measurable.
- Phase 1 scope fits one pilot meeting.
- No secrets, no personal data beyond work contact details.

## References

- `references/brief-template.md`
