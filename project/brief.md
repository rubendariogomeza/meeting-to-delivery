# Project Brief — Meeting-to-Execution Automation

Status: confirmed v0.3 — 2026-11-05
Date: 2026-11-03
Owner: Rubén Darío Gómez
Engagement: cliente de healthtech en EE. UU.

## 1. Objective

Automate the meeting follow-through that is manual today: Teams meeting in Spanish (Spain), transcript as `.docx`, four-section report, organizer review, distribution to participants, Jira task creation with assignee and sprint, and tracking with email updates.

Definition of done: one real meeting runs from transcript to assigned Jira tasks with no copy/paste, every external write explicitly approved, and the report and issues match the meeting record.

## 2. Context and stakeholders

- Microsoft 365 tenant: Teams, Outlook, SharePoint/OneDrive, Word.
- Jira: instancia del cliente, con Rovo disponible. El dueño tiene acceso parcial de administrador de Atlassian.
- Organizer and approver: Rubén. Participants: meeting attendees.
- Working language: Spanish (Spain) for transcripts and reports.
- Runtime constraint: meeting content must stay inside Microsoft 365 / Power Platform. It must not pass through an external LLM.
- Volume: 4 to 8 meetings per week, 60 to 90 minutes each.

## 3. Current workflow (confirmed)

1. Meeting scheduled in Outlook/Teams.
2. At meeting start, Rubén manually starts transcription and sets the language to Spanish (Spain).
3. At meeting end, Rubén downloads the transcript from Teams as `.docx`.
4. Rubén attaches the `.docx` to Microsoft Copilot and prompts it for a report with: Executive Summary, Agreements, Decisions, Tasks.
5. Rubén copies the report into an email, fixes misspelled names and wrong letters, and sends it to all attendees.
6. Rubén opens Jira, opens Rovo, pastes the email content, and asks Rovo to create the tasks.
7. Rovo creates the tasks. Rubén manually sets the assignee and the sprint.
8. Tasks are tracked to completion; status notifications are expected (details OPEN).

## 4. Target workflow

- Runtime: **Power Automate** cloud flows. The OpenCode agent team designs, builds, tests and operates; it does not process meeting content.
- Report generation: **Microsoft 365 Copilot Chat API (preview)**, using the transcript file in SharePoint as context, inside the M365 trust boundary.
- Keep manual transcription start for now: Graph cannot start it.
- Human gates: G1 report and names (Power Automate Approval), G2 distribution, G3 Jira writes/assignment, G4 status notifications.
- Fallback if the Copilot API is blocked: Copilot Studio agent or AI Builder prompt; Copilot manual as last resort.
- Shadow mode: for the first 3 meetings, compare the automated report with the manual Copilot report.

## 5. Apps, data and artifacts

| System | Role | Artifact |
| --- | --- | --- |
| Teams | meeting, manual transcription | transcript content |
| Power Automate | orchestration, approvals, retries | flow run history |
| Copilot Chat API | report generation | report text |
| SharePoint/OneDrive | transcript and report storage | `.docx`, `.txt` |
| Outlook | review and distribution | email |
| Jira + Rovo | task creation and tracking | issues, sprint, assignee |

## 6. Access and constraints

- M365 Copilot add-on license required for the account that runs the Chat API. Status: OPEN.
- Copilot Chat API is `/beta`, delegated-only, and needs: Sites.Read.All, Mail.Read, People.Read.All, OnlineMeetingTranscript.Read.All, Chat.Read, ChannelMessage.Read.All, ExternalItem.Read.All. Admin consent and security review required.
- Power Automate Premium required for Approvals, Jira, Word and custom connectors. Status: OPEN.
- Graph/Teams access for transcripts; connector actions exist, but tenant consent is OPEN.
- Jira Cloud assumed; project key, issue types, required fields and sprint field: OPEN.
- Rovo public API: not found in Atlassian developer docs; verify with the Atlassian admin.
- No credentials in the repository; connections live in Power Automate.

