---
name: Meeting Automation
description: Design and operate the meeting-to-execution workflow (Teams transcript to report, Jira tasks and status tracking), executed in Power Automate. Use when planning meeting stages, approvals, artifacts or failure handling.
---

# Meeting Automation

## Runtime boundary

The workflow runs in Power Automate, not in OpenCode. Meeting content must never enter an OpenCode agent context. Agents design the flow, prompt, schemas and tests; they debug with metadata and synthetic data only.

## Target flow

```
Teams meeting (manual transcription, es-ES)
  -> S1 Power Automate detects end + gets transcript       Teams connector
  -> S2 transcript saved, .docx produced                   SharePoint
  -> S3 report generated                                   Copilot Chat API (preview)
  -> S4 review email + G1 approval                          Outlook + Approvals
  -> S5 distribution to attendees                [G2]       Outlook
  -> S6 Jira issues + assignee + sprint          [G3]       Jira connector
  -> S7 status tracking + digest emails          [G4]       Jira + Outlook
```

## Contracts

- **Transcript:** VTT text from the Teams connector, stored in SharePoint. `.docx` is the deliverable; generation path must be deterministic.
- **Report:** Spanish (Spain), four sections in fixed order: Resumen ejecutivo, Acuerdos, Decisiones, Tareas. Every task has owner, due date or "sin fecha", and source quote.
- **Jira map:** `task_id`, `jira_key`, `summary`, `owner_email`, `owner_account_id`, `due`, `source_quote`, `sprint`, `status`.
- **Run folder:** SharePoint folder per meeting ID: `transcript.vtt`, `transcript.docx`, `report.docx`, `copilot-baseline.docx`, `jira-map.json`, `events.log`.

## Copilot call

- Create conversation: `POST /beta/copilot/conversations`.
- Chat: `POST /beta/copilot/conversations/{id}/chat` with `contextualResources.files` set to the SharePoint transcript and web search disabled.
- Delegated auth only. Required scopes: Sites.Read.All, Mail.Read, People.Read.All, OnlineMeetingTranscript.Read.All, Chat.Read, ChannelMessage.Read.All, ExternalItem.Read.All.
- M365 Copilot add-on license required. `/beta` is preview; do not assume stability.
- 60-90 minute meetings: chunk by timestamp, summarize windows, consolidate once.

## Approval gates

| Gate | Approves | Channel | Rule |
| --- | --- | --- | --- |
| G1 | report accuracy and names | Power Automate Approval | block distribution |
| G2 | email to participants | Power Automate Approval | show recipients |
| G3 | Jira create/update/assign | Power Automate Approval | show field diff |
| G4 | status notifications | digest approval | batch |

Timeout stops the run. Never auto-approve.

## Known constraints

- Graph cannot start a Teams transcription; manual start remains.
- The Copilot Chat API is preview and delegated-only; no app-only auth.
- The Jira connector has no generic status-change trigger; use JQL polling or a Jira automation webhook.
- Rovo has no confirmed public API; use the Jira connector and keep Rovo manual if needed.
- Teams attendees include optional, external and distribution-list entries; normalize before sending.

## Failure handling

- No transcript after 30 minutes -> alert organizer, keep the run open.
- Copilot timeout or truncation -> chunk, retry once, then fall back to manual Copilot.
- Name mismatch -> flag with `?`, block distribution until G1.
- Jira field missing -> stage the payload, do not create a partial issue.
- Duplicate run -> key by online meeting ID.
- API preview break -> switch the report stage to Copilot Studio or manual; keep the rest of the flow.

## References

- `project/feasibility.md` — verified capabilities and blocking gates.
- `project/architecture.md` — stage detail, auth, phases.
