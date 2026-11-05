# T-010 Graph transcript adapter

Phase: 3
Owner: ops
Status: blocked
Depends on: T-011
Approval gate: client IT (delegated scopes, tenant consent)
Token budget: 10k in + 3k out

## Objective
Replace the manual `.docx` download with a Graph call that returns the meeting transcript, behind the existing `readTranscriptFile` contract.

## Inputs
- `project/architecture.md` — stages S1 and S2
- `project/feasibility.md` — F2, F3, F16
- Microsoft Graph — `OnlineMeetingTranscript.Read.All`, delegated only

## Steps
1. Add `src/ingest/graph.ts` with `listTranscripts(meetingId)` and `getTranscriptContent(id)`.
2. Normalize VTT into the same `ParsedTranscript` shape used by the parser.
3. Keep the file path as the default; the adapter is opt-in by environment variable.
4. Add a fixture VTT and a test that runs the parser over it.

## Output
- Artifact: `src/ingest/graph.ts`, `tests/graph.test.ts`
- Handoff: STATUS / ARTIFACT / SUMMARY / NEXT

## Acceptance criteria
- [ ] A synthetic VTT produces the same tasks as the equivalent `.txt`.
- [ ] Without Graph credentials the CLI behaves exactly as today.
- [ ] No token or tenant identifier is written to `runs/`.
- [ ] The adapter fails with a clear message when consent is missing.

## Failure handling
- 403 or consent error -> keep the manual path and report the missing scope.
- Transcript not ready -> retry with backoff for 30 minutes, then stop.

## Notes
Blocked until a client provides a tenant. Do not fake the integration.
