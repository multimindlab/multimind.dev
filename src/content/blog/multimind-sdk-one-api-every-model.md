---
title: "Inside MultiMind SDK: One API, Every Model, Compliance by Default"
description: "What MultiMind SDK actually does — a tour of the multi-model interface, the compliance layer, RAG and agents, and why it wraps your existing stack instead of replacing it."
pubDate: 2026-07-14
tags: ["multimind-sdk", "product"]
---

MultiMind SDK is a Python framework for building AI applications where model access, cost control, and compliance evidence are the same layer — not three separate systems you have to keep in sync. This post is a straight tour of what's actually in it, without the marketing gloss.

## One interface, every provider

At the core is a single async interface over OpenAI, Claude, Gemini, Mistral, Groq, DeepSeek, xAI, Together, Perplexity, Fireworks, Cerebras, 300+ models via OpenRouter, and local models via Ollama.

```python
from multimind import OpenAIModel, ClaudeModel, GeminiModel

gpt = OpenAIModel(model_name="gpt-4o-mini")
claude = ClaudeModel(model_name="claude-3-5-sonnet-20241022")
gemini = GeminiModel(model_name="gemini-2.0-flash")

response = await gpt.generate("Hello!")
response = await claude.generate("Hello!")
response = await gemini.generate("Hello!")
```

The interesting part isn't the abstraction itself — every framework has a model wrapper — it's `ModelSession`, which carries a live conversation's context across providers. You can start a conversation on GPT, move it to Claude mid-thread, and finish it on a local model, with the context traveling with you. That matters in practice for cost routing (cheap model for the easy turns, expensive model for the hard ones) and for provider outages (failover without losing conversation state).

## Compliance is a wrapper, not a module you bolt on later

The PII guard is a one-line wrapper around any model:

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

Every call through a guarded model gets PII detection, redaction or blocking per your policy, and an audit log entry — automatically, not as a step someone has to remember. The same audit and cost logs feed `multimind compliance report-evidence`, which generates evidence reports mapped to EU AI Act, SOC 2, HIPAA, and GDPR control themes, phrased as "supports," never "satisfies."

## Wrap what you have — don't migrate off it

This is the part that differs most from a typical SDK pitch. If you already have a LangChain, LlamaIndex, CrewAI, AutoGen, or Haystack application, MultiMind doesn't ask you to rewrite it. Run the compliance proxy and point your existing OpenAI-compatible client at it:

```bash
multimind serve --port 8400 --upstream openai \
  --block-on ssn,credit_card \
  --budget 25.00 \
  --audit-log audit.jsonl
```

```python
from openai import OpenAI

# The ONLY change: base_url.
client = OpenAI(
    base_url="http://localhost:8400/v1",
    api_key="unused-upstream-key-is-server-side",
)
```

Every call now gets PII redaction, budget enforcement, and an audit trail, with zero changes to your application code. That's the core design bet: governance as a proxy layer in front of whatever you already run, not a framework you migrate into.

## RAG and agents, same governance underneath

RAG support covers FAISS and Chroma out of the box with document processing, plus 40+ client-backed vector stores (Pinecone, Qdrant, Weaviate, Milvus, pgvector, LanceDB among them). The fluent pipeline API:

```python
result = await (
    pipeline
    .load_documents(["Your documents here"])
    .query("What does this say?")
    .generate()
    .execute()
)
```

Agents get native function-calling with persistent memory:

```python
from multimind.agents import Agent
from multimind.agents.tools import CalculatorTool

agent = Agent(model=OpenAIModel(model_name="gpt-4o-mini"), tools=[CalculatorTool()])
response = await agent.run("Use the calculator", expression="42 * 17")
```

Both sit behind the same model interface, so the same PII guard, budget, and audit wrapping applies whether the call originated from a chat completion, a RAG query, or an agent's tool call.

## What's alpha vs. beta

The SDK is explicit about status rather than presenting everything as equally production-ready. Multi-model chat, streaming, the PII guard, cost budgets, hallucination detection, framework adapters, and the compliance proxy are alpha. Self-orchestrating agents, non-transformer model support (Mamba, RWKV), fine-tuning, and the extended vector store set are beta. That distinction is maintained directly against [FEATURES.md](https://github.com/multimindlab/multimind-sdk/blob/develop/FEATURES.md) in the repo, so it doesn't drift from what's actually shipped.

Full docs and source: [github.com/multimindlab/multimind-sdk](https://github.com/multimindlab/multimind-sdk).
