# Architecture — Microsoft-Native Runtime

Status: draft v0.3, 2026-11-03.
Constraint: meeting content never leaves Microsoft 365 / Power Platform. OpenCode agents design, build and operate; they do not read transcripts or reports.

## Two runtimes

| Runtime | Where | Purpose |
| --- | --- | --- |
| Portable core | This repository, Node + TypeScript | Reference implementation; runs with synthetic data, no tenant |
| Microsoft-native deployment | Power Automate + M365 connectors | Client deployment inside their compliance boundary |

The stages below are identical in both. The core implements them with files; a client deployment replaces file input/output with Teams, SharePoint, Outlook and Jira connectors. See D-022 in `project/decisions.md`.

## Runtime

```
Outlook/Teams meeting (manual transcription, es-ES)
  |
  v
Power Automate flow
  S1 detect meeting end + get transcript        Teams connector
  S2 store transcript + build .docx             SharePoint, Word connector
  S3 generate report                            M365 Copilot Chat API (preview)
  S4 review email + G1 approval                 Outlook + Power Automate Approvals
  S5 distribution to attendees       [G2]       Outlook
  S6 create/assign Jira issues       [G3]       Jira connector / Rovo if API
  S7 track status + digest emails    [G4]       Jira trigger + Outlook
```

## Stage detail

| Stage | Action | Connector / API | Artifact |
| --- | --- | --- | --- |
| S1 | List and get meeting transcript for a meeting that just ended | Teams connector: `List meeting transcripts`, `Get meeting transcript content` | transcript text (VTT) |
| S2 | Save transcript to SharePoint; produce `.docx` | SharePoint `Create file`; Word Online connector or Office Scripts | `transcript.vtt`, `transcript.docx` |
| S3 | Create Copilot conversation, then chat with the transcript file as context | `POST /beta/copilot/conversations`; `POST /beta/copilot/conversations/{id}/chat` | report text |
| S4 | Save report `.docx`, email organizer, request approval | Word/SharePoint; Outlook; Approvals | `report.docx`, approval record |
| S5 | On approval, email attendees with the report | Outlook `Send an email` | sent record |
| S6 | Parse tasks, create Jira issues, assign, set sprint | Jira connector `Create a new issue (V3)`, `Edit Issue` | `jira-map.json` |
| S7 | React to status changes, send digest | Jira trigger/JQL poll + Outlook | status digest |

## Copilot call contract

```http
POST https://graph.microsoft.com/beta/copilot/conversations
{}

POST https://graph.microsoft.com/beta/copilot/conversations/{id}/chat
{
  "message": {
    "text": "<prompt: Spanish, four fixed sections, names from attendee list, no invention>"
  },
  "locationHint": { "timeZone": "Europe/Madrid" },
  "contextualResources": {
    "files": [{ "uri": "<SharePoint transcript URL>" }],
    "webContext": { "isWebEnabled": false }
  }
}
```

Constraints from Microsoft docs:

- `/beta` preview; not supported for production. Accept the risk or use Copilot Studio.
- Delegated permissions only. No application permissions.
- Required scopes: `Sites.Read.All`, `Mail.Read`, `People.Read.All`, `OnlineMeetingTranscript.Read.All`, `Chat.Read`, `ChannelMessage.Read.All`, `ExternalItem.Read.All`.
- Requires an M365 Copilot add-on license.
- Text responses only; no file creation, email or long-running tasks.
- File context must be a OneDrive/SharePoint URI.

## Auth

- Copilot API: custom connector with OAuth 2.0 authorization code, delegated scopes, per-user connection; or an Azure Function using on-behalf-of. Custom connector is simpler.
- Teams/SharePoint/Outlook: standard connectors.
- Jira: Jira connector with API token or OAuth (Premium).
- Approvals: Power Automate Approvals (Premium), organizer as approver.
- No secrets in the repo or in agent prompts.

## Long meetings (60-90 minutes)

- Try one pass first; the API may handle it.
- If truncated or slow: split the transcript into 20-30 minute windows by timestamp, summarize each in the same conversation, then ask for the consolidated four-section report.
- Budget 2-4 Copilot calls per meeting. Never send the whole transcript to the agent team.

## Shadow mode

For the first 3 meetings, keep the manual Copilot report as `copilot-baseline.docx` and diff it against the automated report. Exit shadow mode only when the automated report needs at most two name corrections and misses no decision.

## Trigger

- Phase 2: recurrence every 15 minutes, look back 30 minutes for meetings that ended and have a transcript.
- Deduplicate by online meeting ID, not title.
- Retry transcript retrieval with backoff for up to 30 minutes.
- Phase 3 can add a manual "Run now" button with the meeting ID as input.

## Agent team boundary

| Work | Where | Who |
| --- | --- | --- |
| Brief, roster, design | OpenCode | lead |
| Flow specification, expressions, connector config | OpenCode | Power Platform architect |
| Copilot API contract, auth, prompt | OpenCode | Copilot/Graph engineer |
| Jira mapping, sprint rules, field payloads | OpenCode | Jira engineer |
| Tests with synthetic transcripts | OpenCode | QA |
| Runbook, monitoring, retries | OpenCode | ops |
| Transcript, report, email, Jira execution | Power Automate | runtime |

No OpenCode agent reads a real transcript, report or attendee email. Tests use synthetic data; production runs stay in the Microsoft boundary.

## Phase plan

- **Phase 0 (current):** brief, roster, feasibility matrix.
- **Phase 1:** Copilot API spike with one real transcript, report only; compare with manual Copilot. No emails or Jira writes.
- **Phase 2:** Power Automate pilot through G1: recurrence, transcript, report `.docx`, review email, approval.
- **Phase 3:** G2 distribution, G3 Jira create/assign, G4 tracking digest.
- **Phase 4:** hardening, retries, runbook, license/cost review, shadow-mode exit.

## Open decisions

- Custom connector vs Copilot Studio vs AI Builder.
- Delegated account vs service account with Copilot license.
- `.docx` generation path (Teams-stored file vs Word connector/Office Scripts).
- Rovo API vs Jira connector.
- Chunking threshold and report regeneration policy.
- Retention of transcripts/reports in SharePoint.
