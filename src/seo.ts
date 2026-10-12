export const SITE = "https://multimind.dev";

export const BRAND_KEYWORDS = [
  "multimind-sdk",
  "MultiMind SDK",
  "multimind sdk",
  "pip install multimind-sdk",
  "compliance-first AI agent framework",
  "AI compliance SDK",
  "Python LLM SDK",
  "PII guard for LLMs",
  "PII redaction",
  "EU AI Act evidence reporting",
  "GDPR HIPAA AI guardrails",
  "OpenAI-compatible compliance proxy",
  "multimind serve",
  "multi-model LLM router",
  "LangChain compliance wrapper",
  "sovereign AI SDK",
  "on-prem LLM compliance",
  "open source AI agent framework",
  "LLM governance",
  "LLM audit trail",
  "LLM cost tracking",
  "hallucination detection",
  "EU sovereign AI",
  "MCP compliance server",
  "multimind dashboard",
  "SOC 2 evidence reporting",
  "AI agent memory",
  "AI usage audit",
];

const LOCALIZED_KEYWORDS: Record<string, string[]> = {
  fr: [
    "framework agents IA conformité",
    "garde-fou PII",
    "preuves AI Act",
    "SDK conformité Python",
  ],
  nl: [
    "AI-agentframework compliance",
    "PII-guard",
    "AI Act bewijsrapportage",
    "Python SDK compliance",
  ],
};

export const alternateNames = ["multimind-sdk", "multimind sdk"];

export const sameAs = [
  "https://github.com/multimindlab/multimind-sdk",
  "https://docs.multimind.dev/",
  "https://pypi.org/project/multimind-sdk/",
  "https://discord.gg/K64U65je7h",
  "https://x.com/multimindsdk",
  "https://opencollective.com/multimind-sdk",
];

export function keywordsFor(lang = "en", extra: string[] = []) {
  return [...BRAND_KEYWORDS, ...(LOCALIZED_KEYWORDS[lang] ?? []), ...extra].join(", ");
}

export function siteIdentityGraph() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE}/#organization`,
        name: "MultiMind SDK",
        alternateName: alternateNames,
        url: SITE,
        logo: `${SITE}/assets/icon-512.png`,
        email: "info@ai2innovate.io",
        description:
          "multimind-sdk is the compliance-first AI agent framework: one Python API for every LLM, with a PII guard, cost budgets, and GDPR, HIPAA, and EU AI Act evidence reporting.",
        sameAs,
        parentOrganization: {
          "@type": "Organization",
          name: "AI2Innovate",
          url: "https://ai2innovate.io",
        },
      },
      {
        "@type": "WebSite",
        "@id": `${SITE}/#website`,
        url: SITE,
        name: "MultiMind SDK",
        alternateName: alternateNames,
        description:
          "multimind-sdk — the compliance-first AI agent framework. One API for every LLM, with GDPR, HIPAA, and EU AI Act evidence reporting built in.",
        inLanguage: ["en", "fr", "nl"],
        keywords: keywordsFor("en"),
        publisher: { "@id": `${SITE}/#organization` },
      },
    ],
  };
}
