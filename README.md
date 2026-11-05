# Project Management Agents System

**A working engine that turns a meeting transcript into a reviewed report, Jira-ready tasks, and a weekly delivery brief that shows what moved, what is stuck, and what needs a decision.**

Meetings produce commitments. Most teams lose them in a chat thread, a notebook, or a Jira board nobody opens. This project closes that loop with two commands that share one data contract — and it does it without inventing a single date, owner or metric.

```bash
npm install
npm run demo
```

No tenant, no credentials, no network. The demo writes a full run into `runs/` in under a second.

---

## The pipeline

```
transcript (.txt / .vtt / .docx)
  └─ meeting  →  report.md · tasks.json · jira-plan.json · review.eml · distribution.eml
tasks.json (+ status history)
  └─ brief    →  brief.md · brief.json
```

| Stage | Input | Output | Who decides |
| --- | --- | --- | --- |
| Ingest | transcript | normalized lines, metadata, participants | parser |
| Extract | lines + attendee list | tasks with owner, due date and source quote | rules |
| Report | transcript + tasks | four sections: summary, agreements, decisions, tasks | rules, optionally a model for prose |
| Jira | tasks | `jira-plan.json`, dry-run by default | rules |
| Mail | report + tasks | review and distribution `.eml` | rules |
| Brief | task store + history | moved / stalled / decisions / risks | rules |

## The design decision that matters

**The model writes prose; the code owns commitments.**

A language model can phrase a summary. It cannot be trusted to invent who promised what, or when. So:

- Owners are resolved against the attendee list. An unknown name becomes `sin asignar`, never a guess.
- Dates come from an explicit parser. If the transcript says nothing dateable, the task has no date and is flagged.
- Duplicate commitments across different sentences are merged.
- Every task keeps the sentence it came from (`sourceQuote`) and a confidence level.
- Every artifact is validated against a schema before the next stage reads it.

The optional LLM stage (`--engine llm`) only rewrites the executive summary, agreements and decisions. Tasks, owners and dates stay deterministic. If the model fails or returns something invalid, the pipeline falls back to the deterministic report and records a warning.

## What the brief answers

A dashboard shows everything and explains nothing. The brief answers four questions, with the evidence next to each claim:

| Section | Question | Rule |
| --- | --- | --- |
| Moved | What changed this week? | status transitions inside the window |
| Stalled | What has not moved? | no update for more than 14 days |
| Decisions | What needs a human now? | unassigned, overdue, or blocked more than 7 days |
| Risks | Where is the delivery concentrated? | ownership, overdue ratio, stalled ratio |

Example output from the demo: 17 open tasks, 8 stalled, 7 decisions, 4 risks — including "Luis Mejía has 7 of 17 open tasks (41 %)".

## Commands

```bash
# One meeting, deterministic engine
npm run meeting -- \
  --transcript fixtures/transcripts/sprint-2026-11-03.txt \
  --attendees fixtures/attendees.json \
  --project-key DEMO \
  --organizer-email you@example.com

# Weekly brief
npm run brief -- \
  --tasks fixtures/history/tasks.json \
  --team "Plataforma de salud" \
  --now 2026-11-05T18:00:00Z

# Full demo
npm run demo

# Quality
npm test
npm run typecheck
```

Run `npm run cli -- help` for every option.

### Optional integrations

| Variable | Effect |
| --- | --- |
| `LLM_API_KEY`, `LLM_BASE_URL`, `LLM_MODEL` | narrative report with an OpenAI-compatible endpoint |
| `JIRA_BASE_URL`, `JIRA_EMAIL`, `JIRA_API_TOKEN`, `JIRA_PROJECT_KEY` | real Jira writes, only with `--apply` |

Without `--apply`, the Jira stage is a dry run: it produces the plan and writes nothing. With it, the engine first searches for an issue carrying the meeting label and skips the whole plan if one exists, so a retry never duplicates tasks.

## Architecture

```
src/
  core/        schemas (zod), dates, text, file IO
  ingest/      transcript parsing (.txt/.vtt/.docx) and docx text extraction
  tasks/       owner resolution, date parsing, task extraction, dedupe
  report/      deterministic report, optional LLM enhancement, markdown
  jira/        plan builder and REST client (dry-run, idempotent)
  mail/        .eml writer and email copy
  brief/       weekly computation and markdown
  commands/    runMeeting, runBrief
  cli.ts       command line
fixtures/      synthetic transcript, attendees and 3 weeks of task history
tests/         41 tests over the pure logic and an end-to-end run
project/       the method: brief, architecture, feasibility, security review, decisions
```

## Enterprise deployment (Microsoft 365)

The original engagement ran inside a Microsoft 365 tenant: Teams transcript, Copilot report, Outlook distribution, Jira tasks, Power Automate as the runtime. That path is documented — and still unverified — in [`project/architecture.md`](project/architecture.md), [`project/feasibility.md`](project/feasibility.md) and [`project/security-review.md`](project/security-review.md).

This repository ships the portable core. Microsoft Graph, Copilot and Power Automate are **deployment adapters**, not runtime requirements: a client with a locked-down tenant can run the same rules and contracts inside their boundary.

What is deliberately missing: automatic transcript retrieval. The Teams Graph API and the Copilot Chat API require delegated scopes, admin consent and a Copilot add-on license. Those are blockers for a client, not for a demo, so they are documented instead of faked.

## The method

`project/` is not filler. It is the same sequence a paid engagement follows:

`brief` → `feasibility` → `security-review` → `decisions` → `architecture` → `roster` → `tasks`

Two documents worth reading before judging the code:

- **`project/feasibility.md`** — 16 capabilities, each with status, risk and how to verify it. Anything unverified says so.
- **`project/security-review.md`** — three report engines compared on data boundary, permissions, retention and audit, with the recommendation and the questions to ask IT.

## Limits

- The heuristic engine understands Spanish meeting cues, not arbitrary language. It is tuned for Spanish (Spain/LatAm) transcripts.
- Transcript acquisition is manual. The engine starts at a file, not at a Teams meeting.
- Jira duplicate detection is per meeting label, not per task content.
- The LLM path requires an OpenAI-compatible endpoint; it only rewrites narrative sections.
- The brief assumes a task store with status history. Without history it can still count, but not show movement.

## Security

- No credentials in the repository. `.env` is ignored; `.env.example` lists the variable names.
- Nothing is sent: emails are written as `.eml` files.
- Jira writes require `--apply` and explicit environment configuration.
- Fixtures are synthetic. The project never contains real meeting content.
- Transcripts contain personal data. Confirm retention and data-protection rules before processing real ones.

## Status

| Phase | Scope | State |
| --- | --- | --- |
| 0 | Brief, feasibility, security review, decisions, roster | Complete |
| 1 | Portable engine: ingest, report, tasks, Jira plan, email, brief | Complete |
| 2 | Power Automate pilot inside a Microsoft 365 tenant | Blocked on client access |
| 3 | Distribution, Jira writes, status tracking | Dry-run implemented |
| 4 | Hardening, runbook, cost review | Pending |

## Agent team

The repository is also a working OpenCode project: `lead` is the default agent, with skills for the brief, the roster and token discipline.

```
/brief    interview, then write project/brief.md
/roster   design agents and tasks before scaffolding anything
/status   current phase and open questions
```

The agents design and operate; they never read real meeting content. That boundary is a decision, not an accident — see `project/decisions.md` (D-015, D-018, D-022).

## License

MIT — see [`LICENSE`](LICENSE).
