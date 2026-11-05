---
name: Token Discipline
description: Keep agent workflows cheap and predictable — context budgets, file handoffs, model routing and output caps. Use when designing tasks, delegating to subagents, or reviewing run cost.
---

# Token Discipline

## Principle

Pay for judgment, not for repeating context. The cheapest token is the one never sent.

Context ladder, cheapest first:

1. A script computes it.
2. A file path + 5-line summary.
3. A structured extract (JSON or table).
4. The raw document.

Only use level 4 inside the one agent that must read it, and never in the lead.

## Hard rules

- The lead never reads a full transcript, report or email thread. It reads `project/` docs and worker summaries.
- Workers write full artifacts to disk and return `STATUS / ARTIFACT / SUMMARY (<=300 tokens) / NEXT`.
- Pass file paths, not pasted content, in every delegation.
- One artifact, one writer. No re-reading a file another worker just wrote; use its summary.
- Quotes in chat: 5 lines maximum. No restating documents.
- Read with `offset`/`limit` or `grep` when a file is over ~200 lines.
- Compact at phase boundaries, not mid-task.
- Log token cost per run in `runs/<id>/cost.json` once connectors exist.

## Model routing

| Work | Model tier | Example |
| --- | --- | --- |
| Planning, report writing, QA | strong | claude-sonnet-5-5 |
| Extraction, normalization, API calls | cheap | gpt-6-luna |
| Classification, formatting checks | cheapest | claude-haiku-5-5 |
| Integration code | code-specialized | kimi-k2.7-code |

Escalate only after a failed attempt at the cheaper tier. Never escalate the whole run for one hard section; escalate that section.

## Budgets (per meeting run)

| Stage | Input cap | Output cap |
| --- | ---: | ---: |
| Transcript fetch + normalize | 20k | 2k |
| Report generation | 18k | 2k |
| Task extraction | 8k | 1.5k |
| Jira/email operations | 6k | 1k |
| Tracking update | 4k | 0.8k |
| **Total** | **56k** | **7.3k** |

Target cost per meeting: $0.25 or less on the approved routing. If a run exceeds 1.5x budget, stop and report the cause instead of continuing.

## Chunking

- Under 45 minutes: one pass.
- 45 to 90 minutes: split by agenda section or 30-minute windows, extract per window, then merge.
- Over 90 minutes: map-reduce with a cheap model, then one strong-model pass over the merged extract.
- Never chunk the final report; generate it once from the merged extract.

## Anti-patterns

- Sending the transcript to the lead "for context".
- Asking a worker to "review everything" instead of naming files.
- Re-summarizing an artifact at each hop instead of passing its path.
- Using a strong model for file formatting, date parsing or JSON cleanup.
- Keeping a completed phase's history in an active session.
- Retrying a failed call with more context instead of fixing the input.
