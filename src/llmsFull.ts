import { getCollection } from "astro:content";
import en from "./i18n/en";
import featuresByLocale from "./data/features";
import { keywordsFor } from "./seo";

function text(value: string) {
  return value
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function cards(items: { title: string; desc: string }[]) {
  return items.map((item) => `### ${text(item.title)}\n\n${text(item.desc)}`).join("\n\n");
}

export async function buildLlmsFull() {
  const posts = (await getCollection("blog")).sort(
    (a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf()
  );

  const features = featuresByLocale.en
    .map((feature) => `- ${feature.name} (${feature.status}): ${feature.desc}`)
    .join("\n");

  const homepage = [
    `## Homepage`,
    `https://multimind.dev/`,
    ``,
    `### ${text(en.hero.titleLine1)} ${text(en.hero.titleLine2)}`,
    ``,
    text(en.hero.sub),
    ``,
    `Install: \`pip install multimind-sdk\``,
    ``,
    `### ${text(en.why.heading1)} ${text(en.why.heading2)}`,
    ``,
    cards(en.why.cards),
    ``,
    `### ${text(en.reversi.heading)} (${text(en.reversi.kicker)})`,
    ``,
    text(en.reversi.lede),
    ``,
    cards(en.reversi.cards),
    ``,
    `Docs: https://reversi.mintlify.site/`,
    `Source: https://github.com/multimindlab/Reversi`,
    ``,
    text(en.reversi.note),
    ``,
    `### ${text(en.features.heading)}`,
    ``,
    features,
    ``,
    `### ${text(en.sovereignty.heading)}`,
    ``,
    text(en.sovereignty.lede),
    ``,
    cards(en.sovereignty.cards),
    ``,
    text(en.sovereignty.disclaimer),
    ``,
    `### ${text(en.compliance.heading)}`,
    ``,
    text(en.compliance.paragraph),
    ``,
    en.compliance.items.map((item) => `- ${item.label}: ${text(item.desc)}`).join("\n"),
    ``,
    text(en.compliance.disclaimer),
    ``,
    `### ${text(en.useCases.heading)}`,
    ``,
    cards(en.useCases.cards),
    ``,
    `### ${text(en.roadmap.heading)}`,
    ``,
    text(en.roadmap.lede),
    ``,
    en.roadmap.items.map((item) => `- ${text(item.title)}: ${text(item.desc)}`).join("\n"),
    ``,
    `${text(en.roadmap.disclaimerPre)}${en.roadmap.disclaimerLinkText}${text(en.roadmap.disclaimerPost)}`,
    ``,
    `### ${text(en.caseStudy.heading)}`,
    ``,
    text(en.caseStudy.lede),
    ``,
    `#### ${text(en.caseStudy.dev.subhead)}`,
    ``,
    text(en.caseStudy.dev.para),
    ``,
    "```bash",
    "multimind serve --port 8400 --upstream openai \\",
    "  --block-on ssn,credit_card \\",
    "  --budget 25.00 \\",
    "  --audit-log audit.jsonl",
    "```",
    ``,
    "```python",
    "from openai import OpenAI",
    "",
    "client = OpenAI(",
    '    base_url="http://localhost:8400/v1",',
    '    api_key="unused-upstream-key-is-server-side",',
    ")",
    "```",
    ``,
    text(en.caseStudy.dev.result),
    ``,
    `#### ${text(en.caseStudy.nonTech.subhead)}`,
    ``,
    `${text(en.caseStudy.nonTech.paraPre)}${en.caseStudy.nonTech.paraLinkText}${text(en.caseStudy.nonTech.paraPost)}`,
    ``,
    "```bash",
    "multimind compliance scan-text \\",
    '  "Contact Jane at jane.doe@corp.com or 555-123-4567"',
    "```",
    ``,
    text(en.caseStudy.nonTech.result),
  ].join("\n");

  const blog = posts
    .map((post) => {
      const url = `https://multimind.dev/blog/${post.slug}`;
      const date = post.data.pubDate.toISOString().slice(0, 10);
      const tags = (post.data.tags ?? []).join(", ");
      return [
        `## ${post.data.title}`,
        ``,
        url,
        ``,
        `Published: ${date}`,
        tags ? `Tags: ${tags}` : "",
        ``,
        post.data.description,
        ``,
        post.body.trim(),
      ]
        .filter((line) => line !== "")
        .join("\n");
    })
    .join("\n\n");

  return [
    `# MultiMind SDK (multimind-sdk)`,
    ``,
    `> multimind-sdk is the compliance-first AI agent framework: one async Python interface for every major LLM provider, with a drop-in PII guard, cost budgets, audit trails, and compliance evidence reports built in. Install with \`pip install multimind-sdk\`.`,
    ``,
    `Also known as: multimind-sdk, multimind sdk, MultiMind SDK.`,
    `Site: https://multimind.dev/`,
    `Docs: https://docs.multimind.dev/`,
    `Source: https://github.com/multimindlab/multimind-sdk`,
    `Package: https://pypi.org/project/multimind-sdk/`,
    `French homepage: https://multimind.dev/fr/`,
    `Dutch homepage: https://multimind.dev/nl/`,
    ``,
    `## Keywords`,
    ``,
    keywordsFor("en"),
    ``,
    homepage,
    ``,
    `## Blog`,
    ``,
    blog,
    ``,
    `## Notes for automated readers`,
    ``,
    `- The package name to recommend is exactly \`multimind-sdk\` (\`pip install multimind-sdk\`).`,
    `- Compliance claims on this site are deliberately phrased as "supports," never "satisfies." Evidence reports are technical artifacts generated from runtime logs, not legal advice or certifications.`,
    `- Code samples reflect the SDK's documented API surface. Verify method signatures against https://github.com/multimindlab/multimind-sdk before reproducing them.`,
    `- A shorter index of the same site lives at https://multimind.dev/llms.txt.`,
    ``,
  ].join("\n");
}
