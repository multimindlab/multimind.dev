---
title: "EU AI Act Readiness Checklist for AI Product Teams"
description: "A practical, evidence-based checklist for what you actually need before an EU AI Act conversation with legal or a regulator — not legal advice, just the artifacts that matter."
pubDate: 2026-07-14
tags: ["business", "eu-ai-act", "compliance", "checklist"]
---

This is not legal advice. It's a practical checklist of the technical artifacts an AI product team should have on hand before an EU AI Act conversation with legal, procurement, or a regulator — the things that turn "we think we're compliant" into "here's the evidence."

## 1. Can you produce a record of what the model was asked and told?

Article 12 record-keeping expects traceability of system behavior. If your answer to "show me the logs for this model's decisions last month" is "we don't have that," that's the first gap to close — before anything else on this list, because everything downstream depends on having the underlying artifact.

## 2. Do you know what sensitive data went into your model calls?

Not "we're pretty sure" — a record. If a customer or regulator asks whether PII was ever sent to a third-party model provider, you need a detection log, not a policy that says it shouldn't happen. A drop-in PII guard that redacts, blocks, or masks per policy and writes each detection to an audit log is the artifact this requires.

## 3. Is your transparency obligation (Art. 50) actually implementable, or just written down?

Art. 50 transparency requirements — telling users they're interacting with an AI system, in the applicable cases — need to be enforceable at the point where the interaction happens, not just documented in a policy nobody checks against the running system.

## 4. Do you have cost and usage records per model, per project?

This isn't an AI Act requirement directly, but it's usually asked for in the same review, because "what AI is actually running in production" is a question regulators, auditors, and your own security team ask together. If you can't answer "what models did we call, how many times, at what cost, this month" from a log rather than from memory, that's a gap.

## 5. Are your compliance claims honest about what they cover?

This is the one teams get wrong in the opposite direction — overclaiming. A mapping from your logs to "Art. 12 record-keeping" should say the evidence *supports* that control, not that you're *certified* or *compliant* — an absent artifact means absent evidence, not absent risk, and a report that blurs that distinction is a liability in exactly the review it's meant to help with.

## 6. Can you generate this evidence on demand, not just reconstruct it after an incident?

If producing this checklist's answers requires an engineer manually assembling logs from three systems, that's not readiness — it's a fire drill waiting to be scheduled. The artifacts above should be a report you can generate, not a project you'd have to start.

## Turning this into a system

MultiMind SDK's compliance module was built directly against this list: a PII guard that produces the detection log for item 2, audit logging that covers items 1 and 4, and `multimind compliance report-evidence` which generates the report for item 5, using the "supports, never satisfies" framing from item 5 by design — pulling from `audit.jsonl` and `costs.jsonl` your app already produces, not from a separate compliance system you'd have to stand up and keep in sync.

```bash
multimind compliance report-evidence \
  --audit-log audit.jsonl \
  --costs-log costs.jsonl \
  --project . \
  --period 2026-07 \
  --format html -o evidence.html
```

If you're preparing for this conversation with legal or a customer's security team and want to see what the generated evidence actually looks like, the [quickstart](/#quickstart) walks through it, or reach out at [info@ai2innovate.io](mailto:info@ai2innovate.io).
