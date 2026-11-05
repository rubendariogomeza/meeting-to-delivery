# Security Review — Report Engine Options

Status: draft, 2026-11-03. Scope: turning a Teams transcript into a report while keeping meeting content inside Microsoft 365 / Power Platform.

## Common risks (all options)

| Risk | Why it matters | Mitigation |
| --- | --- | --- |
| Run history stores content | Power Automate keeps action inputs/outputs, including transcript and report, visible to flow owners, co-owners and environment admins | Dedicated environment, no broad co-ownership, Secure Inputs/Outputs on content actions, short retention |
| SharePoint oversharing | The transcript lives in a library; Copilot reads it as the signed-in user | Dedicated site/library, explicit permissions, no "Everyone except external", sensitivity label |
| Delegated identity | The flow acts as a person; a stolen token inherits that person's access | MFA, Conditional Access, no shared credentials, consider a dedicated licensed account |
| DLP gaps | Power Platform can reach many connectors | Environment DLP policy allowing only approved connectors; block consumer connectors |
| Audit gaps | Content access must be traceable | Purview audit, Entra sign-in logs, Power Platform admin analytics, run history retention |
| Prompt injection | A transcript can contain instructions aimed at the model | Treat transcript as data, constrain output to the four sections, no tool/action skills in the report step |
| Personal data | Transcripts contain names and opinions | Retention/deletion policy, DPIA, restrict access, avoid external egress |

## Option A — Microsoft 365 Copilot Chat API (preview)

**Path:** Power Automate custom connector -> Graph `/beta/copilot/conversations` -> Copilot stack -> reads the SharePoint transcript as the signed-in user -> text response.

| Dimension | Assessment |
| --- | --- |
| Data boundary | Stays in Microsoft 365; respects M365 permissions and compliance |
| Auth | Delegated OAuth 2.0 authorization code only; no app-only |
| Permissions | `Sites.Read.All`, `Mail.Read`, `People.Read.All`, `OnlineMeetingTranscript.Read.All`, `Chat.Read`, `ChannelMessage.Read.All`, `ExternalItem.Read.All` |
| Privilege level | High: tenant-wide read access for that user, not limited to the meeting |
| Stability | `/beta`, preview, no production SLA |
| Content storage | SharePoint + Power Automate run history + Copilot conversation record |
| Audit | Entra sign-in, Purview, Power Automate run history |
| Fidelity | Highest: closest to today's manual Copilot step |
| Setup | Custom connector, app registration, admin consent, security review |
| Security rating | **Medium** — strong data boundary, but broad scopes and beta |

**Main risk:** consenting to seven tenant-wide read scopes for a user who also runs the flow. If that account is compromised, the token can read mail, chats, channels, sites and meeting transcripts. Restrict connector sharing, use a dedicated licensed account, and review the scopes with IT.

## Option B — Copilot Studio agent

**Path:** Power Automate -> Copilot Studio agent (connector or Direct Line) -> agent grounded on a dedicated SharePoint library or the transcript input -> text response.

| Dimension | Assessment |
| --- | --- |
| Data boundary | Power Platform / Copilot Studio; region depends on the environment |
| Auth | Microsoft Entra ID auth for the agent; Direct Line secret if that channel is used |
| Permissions | Scoped to the knowledge source; no broad Graph scopes |
| Privilege level | Low to medium, if the agent is scoped to one library and sharing is restricted |
| Stability | Generally available |
| Content storage | Dataverse/conversation records, analytics, Power Automate run history |
| Audit | Copilot Studio analytics, Dataverse audit, Power Platform audit |
| Fidelity | Good, but not the same model/experience as M365 Copilot Chat |
| Setup | Agent, knowledge source, auth, channel, licensing |
| Security rating | **Low-Medium** — better least privilege, new governance surface |

**Main risks:** agent publishing/sharing misconfiguration, Direct Line secret leakage, conversation transcripts stored in Copilot Studio, knowledge source broader than intended. Require Entra ID auth, a dedicated library, and a secret in a managed store.

## Option C — AI Builder prompt

**Path:** Power Automate AI Builder prompt -> Microsoft-managed GPT model -> text response. Only the text you pass is processed.

| Dimension | Assessment |
| --- | --- |
| Data boundary | Power Platform; region depends on environment |
| Auth | Power Automate connection; no Graph scopes |
| Permissions | Environment-level; least privilege |
| Privilege level | Low |
| Stability | Generally available |
| Content storage | Prompt/response in run history and AI Builder logs |
| Audit | Power Platform audit, run history |
| Fidelity | Lower: no enterprise grounding beyond the supplied text |
| Setup | Simplest; credits/licensing |
| Security rating | **Low** — least privilege, but content is in prompts and run history |

**Main risks:** context limits for 60-90 minute transcripts, lower report quality, chunking complexity, prompt injection. Good for a limited pilot, not the best final quality.

## Comparison

| Criterion | A. Copilot Chat API | B. Copilot Studio | C. AI Builder |
| --- | --- | --- | --- |
| Data leaves M365/Power Platform | No | No | No |
| Graph scopes | 7 broad delegated | Scoped to knowledge source | None |
| Stability | Beta | GA | GA |
| Fidelity to today | Highest | Good | Moderate |
| Setup effort | High | Medium | Low |
| Governance burden | High (scopes, beta) | Medium (agent sharing, secrets) | Low |
| Best for | Exact Copilot behavior | Least-privilege production | Fast limited pilot |

## Recommendation

1. Run a **synthetic spike** of A and B in a dedicated Power Automate environment with a dedicated SharePoint library.
2. Choose **A** only if IT approves the seven delegated scopes and the `/beta` API, and the account is a dedicated licensed identity.
3. Otherwise choose **B** as the production engine; use **C** only as a fallback pilot.
4. Do not automate the Copilot UI. Do not use the Rovo UI; use the Jira connector.
5. Never let an OpenCode agent read a real transcript. Tests use synthetic data.

## IT security questions

- Is the M365 Copilot Chat API `/beta` approved for production use?
- Are the seven delegated scopes approved for a dedicated licensed account?
- Is a custom connector allowed, and who can create/share it?
- What DLP policy applies to the Power Automate environment?
- What is the run-history and SharePoint retention for transcripts?
- Is a DPIA required for meeting transcripts and participant data?
- Is Copilot Studio licensed, and is Direct Line allowed?
- Is Azure OpenAI available as an in-tenant fallback?

## License checks

### Microsoft 365 Copilot add-on

- Portal: Microsoft 365 admin center -> Billing -> Licenses; or Users -> Active users -> select the user -> Licenses.
- Look for: `Microsoft 365 Copilot`.
- PowerShell: `Get-MgSubscribedSku | Where-Object { $_.SkuPartNumber -match 'COPILOT' }`

### Power Automate Premium

- Portal: Microsoft 365 admin center -> Billing -> Licenses.
- Look for: `Power Automate Premium`, `Power Automate per user plan`, or `Power Automate Process`.
- Note: seeded Power Automate for Microsoft 365 does not cover Approvals, Jira, Word or custom connectors.

### Copilot Studio

- Portal: Microsoft 365 admin center -> Billing -> Licenses; or Power Platform admin center -> Licensing.
- Look for: `Microsoft Copilot Studio` or Copilot Studio message capacity.

### Azure OpenAI

- Portal: Azure portal -> All resources -> Azure OpenAI, or ask IT for an approved endpoint.

### Environment

- Portal: Power Platform admin center -> Environments.
- Check: default vs dedicated environment, DLP policies, environment makers, run-history retention.
