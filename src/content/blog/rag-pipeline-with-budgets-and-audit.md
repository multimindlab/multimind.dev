---
title: "Building a RAG Pipeline with Cost Budgets and Audit Trails"
description: "Standing up a RAG pipeline with MultiMind, and why the same governance concerns from single-call generation — budget, audit — don't go away just because retrieval is in the loop."
pubDate: 2026-07-14
tags: ["tech", "python", "rag"]
---

RAG pipelines get evaluated on retrieval quality — is the right chunk coming back for a given query — and that's the right first question. But a RAG pipeline is still, underneath, a sequence of model calls: an embedding call per document and per query, and a generation call per response. Every governance concern that applies to a single `model.generate()` call — cost, audit, PII exposure — applies here too, just distributed across more calls per user-visible response.

## The pipeline itself

MultiMind's fluent RAG API:

```python
from multimind.rag.fluent import RAGPipeline, RAGConfig
from multimind.vector_store.base import VectorStoreConfig, VectorStoreFactory
from multimind.core.router import Router

router = Router()
vector_store = VectorStoreFactory.create_store(
    "faiss",
    VectorStoreConfig.create_faiss_config(dimension=1536, metric="cosine"),
)

pipeline = RAGPipeline(router, RAGConfig(
    vector_store=vector_store,
    embedding_provider="openai",
    embedding_model="text-embedding-ada-002",
    generation_provider="openai",
    generation_model="gpt-4o-mini",
))

result = await (
    pipeline
    .load_documents(["Your documents here"])
    .query("What does this say?")
    .generate()
    .execute()
)
print(result.answer)
```

`load_documents` handles chunking and embedding into the configured vector store (FAISS here — Chroma and 40+ other client-backed stores including Pinecone, Qdrant, Weaviate, Milvus, pgvector, and LanceDB are supported the same way via `VectorStoreFactory`). `query().generate().execute()` retrieves relevant chunks and runs the generation call against them.

## Why cost adds up faster here than it looks

A single chat feature is one generation call per user turn. A RAG feature is an embedding call per document at ingest time, an embedding call per query, and a generation call per response — and the generation call's prompt now includes retrieved context, which is usually larger than a bare user message. Teams that budget RAG features based on "cost per generation call," the way they'd budget a plain chat feature, are usually undercounting by the embedding calls and the larger prompt size.

This is exactly the failure mode `multimind audit` is for — tracking usage and cost per team or project across whatever calls your application makes, so the actual per-feature cost (embedding plus generation, at real prompt sizes) shows up in the number instead of an estimate based on the generation call alone.

## Where PII exposure hides in RAG specifically

The documents you're loading into `load_documents` are a PII surface independent of what the user types. A support-ticket knowledge base, a document store with customer records, internal notes with names and contact details — all of it gets embedded and becomes retrievable context that a generation call can surface back to a user, even if the user's own query contained nothing sensitive. Scanning source documents before ingestion — the same `multimind compliance scan-text` check used for input validation elsewhere — is worth running against your document set, not just against live user input.

## The practical takeaway

None of this is a reason to avoid RAG — it's a reason to budget and audit it at the pipeline level rather than assuming the governance you've already put in front of a single `generate()` call automatically covers a multi-call pipeline sitting behind it. Point `embedding_provider`/`generation_provider` at whichever upstream you're already tracking with `multimind audit`, and treat document ingestion as a PII-scanning checkpoint, not just live user input.

For the guard mechanics referenced above, see [Redacting PII in Production LLM Calls](/blog/pii-redaction-deep-dive).
