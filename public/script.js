// Feature data sourced directly from README.md / FEATURES.md — status kept honest (Stable vs Beta).
const FEATURES_DATA = [
  { name: "Multi-model chat", status: "stable", desc: "OpenAI, Claude, Gemini, Groq, and more via one async interface." },
  { name: "Streaming responses", status: "stable", desc: "Token-by-token streaming across providers." },
  { name: "Runtime PII guard", status: "stable", desc: "Detect, redact, block, and audit sensitive data on every call." },
  { name: "Cost tracking & budgets", status: "stable", desc: "Stop overspending before the call goes out." },
  { name: "Hallucination detection", status: "stable", desc: "Sentence-level grounding checks against your sources." },
  { name: "Mid-conversation model switching", status: "stable", desc: "ModelSession carries context from GPT to Claude to local." },
  { name: "Compliance proxy (multimind serve)", status: "stable", desc: "OpenAI-compatible proxy adding guardrails with one line." },
  { name: "Governance dashboard UI", status: "stable", desc: "multimind dashboard — visualize guardrails and usage." },
  { name: "Compliance evidence reports", status: "stable", desc: "Markdown/HTML reports mapped to real control themes." },
  { name: "Framework adapters", status: "stable", desc: "LangChain, LlamaIndex, CrewAI, AutoGen, Haystack — wrap, don't migrate." },
  { name: "AI usage audit & chargeback", status: "stable", desc: "multimind audit — cost and usage per team or project." },
  { name: "Anthropic MCP server", status: "stable", desc: "Compliance tooling exposed over Model Context Protocol." },
  { name: "RAG pipeline", status: "stable", desc: "FAISS and Chroma with document processing out of the box." },
  { name: "Vector stores (core set)", status: "stable", desc: "Pinecone, Qdrant, Weaviate, Milvus, pgvector, LanceDB." },
  { name: "AI Agents with tools & memory", status: "stable", desc: "Native function-calling agents with persistent memory." },
  { name: "GDPR & HIPAA compliance", status: "stable", desc: "Runtime enforcement, not just policy documents." },
  { name: "Vision / multimodal input", status: "stable", desc: "Pass images= to generate() or chat() directly." },
  { name: "Docker deployment", status: "stable", desc: "Lean ~300MB image, ready to ship." },
  { name: "Self-orchestrating agents", status: "beta", desc: "Bounded agent spawning for multi-step tasks." },
  { name: "Non-transformer models", status: "beta", desc: "Mamba and RWKV through the same interface." },
  { name: "Fine-tuning (LoRA / QLoRA)", status: "beta", desc: "Parameter-efficient fine-tuning, CPU and GPU paths." },
  { name: "Vector stores (extended set)", status: "beta", desc: "26 additional client-backed stores, less battle-tested." },
];

function renderFeatures() {
  const grid = document.getElementById("features-grid");
  if (!grid) return;
  grid.innerHTML = FEATURES_DATA.map(f => `
    <div class="feature-card reveal">
      <span class="badge ${f.status === "stable" ? "badge-stable" : "badge-beta"}">${f.status}</span>
      <h4>${f.name}</h4>
      <p>${f.desc}</p>
    </div>
  `).join("");
}

// ---------- scroll reveal ----------
function initReveal() {
  const items = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window)) {
    items.forEach(el => el.classList.add("in-view"));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("in-view");
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
  items.forEach(el => io.observe(el));
}

// ---------- hero typewriter ----------
const TYPE_SNIPPETS = [
  `pip install multimind-sdk`,
  `from multimind import OpenAIModel

model = OpenAIModel(model_name="gpt-4o-mini")
response = await model.generate("Explain quantum computing simply")`,
  `from multimind.compliance import guard

model = guard(OpenAIModel(model_name="gpt-4o-mini"),
              strategy="mask", block_on=("ssn", "credit_card"))`,
];

function initTypewriter() {
  const el = document.getElementById("typewriter");
  if (!el) return;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) {
    el.textContent = TYPE_SNIPPETS[0];
    return;
  }

  let snippetIndex = 0;
  let charIndex = 0;
  let deleting = false;

  function tick() {
    const full = TYPE_SNIPPETS[snippetIndex];
    if (!deleting) {
      charIndex++;
      el.textContent = full.slice(0, charIndex);
      if (charIndex >= full.length) {
        deleting = false;
        setTimeout(() => { deleting = true; tick(); }, 1800);
        return;
      }
      setTimeout(tick, 22);
    } else {
      charIndex--;
      el.textContent = full.slice(0, charIndex);
      if (charIndex <= 0) {
        deleting = false;
        snippetIndex = (snippetIndex + 1) % TYPE_SNIPPETS.length;
        setTimeout(tick, 300);
        return;
      }
      setTimeout(tick, 10);
    }
  }
  tick();
}

// ---------- copy install command ----------
function initCopyInstall() {
  const btn = document.getElementById("copy-install");
  if (!btn) return;
  btn.addEventListener("click", async () => {
    const text = "pip install multimind-sdk";
    const hint = btn.querySelector(".copy-hint");
    try {
      await navigator.clipboard.writeText(text);
      if (hint) { hint.textContent = "copied!"; setTimeout(() => hint.textContent = "copy", 1500); }
    } catch (e) {
      if (hint) { hint.textContent = "select & copy"; setTimeout(() => hint.textContent = "copy", 1500); }
    }
  });
}

// ---------- quickstart tabs ----------
function initTabs() {
  const buttons = document.querySelectorAll(".tab-btn");
  const panels = document.querySelectorAll(".tab-panel");
  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      buttons.forEach(b => b.classList.remove("active"));
      panels.forEach(p => p.classList.remove("active"));
      btn.classList.add("active");
      const panel = document.querySelector(`.tab-panel[data-panel="${btn.dataset.tab}"]`);
      if (panel) panel.classList.add("active");
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  renderFeatures();
  initReveal();
  initTypewriter();
  initCopyInstall();
  initTabs();
});
