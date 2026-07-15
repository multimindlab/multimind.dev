---
title: "Generating EU AI Act Evidence Reports from Your Existing Logs"
description: "A walkthrough of multimind compliance report-evidence: what it reads, what it produces, and how to keep the output honest instead of overclaiming."
pubDate: 2026-07-14
tags: ["tech", "compliance", "eu-ai-act", "cli"]
---

The compliance evidence report is the artifact that turns "we think our AI usage is compliant" into something you can hand an auditor. This is a walkthrough of how it's generated and what to check before you rely on it.

## The command

```bash
multimind compliance report-evidence \
  --audit-log audit.jsonl \
  --costs-log costs.jsonl \
  --project . \
  --period 2026-07 \
  --format html -o evidence.html
```

Two inputs matter here: `audit.jsonl`, produced by the [PII guard](/blog/pii-redaction-deep-dive) or the `multimind serve` proxy on every model call, and `costs.jsonl`, produced by the same call path's budget tracking. The report doesn't collect new data — it reads what your application already logged during the `--period` window and maps it to control themes.

## What "mapped to control themes" actually means

The report isn't a generic compliance summary — it ties specific log entries to specific requirements:

- **EU AI Act** — Art. 12 record-keeping (do you have a traceable record of system behavior), Art. 50 transparency (are AI interactions disclosed where required)
- **SOC 2** — monitoring and logical access controls, drawn from the audit log's access and detection events
- **HIPAA** — 164.312(b) audit controls, mapped from the same PII/PHI detection events if your `block_on` list covers PHI types
- **GDPR** — lawful-basis and purpose-limitation enforcement, evidenced by what the guard actually blocked or allowed against your configured policy

Each section in the generated report should read as "this control is supported by the following evidence from your logs" — a list of specific events, not a checkbox.

## Why the report says "supports," never "satisfies"

This is a deliberate design choice worth understanding before you hand the report to anyone: the report describes what your runtime logs show, not a legal determination that you meet a given requirement. If your `audit.jsonl` doesn't cover a code path — say, a model call that bypassed the guard entirely — that control theme has no evidence for that path, and the report should reflect that as an absence rather than silently passing it.

Practically, this means the report is only as complete as your logging coverage. Before generating one for a real audit, it's worth confirming every model call in the `--period` window actually went through a guarded model or the `multimind serve` proxy — a call that bypassed both won't appear in `audit.jsonl`, and the report has no way to know it happened.

## Making this a recurring artifact, not a one-off

Since the command reads from log files and a period, generating a report monthly (or per compliance review cycle) is just re-running the same command with the current period and the accumulated logs — nothing to reconfigure. That's what turns this from a one-time audit prep exercise into infrastructure: the report is regenerable on demand, from data your application is already producing, rather than a project someone has to remember to do before every review.

For the full picture of what feeds into `audit.jsonl` and `costs.jsonl` in the first place, see the [PII redaction](/blog/pii-redaction-deep-dive) and [GitHub quickstart](https://github.com/multimindlab/multimind-sdk#readme) guides.
