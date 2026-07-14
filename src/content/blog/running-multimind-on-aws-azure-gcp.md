---
title: "Running MultiMind SDK on AWS, Azure, and GCP"
description: "You don't need a different SDK per cloud. Here's how MultiMind's proxy pattern applies to AWS Bedrock, Azure OpenAI, and GCP Vertex AI — plus fully on-prem with Ollama."
pubDate: 2026-07-14
tags: ["aws", "azure", "gcp", "cloud", "infrastructure"]
---

A question that comes up early with any platform or infra team evaluating MultiMind: which cloud is it built for? The honest answer is none of them specifically, and that's deliberate. MultiMind's governance layer — PII guarding, budgets, audit trails — sits in front of *any* OpenAI-compatible model endpoint. It doesn't care whether that endpoint is hosted by OpenAI directly, by a hyperscaler, or on a box under someone's desk.

## The mechanism: one proxy, any upstream

The core primitive is `multimind serve` — a compliance proxy that speaks the OpenAI chat completions API on one side and forwards to an upstream model on the other, applying PII redaction, budget checks, and audit logging on every call in between:

```bash
multimind serve --port 8400 --upstream openai \
  --block-on ssn,credit_card \
  --budget 25.00 \
  --audit-log audit.jsonl
```

Your application changes exactly one line — `base_url` — and nothing else:

```python
from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:8400/v1",
    api_key="unused-upstream-key-is-server-side",
)
```

This is the pattern that makes cloud portability a non-event rather than a rewrite: the proxy's *upstream* is the configurable part. Whatever endpoint you point it at — a direct provider API, or a cloud-hosted equivalent — gets the same governance applied, as long as it speaks (or can be fronted to speak) the OpenAI-compatible protocol.

## AWS Bedrock

Bedrock hosts Anthropic, Meta, Mistral, and Amazon's own models behind AWS's API surface, and increasingly exposes OpenAI-compatible endpoints for a subset of them. Where that compatibility exists, point `multimind serve --upstream` (or your own thin adapter in front of the Bedrock Runtime API) at it the same way you would at OpenAI directly — the redaction, budget, and audit behavior on the MultiMind side doesn't change. For models MultiMind already wraps natively (Claude, for instance), you get the same interface whether the call ultimately lands on Anthropic's API or Bedrock's hosted Claude, since the governance sits in your call path, not inside the provider's infrastructure.

## Azure OpenAI

Azure OpenAI Service is the most direct fit, since it's explicitly designed to be API-compatible with OpenAI — most applications only need to change the base URL and auth headers to move between them. That's exactly the seam `multimind serve` is built around: your app keeps talking to `http://localhost:8400/v1`, and the proxy's upstream points at your Azure OpenAI deployment instead of api.openai.com. Enterprises running Azure OpenAI for data-residency or existing-Microsoft-agreement reasons get the same PII guard and audit trail they'd get on any other upstream, without a separate integration path.

## GCP Vertex AI

Vertex AI hosts Gemini alongside Model Garden's third-party and open models. MultiMind's `GeminiModel` already talks to Google's Gemini API directly; for workloads that specifically need to run through Vertex (for IAM, VPC-SC, or billing-consolidation reasons), the same upstream-proxy approach applies — front the Vertex endpoint with the OpenAI-compatible shape the proxy expects, and governance follows the same call path as everywhere else.

## Fully on-prem or air-gapped: Ollama

Not every environment can send data to a cloud provider at all. MultiMind's local-model support via Ollama means the entire stack — model, PII guard, budget enforcement, audit logging — can run without a network call leaving the host. This is the same code path as the cloud-backed providers; only the upstream changes. For regulated environments where the answer to "can we send this to any external API" is no, this is usually the actual starting point, not an afterthought.

## The point of doing it this way

None of this requires a MultiMind-specific integration for each cloud, and that's the design intent, not a gap. Cloud portability, and the ability to move a workload between a hyperscaler and on-prem without touching the compliance logic, falls out of treating the model endpoint as a configurable upstream behind one governance layer — instead of writing that governance three times, once per cloud SDK.

If you're planning a multi-cloud or hybrid deployment, the practical first step is confirming which of your target endpoints already speak the OpenAI-compatible API and which need a thin adapter in front of them — everything downstream of that is identical regardless of which cloud you're pointed at.
