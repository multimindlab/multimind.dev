---
title: "Redacting PII in Production LLM Calls: A Deep Dive into MultiMind's Guard"
description: "How the guard() wrapper actually changes what a model provider sees, what block_on and strategy control, and how to check what happened after the fact."
pubDate: 2026-07-14
tags: ["tech", "python", "pii", "compliance"]
---

The one-line version of MultiMind's PII guard shows up throughout the docs:

```python
from multimind import OpenAIModel
from multimind.compliance import guard

model = guard(
    OpenAIModel(model_name="gpt-4o-mini"),
    strategy="mask",
    block_on=("credit_card", "ssn"),
    audit_log="compliance_audit.jsonl",
)

response = await model.generate("Email jane.doe@corp.com about the invoice")
# The provider only ever saw: "Email [EMAIL] about the invoice"
```

This post is about what's actually happening in that one call, and the decisions worth making deliberately instead of leaving at the default.

## `strategy="mask"` vs. blocking

The guard takes a masking strategy for detections that aren't in `block_on`, and a hard block for the types you list explicitly. In the example above, an email address gets masked to `[EMAIL]` and the call proceeds — the provider never sees the real address, but the request still goes through, because email in a support-request context is often expected. A credit card number or SSN, on the other hand, is in `block_on`, so a message containing one doesn't get masked and forwarded — it gets stopped before the call goes out.

That split matters for the failure mode you're optimizing against. Masking keeps the application working with degraded input; blocking prevents the call entirely. Getting the split wrong in either direction is a real cost: mask something that should have been blocked and you've sent sensitive data to a third party; block something that should have been masked and you've broken a feature for a false-positive detection.

## Where the audit trail earns its keep

Every call through a guarded model writes a detection event to `audit_log`, whether the outcome was a mask or a block. That's the artifact that answers "did this ever happen" after the fact — not by re-scanning historical logs (which may have already sent the sensitive data somewhere), but from a record generated at the moment of detection.

This is also the piece that makes the guard auditable rather than a black box: `compliance_audit.jsonl` is a plain log you can inspect, `grep`, or feed into `multimind compliance report-evidence` to generate a mapped evidence report. The guard's behavior isn't "trust that it worked" — it's "here's the record that it worked, for every call."

## Testing detection before it's live

Before wiring the guard into a live call path, `multimind compliance scan-text` lets you check what a given string would trigger, without needing an API key or a network call:

```bash
multimind compliance scan-text \
  "Contact Jane at jane.doe@corp.com or 555-123-4567"
```

```
                PII Findings (2)
┏━━━━━━━┳━━━━━━━┳━━━━━┳━━━━━━━━━━━━━━━━━━━┓
┃ Type  ┃ Start ┃ End ┃ Match             ┃
┡━━━━━━━╇━━━━━━━╇━━━━━╇━━━━━━━━━━━━━━━━━━━┩
│ email │    16 │  34 │ jane.doe@corp.com │
│ phone │    38 │  50 │ 555-123-4567      │
└───────┴───────┴─────┴───────────────────┘
```

Running representative production inputs (with real values swapped for synthetic test data) through this command is the fastest way to check your `block_on` list actually covers the PII types your application sees, before it's wired into a live model call where a miss means real data reached a provider.

## Applying it without rewriting your application

The guard wraps any model instance, so it composes with everything else in the SDK — swap `OpenAIModel` for `ClaudeModel` or `GeminiModel` and the same `guard(...)` call applies. For an application you don't want to touch at all, the same protection is available at the proxy layer via `multimind serve`, which applies PII guarding to any OpenAI-compatible client pointed at it with a one-line `base_url` change — see the [case study](/#case-study) for that path.
