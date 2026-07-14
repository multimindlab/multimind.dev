---
title: "Building a Multi-Model Fallback Router with MultiMind SDK"
description: "A worked example of routing a request across providers with fallback on error, using MultiMind's shared async model interface — no per-provider branching."
pubDate: 2026-07-14
tags: ["tech", "python", "reliability"]
---

Provider outages and rate limits don't announce themselves ahead of time. If your application talks to a single model provider's SDK directly, handling that means catching that specific SDK's exception types and writing provider-specific retry logic — and repeating that work for every provider you add. Since MultiMind SDK puts every provider behind the same async interface, the fallback logic only has to be written once.

## The setup

Each provider is just a model instance with the same `generate()` method:

```python
from multimind import OpenAIModel, ClaudeModel, GeminiModel

gpt = OpenAIModel(model_name="gpt-4o-mini")
claude = ClaudeModel(model_name="claude-3-5-sonnet-20241022")
gemini = GeminiModel(model_name="gemini-2.0-flash")
```

Because `generate()` has the same shape regardless of provider, a fallback router is just a list and a loop — there's no per-provider branch to maintain:

```python
async def generate_with_fallback(prompt: str, models: list, **kwargs) -> str:
    last_error = None
    for model in models:
        try:
            return await model.generate(prompt, **kwargs)
        except Exception as exc:
            last_error = exc
            continue
    raise RuntimeError(f"All providers failed. Last error: {last_error}")

response = await generate_with_fallback(
    "Summarize this incident report in two sentences.",
    models=[gpt, claude, gemini],
)
```

This is deliberately unopinionated about retry policy — you'll want backoff, jitter, and probably a circuit breaker before this goes into production traffic — but the point is that the fallback ordering is just data (a list of model instances), not a rewrite for each provider you add.

## Keeping context across the fallback

A plain retry loop is fine for single-turn requests, but a multi-turn conversation that fails over mid-thread needs the conversation history to travel with it — otherwise the fallback provider is answering with no context and the user notices immediately. This is the problem `ModelSession` solves: per the SDK's design, a live conversation's context travels with you as you move from one provider to another mid-thread, so a fallback isn't "start over on a different model," it's "continue the same conversation on a different model." For the exact session API, check the current docs at the [GitHub repo](https://github.com/multimindlab/multimind-sdk) — this post sticks to the fallback-loop pattern above, which only depends on the shared `generate()` interface every model class exposes.

## Wiring in health checks instead of only reacting to errors

A slightly more proactive version tracks recent failure rates per provider and skips a provider that's been failing, rather than always trying it first and eating the latency of a failed call:

```python
from collections import deque

class ProviderHealth:
    def __init__(self, window=20, threshold=0.5):
        self.results = deque(maxlen=window)
        self.threshold = threshold

    def record(self, ok: bool):
        self.results.append(ok)

    def healthy(self) -> bool:
        if len(self.results) < 5:
            return True
        return (sum(self.results) / len(self.results)) >= self.threshold

health = {gpt: ProviderHealth(), claude: ProviderHealth(), gemini: ProviderHealth()}

async def generate_with_health_aware_fallback(prompt: str, models: list, **kwargs) -> str:
    ordered = sorted(models, key=lambda m: health[m].healthy(), reverse=True)
    for model in ordered:
        try:
            result = await model.generate(prompt, **kwargs)
            health[model].record(True)
            return result
        except Exception:
            health[model].record(False)
    raise RuntimeError("All providers unhealthy")
```

## Where governance fits in

None of the above changes if you wrap each model with the [compliance guard](/blog/pii-redaction-deep-dive) — `guard(gpt, ...)`, `guard(claude, ...)`, `guard(gemini, ...)` — since the guard wraps the same `generate()` interface the router is already calling. PII redaction, budget enforcement, and audit logging apply per-provider regardless of which one ends up serving a given request, which matters if you need the audit trail to reflect exactly which provider actually handled a call after a fallback.

Full model interface reference in the [quickstart](/#quickstart).
