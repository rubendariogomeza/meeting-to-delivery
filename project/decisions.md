# Decisions

Append-only. One entry per decision. Never rewrite history; supersede an entry instead.

## D-001 — Phase 1 is the lead agent and the brief

- Date: 2026-11-02
- Status: accepted
- Decision: Phase 1 delivers the project-lead agent, its skills, a confirmed brief and a roster/task plan. No app connections.
- Why: the workflow depends on unverified tenant permissions and an uncertain Copilot API; designing before verifying wastes work.
- Consequence: no emails, Jira writes or Teams actions until the brief and feasibility checks are complete.

## D-002 — Every external write needs explicit approval

- Date: 2026-11-02
- Status: accepted
- Decision: emails, Jira create/update/transition and calendar/Teams changes require a human approval per action or per batch.
- Why: meeting content and participant distribution are high-impact; a wrong name or owner is costly.
- Consequence: each write stage gets a named gate (G1-G4) and an approver. No auto-approval on timeout.

## D-003 — Project-local OpenCode configuration

- Date: 2026-11-02
- Status: accepted
- Decision: configuration, agents and skills live in this folder; `lead` is the default agent; shell and external paths ask for approval.
- Why: isolates the program from other projects and keeps the blast radius small.
- Consequence: opening another folder does not load these agents.

## D-004 — Balanced model routing

- Date: 2026-11-02
- Status: accepted
- Decision: lead/report/review on Claude Sonnet 5.5; extraction and operations on GPT-6 Luna; formatting on Claude Haiku 5.5; connector code on Kimi K2.7 Code.
- Why: pays for judgment, not for repeated context; keeps cost per meeting under $0.25.
- Consequence: models are reviewed monthly against actual cost and quality.

## D-005 — Do not depend on a Copilot prompt API

- Date: 2026-11-02
- Status: proposed, pending verification
- Decision: design report generation as a direct LLM stage; treat Copilot as optional.
- Why: Microsoft 365 Copilot does not expose a general prompt API for this use case as far as is publicly documented.
- Consequence: if IT confirms a supported Copilot Studio path, it replaces the report stage behind the same contract.

## D-006 — File-first context and 300-token handoffs

- Date: 2026-11-02
- Status: accepted
- Decision: the brief, decisions and artifacts are files; workers return status, artifact path, a short summary and the next action.
- Why: transcripts are large and the lead must stay cheap.
- Consequence: every task file names its input and output paths; chat is not a data store.

## D-007 — Manual trigger in Phase 1

- Date: 2026-11-02
- Status: accepted
- Decision: phase 1 runs on a chosen past meeting, started by the user.
- Why: automation of meeting detection depends on F1/F11, still unverified.
- Consequence: scheduling is designed in phase 3, not now.

## D-008 — The Teams `.docx` export is the canonical transcript

- Date: 2026-11-02
- Status: accepted
- Decision: phase 1 consumes the `.docx` transcript downloaded from Teams. Graph `.vtt` retrieval is an optimization, not a requirement.
- Why: it is the current, proven artifact and avoids a conversion step and tenant access dependency.
- Consequence: phase 1 needs a text extractor, not a VTT parser. Graph remains a phase 3 candidate.

## D-009 — Automate the outcome, not Rovo

- Date: 2026-11-02
- Status: proposed, pending verification
- Decision: create Jira issues through the Jira REST API; use Rovo only if a supported invocation API exists in this tenant.
- Why: Rovo is a UI agent; REST is deterministic, testable and gives exact control over fields, assignee and sprint.
- Consequence: the task creation step is a script, not an agent. Rovo remains the manual fallback.

## D-010 — Copilot remains the quality baseline during the pilot

- Date: 2026-11-02
- Status: accepted
- Decision: generate the LLM report in shadow mode for 3 meetings and diff it against the manual Copilot report before replacing Copilot.
- Why: report quality and Spanish name handling are the highest-risk part of the workflow.
- Consequence: phase 1 produces two reports per meeting; distribution stays manual until the exit criteria are met.

## D-011 — Keep manual transcription start for now

- Date: 2026-11-02
- Status: accepted
- Decision: phases 1 and 2 keep the manual start and es-ES setting. Automating transcription start is out of scope.
- Why: Graph cannot start a Teams transcription; a bot or a tenant policy change is a separate project.
- Consequence: the pipeline starts at transcript acquisition, not at meeting start.

## D-012 — In-session approval in Phase 1

- Date: 2026-11-02
- Status: proposed
- Decision: approvals happen in the OpenCode session while the workflow is being validated; an asynchronous channel is designed in phase 3.
- Why: it is the simplest safe gate and avoids building an approval service before the pipeline works.
- Consequence: no unattended runs until an approval channel is chosen and verified.

## D-013 — The runtime is Microsoft-native

- Date: 2026-11-03
- Status: accepted
- Decision: the workflow executes in Power Automate with Microsoft 365 connectors. OpenCode agents do not process meeting content.
- Why: the data policy allows only Microsoft 365 / Power Platform to handle transcripts and reports; reading a transcript in an agent would send it to an external model.
- Consequence: the agent team becomes a build/ops team. Runtime observability is Power Automate run history, not OpenCode sessions.

