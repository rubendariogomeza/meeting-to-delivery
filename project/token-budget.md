# Token Budget

Status: v0.1, 2026-11-02. Applies to every agent in this project.

## Rules

1. The lead reads `project/` docs only. It never reads transcripts, reports or email threads.
2. Workers receive file paths, not pasted content. They write full artifacts to disk and return a 300-token handoff.
3. One writer per artifact. Downstream agents read the artifact, not the chat history.
4. Use `grep` or `offset`/`limit` on files over 200 lines.
5. Cheap models for extraction, formatting and API calls. Strong models only for report writing, review and planning.
6. Compact at phase boundaries. Do not carry a completed phase into a running session.
7. Quote at most 5 lines in chat. No document restatement.
8. Stop a run that exceeds 1.5x its budget and report the cause.

## Budget per meeting

| Stage | Input | Output |
| --- | ---: | ---: |
| Fetch + normalize | 20k | 2k |
| Report | 18k | 2k |
| Task extraction | 8k | 1.5k |
| Jira/email operations | 6k | 1k |
| Tracking | 4k | 0.8k |
| **Total** | **56k** | **7.3k** |

Reference: a 60-minute Spanish meeting is roughly 8,000 to 10,000 words, about 11k to 14k tokens. One report pass fits without chunking; split above 45 minutes of dense content.

## Cost targets

- Per meeting at approved routing: at most $0.25.
- Phase 0 one-time design cost: at most $2.
- Alert if a week exceeds 5x the forecast.

## Chunking

- Under 45 minutes: single pass.
- 45 to 90 minutes: split into agenda sections or 30-minute windows; extract each; merge.
- Over 90 minutes: cheap-model map, then one strong-model reduce over the merged extract.
- Generate the final report once. Never regenerate it per chunk.

## Measurement

- OpenCode reports per-session cost in the UI.
- Once connectors exist, write `runs/<id>/cost.json` with `stage`, `model`, `input_tokens`, `output_tokens`, `cost_usd`.
- Review the last 10 runs monthly; re-route the worst stage, not the whole pipeline.

## Runtime billing (v0.3)

The workflow runs in Power Automate, not OpenCode. OpenCode tokens pay only for design, code and operations. Copilot Chat API use is covered by the M365 Copilot add-on; Power Automate consumption is licensed per user/flow, not per token. Track Power Automate runs and Copilot calls per meeting instead of tokens.

OpenCode agents must not read real transcripts or reports; use synthetic tests and run metadata. This is both a policy rule and the strongest token optimization available.

## Anti-patterns

- Sending the transcript to the lead "for context".
- Asking a worker to "review everything" instead of naming files.
- Re-summarizing at every hop instead of passing the artifact path.
- Using Sonnet for JSON cleanup or date parsing.
- Retrying a failed tool call with more context instead of fixing the input.
- Keeping a finished phase's conversation active.