## 7. Outputs and quality bar

- Transcript `.docx` in Spanish (Spain), speakers and timestamps preserved.
- Report in Spanish (Spain), four sections in fixed order: Resumen ejecutivo, Acuerdos, Decisiones, Tareas.
- Names corrected against the attendee list; uncertain names flagged, never guessed silently.
- Every task has a description, owner or explicit "sin asignar", due date or explicit none, and a source quote.
- Email to the organizer is a review copy; distribution only after G2.
- Jira issues use the existing project workflow; assignee and sprint proposed and confirmed at G3.

## 8. Approvals and risk

- Ask before every write: email send, Jira create/update/transition, calendar or Teams changes.
- Approval channel: **Power Automate Approvals** (Teams/email actionable cards), with the organizer as approver.
- Risks: Copilot API preview changes, broad delegated scopes, license gaps, 60-90 minute transcript limits, Rovo API absence, duplicate issues, wrong name mapping.

## 9. Success metrics

- One pilot meeting end-to-end.
- Human review time per meeting: at most 5 minutes.
- Name and owner accuracy after review: at least 98%.
- Task capture: at least 95% of agreed tasks reach Jira.
- Zero duplicate issues and zero unapproved external writes.
- No meeting content processed outside Microsoft 365 / Power Platform.

## 10. Phases

0. Lead agent, brief, roster and feasibility (current).
1. Feasibility spike: Copilot Chat API + transcript file for one meeting, report only, no external writes. Compare with the manual Copilot report.
2. Power Automate pilot: recurrence trigger, transcript retrieval, report `.docx`, review email and G1 approval.
3. Distribution (G2) + Jira creation/assignment (G3) + tracking (G4).
4. Hardening: retries, runbook, cost/licensing review, shadow-mode exit.

## 11. Out of scope (v1)

- Driving the Copilot UI or Teams UI with browser automation.
- Starting transcription through a custom Teams bot.
- Auto-approving or auto-sending without human review.
- Replacing Jira as the task system of record.
- Processing meetings without consent and recording-policy compliance.

## 12. Open questions

- OPEN: M365 Copilot add-on and Power Automate Premium licenses — who has them?
- OPEN: can the flow run as Rubén's delegated account, or does IT require app-only auth? The Copilot API is delegated-only.
- OPEN: will IT approve the seven delegated Graph scopes and the `/beta` API?
- OPEN: custom connector vs Copilot Studio vs AI Builder for the Copilot call.
- OPEN: does Teams store the transcript as `.docx`, or must we generate it?
- OPEN: Rovo API availability; fallback is the Jira connector.
- OPEN: Jira project key, issue types, required fields, sprint field and user mapping.
- OPEN: chunking strategy for 60-90 minute transcripts.
- OPEN: baseline manual time per meeting.
- OPEN: backup approver.

## Assumptions

- ASSUMPTION: the Copilot Chat API is enabled in the tenant and the account has a Copilot add-on. Verify with IT.
- ASSUMPTION: Power Automate can reach the Copilot API through a custom connector with delegated OAuth. Verify.
- ASSUMPTION: the Teams connector can list and fetch the meeting transcript. Verified available; tenant behavior unverified.
- ASSUMPTION: Jira Cloud, Jira connector Premium, sprint as a custom field. Verify.
- ASSUMPTION: manual transcription start and es-ES setting remain in phases 1-3.

## Changelog

- 2026-11-03 v0.3 — Microsoft-only runtime: Power Automate + Copilot Chat API; OpenCode agents moved to build/ops; volume and licensing questions added.
- 2026-11-05 v0.3 confirmed — portable engine built (D-022); tenant-dependent phases remain blocked on client access.
- 2026-11-02 v0.2 — replaced inferred workflow with the confirmed manual process; added Rovo, manual transcription, `.docx` source, shadow pilot.
- 2026-11-02 v0.1 — seeded from discovery answers; gaps marked OPEN.