## D-014 — Target the M365 Copilot Chat API for the report

- Date: 2026-11-03
- Status: proposed, pending licensing and consent
- Decision: generate the report with the Microsoft 365 Copilot Chat API (preview), passing the transcript from SharePoint as file context.
- Why: it is the closest native equivalent to the current manual Copilot attachment step and stays inside the M365 trust boundary.
- Consequence: requires an M365 Copilot add-on, a delegated account, seven delegated Graph scopes, admin consent, and acceptance of a `/beta` API. Fallbacks: Copilot Studio or AI Builder.

## D-015 — No real meeting content in OpenCode

- Date: 2026-11-03
- Status: accepted
- Decision: OpenCode agents may read the brief, synthetic tests, schemas and run metadata, but never real transcripts, reports or attendee emails.
- Why: consistency with D-013 and the company data policy.
- Consequence: QA uses synthetic or anonymized transcripts. Debugging uses Power Automate run history and metadata, not content dumps.

## D-016 — Approvals through Power Automate Approvals

- Date: 2026-11-03
- Status: proposed
- Decision: use Power Automate Approvals (Teams/email actionable cards) for G1-G4, with the organizer as approver.
- Why: it works when no OpenCode session is open and produces an auditable record.
- Consequence: requires Power Automate Premium. Timeouts stop the run; no auto-approval.

## D-017 — Chunk long transcripts

- Date: 2026-11-03
- Status: proposed
- Decision: for 60-90 minute meetings, summarize in 20-30 minute windows in the same Copilot conversation, then generate one consolidated report.
- Why: 4-8 meetings per week at this length risks timeouts and truncation in a single call.
- Consequence: 2-4 Copilot calls per meeting; the final report is generated once from the merged summary.

## D-018 — Agents build and operate, Power Automate executes

- Date: 2026-11-03
- Status: accepted
- Decision: the OpenCode team designs, tests and operates; Power Automate runs the workflow inside Microsoft 365.
- Why: the data policy forbids meeting content reaching an external model.
- Consequence: no agent reads a real transcript; observability uses Power Automate metadata.

## D-019 - The flow runs as the organizer's delegated account

- Date: 2026-11-03
- Status: accepted, review after pilot
- Decision: use the organizer's delegated connection for Teams, Copilot and Outlook.
- Why: the Copilot Chat API has no application permissions, and the organizer is the approver.
- Consequence: the token inherits broad read access; MFA and Conditional Access are mandatory. Revisit a dedicated licensed account before production.

## D-020 — Jira connector now, Rovo later

- Date: 2026-11-03
- Status: accepted
- Decision: create and assign issues with the Jira connector; switch to Rovo only if Atlassian confirms a supported API.
- Why: no public Rovo endpoint was found; the connector is documented and testable.
- Consequence: no Rovo UI automation.

## D-021 — Report engine selected after a security review

- Date: 2026-11-03
- Status: open
- Decision: spike the Copilot Chat API (A) and a Copilot Studio agent (B) on synthetic data; choose on security sign-off and quality.
- Why: A has the highest fidelity but needs seven broad delegated scopes and a beta API; B has better least privilege but a different model and governance surface.
- Consequence: no production engine commitment until IT answers the license and consent questions in `project/security-review.md`.

## D-022 — The deliverable is a portable engine; Microsoft 365 is a deployment target

- Date: 2026-11-05
- Status: accepted
- Supersedes: D-013 and D-018 for the demonstration build (D-013 and D-018 still govern a client deployment inside Microsoft 365).
- Decision: ship a portable TypeScript engine that runs with synthetic data. Microsoft 365 (Teams transcript, Copilot, Graph, Outlook) and Jira REST are adapters, disabled by default. Power Automate remains the enterprise deployment option described in `architecture.md`.
- Why: the original runtime required the client's tenant, Copilot add-on licenses, admin consent and a delegated account. That environment is no longer available, so the design could not be validated, demonstrated or sold as evidence. A portable core proves the same logic without depending on a third party.
- Consequence: the demo needs no tenant and no credentials; the enterprise path is documented but unverified until a client provides access. No real meeting content is required at any point.

## D-023 — Phase numbering is 0 to 4

- Date: 2026-11-05
- Status: accepted
- Supersedes: the numbering in D-001.
- Decision: Phase 0 is the design phase (brief, architecture, feasibility, security review, roster, contracts). Phases 1 to 4 follow `project/brief.md` and `project/architecture.md`.
- Why: D-001 called the design phase "Phase 1" while the brief, architecture and README call it Phase 0, which made the status reports contradictory.
- Consequence: every document and status report uses 0 to 4.

## D-024 — Two commands: `meeting` and `brief`

- Date: 2026-11-05
- Status: accepted
- Decision: the engine exposes `meeting` (transcript to report, tasks, Jira plan and email) and `brief` (task store to weekly delivery brief). They share the same task schema and run store.
- Why: the meeting produces commitments; the brief makes their status visible. The second half is the accountability problem the original engagement was about, and it is the part a client pays for monthly.
- Consequence: one product, two entry points. `brief` can consume tasks from `meeting` or any external JSON export.
