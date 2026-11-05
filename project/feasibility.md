# Feasibility Matrix

Status: v0.3, 2026-11-03. Verified against Microsoft Learn where noted. Anything "Unverified" blocks the phase that depends on it.

| # | Capability | Method | Access / limit | Status | Risk | Verify |
| --- | --- | --- | --- | --- | --- | --- |
| F1 | Transcription start | Manual today; tenant auto-record policy later | Per meeting | Manual confirmed | Low | Not phase 1 |
| F2 | Fetch meeting transcript | Power Automate Teams connector: `List meeting transcripts`, `Get meeting transcript content` | Connector + tenant consent | Verified available | Medium | One real meeting |
| F3 | Transcript `.docx` | Teams-stored file, or Word connector/Office Scripts | Depends on what Teams stores | Unverified | Medium | Inspect SharePoint |
| F4 | Report generation with Copilot | M365 Copilot Chat API: `POST /beta/copilot/conversations`, then `/chat` with `contextualResources.files` | Delegated only; 7 scopes; Copilot add-on; `/beta` preview | Verified (preview) | High | Spike one transcript |
| F5 | Call Copilot from Power Automate | Custom connector with OAuth 2.0 auth code, delegated scopes | App registration + admin consent + security review | Unverified | High | Build a 1-action connector |
| F6 | Review email | Outlook connector `Send an email` | Standard | Likely | Low | Send to self |
| F7 | Distribution to attendees | Outlook connector + event attendees | Standard | Likely | Medium | Test 3 attendees |
| F8 | Create Jira issues | Jira connector `Create a new issue (V3)` | Premium; project fields | Verified available | Medium | One test issue |
| F9 | Assignee + sprint | Jira connector `Edit Issue` | `accountId`, sprint custom field | Likely | Medium | Inspect payload |
| F10 | Rovo API | Atlassian public API | No public Rovo endpoint found | Unverified / likely unavailable | High | Ask Atlassian admin |
| F11 | Track status | Jira triggers (new/closed) or JQL poll | Connector Premium; no generic status trigger | Partial | Medium | JQL poll |
| F12 | Status emails | Outlook connector | Standard | Likely | Low | One digest |
| F13 | Approvals | Power Automate Approvals | Premium; organizer as approver | Verified available | Low | One test approval |
| F14 | Trigger after meeting | Recurrence + calendar lookback, or Teams meeting trigger | Standard/Premium | Likely | Medium | One lifecycle |
| F15 | Licensing | M365 Copilot add-on + Power Automate Premium (+ Word connector) | Tenant admin | Unverified, blocking | High | Ask IT |
| F16 | Delegated account | Run flows as the organizer or a licensed service account | Copilot API has no app-only auth | Unverified, blocking | High | Ask IT |

## Verified sources (2026-11-03)

- Copilot Chat API overview: `learn.microsoft.com/microsoft-365-copilot/extensibility/api/ai-services/chat/overview`
  - M365 Copilot add-on license; OneDrive/SharePoint files as context; text-only; no action skills; `/beta`.
- Chat endpoint: `.../chat/copilotconversation-chat`
  - Delegated permissions: Sites.Read.All, Mail.Read, People.Read.All, OnlineMeetingTranscript.Read.All, Chat.Read, ChannelMessage.Read.All, ExternalItem.Read.All. Application: not supported.
- Teams connector: `learn.microsoft.com/connectors/teams/`
  - `Get meeting transcript`, `Get meeting transcript content`, `List meeting transcripts`, `Get AI insight` (Copilot license).
- Jira connector: `learn.microsoft.com/connectors/jira/`
  - Premium; `Create a new issue (V3)`, `Edit Issue`, triggers for new/closed issues, JQL trigger.

## Blocking gates

1. **F15/F16** — no license or no delegated account means the Copilot Chat API path is dead. Fallback: Copilot Studio or AI Builder.
2. **F5** — if IT rejects the 7 delegated scopes or `/beta`, fallback to Copilot Studio.
3. **F3** — if Teams does not store a `.docx`, generate it deterministically; do not ask an agent to format it.
4. **F10** — if Rovo has no API, use the Jira connector; do not automate the Rovo UI.

## Verification order

1. Licensing + delegated account (IT).
2. Copilot custom connector spike with a synthetic transcript.
3. One real transcript through the API; compare with manual Copilot.
4. Jira test issue with assignee and sprint.
5. Approvals + email test.
