# Artifact contracts

Every artifact is validated against `src/core/schemas.ts` before the next stage reads it. A file that does not validate never reaches Jira, email or the brief.

## Task

| Field | Type | Rule |
| --- | --- | --- |
| `id` | string | `T-001` within a meeting |
| `meetingId` | string | `<date>-<slug>` of the meeting |
| `summary` | string | 3–200 characters, infinitive, no date repeated |
| `owner.name` | string | attendee name or `sin asignar` |
| `owner.email` | string \| null | null when the attendee has no email |
| `due.date` | `YYYY-MM-DD` \| null | null when the transcript says nothing dateable |
| `due.raw` | string \| null | the matched expression, for audit |
| `priority` | `alta` \| `media` \| `baja` | keyword-based |
| `confidence` | `alta` \| `media` \| `baja` | owner + date, one of them, or neither |
| `sourceQuote` | string | the sentence the task came from |
| `status` | `abierta` \| `en_progreso` \| `bloqueada` \| `cerrada` | starts as `abierta` |
| `history` | array | `{ at, status, note }`, append-only |

```json
{
  "id": "T-002",
  "meetingId": "2026-11-03-revision-de-sprint-plataforma-de-salud",
  "summary": "Preparar el plan de migración del esquema de facturación",
  "owner": { "name": "Luis Mejía", "email": "luis.mejia@example.com" },
  "due": { "date": "2026-11-20", "raw": "20 de noviembre" },
  "priority": "alta",
  "confidence": "alta",
  "sourceQuote": "TAREA: preparar el plan de migración — responsable: Luis — fecha: 20 de noviembre",
  "status": "abierta",
  "history": [{ "at": "2026-11-03T18:00:00Z", "status": "abierta", "note": "Creada desde la reunión." }]
}
```

## Report

| Field | Type | Rule |
| --- | --- | --- |
| `executiveSummary` | string | only facts and counts from the run |
| `agreements` | string[] | deduplicated, no task repeated |
| `decisions` | string[] | deduplicated, no task repeated |
| `taskIds` | string[] | must match the task file exactly |
| `participants` | string[] | from the header or the speakers |
| `warnings` | string[] | everything a human must review |

## Jira plan

| Field | Type | Rule |
| --- | --- | --- |
| `projectKey` | string | upper case |
| `issues[].clientRef` | string | task id |
| `issues[].labels` | string[] | `meeting-followup` + `mtg-<meetingId>` |
| `issues[].assignee` | object | email is null when unknown; Jira needs an accountId |
| `warnings` | string[] | missing emails, dropped duplicates |

The client writes only with `--apply`. Before writing, it searches for the meeting label; if any issue exists, it skips the plan.

## Brief

| Field | Type | Rule |
| --- | --- | --- |
| `window` | `{from,to}` | ISO dates, default last 7 days |
| `counts` | object | computed, never estimated |
| `moved` | array | status changed inside the window |
| `stalled` | array | open and no update for more than 14 days |
| `decisions` | array | unassigned, overdue, or blocked more than 7 days |
| `risks` | array | only above the configured thresholds, each with evidence |

## Invariants

1. No owner is invented: an unknown name becomes `sin asignar`.
2. No date is invented: no match means `null`.
3. Every task keeps its source sentence.
4. Tasks with the same summary (token similarity ≥ 0.72) merge, and the merge is logged.
5. A plan with an issue missing a summary or project key fails validation instead of writing partial data.
6. The brief never reports a metric it cannot compute from the task store.
