---
title: "Deploying the MultiMind Compliance Proxy in Docker for a Zero-Code-Change Rollout"
description: "Running multimind serve as a sidecar container so an existing application gets PII redaction, budgets, and audit logging without touching its code."
pubDate: 2026-07-14
tags: ["tech", "docker", "deployment", "infra"]
---

The lowest-friction way to add compliance to an application you don't want to modify is running the proxy as its own container, sitting between your app and the model provider it already calls. The application changes one config value — its `base_url` — and everything else about the deployment stays the same.

## Why a sidecar, not a code change

`multimind serve` is designed around exactly this: point any OpenAI-compatible client at it, and it forwards to the real upstream provider while applying PII redaction, budget checks, and audit logging on every call:

```bash
multimind serve --port 8400 --upstream openai \
  --block-on ssn,credit_card \
  --budget 25.00 \
  --audit-log audit.jsonl
```

Running this as a container rather than a process on the application host means it can be deployed, scaled, and rolled back independently of the application — the same operational pattern as any other sidecar or proxy service, which is a familiar shape for most infra teams already.

## A minimal container pattern

MultiMind SDK's Docker deployment is listed as a stable, shipped feature — check the [repo](https://github.com/multimindlab/multimind-sdk) for whether a published image already exists before building your own. If you're containerizing it yourself, the shape is standard for a pip-installed Python CLI:

```dockerfile
FROM python:3.11-slim

RUN pip install --no-cache-dir "multimind-sdk[gateway]"

EXPOSE 8400

ENTRYPOINT ["multimind", "serve", "--port", "8400"]
```

```bash
docker build -t multimind-proxy .
docker run -d -p 8400:8400 \
  -e OPENAI_API_KEY=$OPENAI_API_KEY \
  -v $(pwd)/audit:/audit \
  multimind-proxy \
  --upstream openai \
  --block-on ssn,credit_card \
  --budget 25.00 \
  --audit-log /audit/audit.jsonl
```

The volume mount for the audit log matters operationally: `audit.jsonl` is the artifact `multimind compliance report-evidence` reads later, so it needs to persist somewhere durable rather than living only inside the container's writable layer, where it disappears on restart.

## Application-side change

Wherever the application currently points at `api.openai.com`, it points at the proxy container instead:

```python
from openai import OpenAI

client = OpenAI(
    base_url="http://multimind-proxy:8400/v1",
    api_key="unused-upstream-key-is-server-side",
)
```

That's the entire application-side diff — no SDK swap, no wrapping every call site, no change to how the application constructs prompts or handles responses.

## Operational considerations before production

A few things worth deciding deliberately rather than defaulting into:

- **Where the API key lives.** The upstream provider's key is configured on the proxy, not the application — which means the application no longer needs it at all. That's a real reduction in secret sprawl, but it also means the proxy container's environment is now the sensitive boundary to lock down.
- **Log persistence and rotation.** `audit.jsonl` grows with every call; plan for rotation and durable storage the same way you would for any production log, since it's also the input to your compliance evidence reports.
- **Failure mode if the proxy is down.** Since the application now depends on the proxy container to reach the model provider at all, the proxy's availability is now part of the application's availability. Treat it with the same health checks and redundancy as any other service in the request path.

For the audit log's downstream use in compliance reporting, see [Generating EU AI Act Evidence Reports from Your Existing Logs](/blog/generating-compliance-evidence-reports).
