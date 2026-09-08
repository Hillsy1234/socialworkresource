import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const siteUrl = "https://social-work-resource.netlify.app";
const siteName = "Ultimate Social Worker Resource";
const publisherName = "Daily Mindset Moments CIC";
const founderName = "Raymond Hill";
let lastReviewed = "2026-07-24";
let lastReviewedLabel = "24 July 2026";
let country = "England";
let jurisdiction = "england";
let routePrefix = "";
let reviewNote = "";
const dateModified = "2026-09-08";
const socialImage = `${siteUrl}/assets/social-share-card-universal.jpg`;
const learningDir = join(rootDir, "learning");

function readProjectFile(path) {
  return readFileSync(join(rootDir, path), "utf8");
}

function writeProjectFile(path, content) {
  writeFileSync(join(rootDir, path), /\.(txt|html)$/.test(path) ? content.replace(/[\t ]+$/gm, '').trimEnd() + '\n' : content);
}


function slugify(text) {
  return text
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function inlineMarkdown(text) {
  let html = escapeHtml(text);
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_match, label, href) => {
    const safeHref = /^(https?:|mailto:|tel:|\/)/i.test(href) ? href : `/${href}`;
    return `<a href="${escapeHtml(safeHref)}">${label}</a>`;
  });
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  return html;
}

function renderMarkdown(markdown) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const html = [];
  let listType = "";
  let inCode = false;
  let codeLines = [];

  function closeList() {
    if (listType) {
      html.push(`</${listType}>`);
      listType = "";
    }
  }

  function openList(type) {
    if (listType !== type) {
      closeList();
      html.push(`<${type}>`);
      listType = type;
    }
  }

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const line = lines[lineIndex];
    if (!inCode && line.trim().startsWith("|") && /^\s*\|?[\s:|-]+\|\s*$/.test(lines[lineIndex + 1] || "")) {
      closeList();
      const cells = row => row.trim().replace(/^\||\|$/g, "").split("|").map(x => inlineMarkdown(x.trim()));
      const head = cells(line);
      lineIndex += 2;
      const rows = [];
      while (lineIndex < lines.length && lines[lineIndex].trim().startsWith("|")) rows.push(cells(lines[lineIndex++]));
      lineIndex--;
      html.push(`<div class="table-scroll"><table><thead><tr>${head.map(x => `<th scope="col">${x}</th>`).join("")}</tr></thead><tbody>${rows.map(row => `<tr>${row.map(x => `<td>${x}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`);
      continue;
    }
    if (line.startsWith("```")) {
      if (inCode) {
        html.push(`<pre><code>${escapeHtml(codeLines.join("\n"))}</code></pre>`);
        codeLines = [];
        inCode = false;
      } else {
        closeList();
        inCode = true;
      }
      continue;
    }

    if (inCode) {
      codeLines.push(line);
      continue;
    }

    if (!line.trim()) {
      closeList();
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      closeList();
      const level = Math.min(heading[1].length + 1, 6);
      html.push(`<h${level} id="${slugify(heading[2])}">${inlineMarkdown(heading[2])}</h${level}>`);
      continue;
    }

    const ordered = line.match(/^\d+\.\s+(.+)$/);
    if (ordered) {
      openList("ol");
      html.push(`<li>${inlineMarkdown(ordered[1])}</li>`);
      continue;
    }

    const unordered = line.match(/^-\s+(.+)$/);
    if (unordered) {
      openList("ul");
      html.push(`<li>${inlineMarkdown(unordered[1])}</li>`);
      continue;
    }

    const quote = line.match(/^>\s?(.+)$/);
    if (quote) {
      closeList();
      html.push(`<blockquote>${inlineMarkdown(quote[1])}</blockquote>`);
      continue;
    }

    closeList();
    html.push(`<p>${inlineMarkdown(line)}</p>`);
  }

  closeList();
  if (inCode) {
    html.push(`<pre><code>${escapeHtml(codeLines.join("\n"))}</code></pre>`);
  }
  return html.join("\n");
}

function textSummary(markdown, fallback) {
  const text = markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/[#*`>|[\]()-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return (text || fallback).slice(0, 220);
}

function jsonLd(value) {
  return JSON.stringify(value, null, 2).replace(/<\/script/gi, "<\\/script");
}

function pageShell({ title, description, canonical, body, structuredData, ogType = "article" }) {
  return `<!doctype html>
<html lang="en-GB">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}">
    <meta name="robots" content="index, follow, max-image-preview:large">
    <link rel="canonical" href="${escapeHtml(canonical)}">
    <meta property="og:type" content="${escapeHtml(ogType)}">
    <meta property="og:locale" content="en_GB">
    <meta property="og:site_name" content="${siteName}">
    <meta property="og:title" content="${escapeHtml(title)}">
    <meta property="og:description" content="${escapeHtml(description)}">
    <meta property="og:url" content="${escapeHtml(canonical)}">
    <meta property="og:image" content="${socialImage}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:image:type" content="image/jpeg">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${escapeHtml(title)}">
    <meta name="twitter:description" content="${escapeHtml(description)}">
    <meta name="twitter:image" content="${socialImage}">
    <script type="application/ld+json">
${jsonLd(structuredData)}
    </script>
    <link rel="icon" type="image/svg+xml" href="/assets/social-worker-resource-logo.svg">
    <link rel="stylesheet" href="/seo-pages.css">
  </head>
  <body>
    <header class="seo-header">
      <a class="seo-brand" href="/">
        <img src="/assets/social-worker-resource-logo.svg" alt="" aria-hidden="true">
        <span>${siteName}</span>
      </a>
      <nav aria-label="SEO page navigation">
        <a href="/">Interactive resource</a>
        <a href="/learning/">England index</a>
        <a href="/learning/wales/">Wales index</a>
        <a href="/llms.txt">AI guide</a>
      </nav>
    </header>
${body}
    <footer class="seo-footer">
      <p>Built by ${publisherName}. ${country}-focused learning resource. ${reviewNote} Not legal advice.</p>
      <p><a href="/">Open the interactive website</a> <span aria-hidden="true">|</span> <a href="/sitemap.xml">Sitemap</a> <span aria-hidden="true">|</span> <a href="/TERMS_OF_SERVICE.md">Terms</a></p>
    </footer>
  </body>
</html>
`;
}

function resourceStructuredData(resource, pageUrl, markdown) {
  return {
    "@context": "https://schema.org",
    "@type": ["WebPage", "LearningResource"],
    name: `${resource.title} | ${country} | ${siteName}`,
    headline: resource.title,
    url: pageUrl,
    description: resource.summary,
    abstract: textSummary(markdown, resource.summary),
    inLanguage: "en-GB",
    isAccessibleForFree: true,
    dateModified,
    ...(jurisdiction === "england" ? { lastReviewed } : { practiceReviewedAt: null }),
    image: socialImage,
    learningResourceType: resource.group,
    educationalUse: ["professional development", "revision", "practice reference"],
    audience: [
      { "@type": "Audience", audienceType: "social workers" },
      { "@type": "Audience", audienceType: "social work students" },
      { "@type": "Audience", audienceType: jurisdiction === "wales" ? "newly qualified social workers in Wales" : "ASYE practitioners" },
      { "@type": "Audience", audienceType: "practice educators" }
    ],
    about: [
      resource.title,
      `${country} social work practice`,
      "legal literacy",
      "social work learning"
    ],
    publisher: {
      "@type": "Organization",
      name: publisherName,
      url: "https://www.daily-mindset-moments.com/",
      founder: {
        "@type": "Person",
        name: founderName,
        jobTitle: "Social worker"
      }
    },
    isPartOf: {
      "@type": "WebSite",
      name: siteName,
      url: `${siteUrl}/`
    }
  };
}

function renderResourcePage(resource, markdown, pageUrl, slug) {
  const description = `${resource.summary} Part of an ${country}-focused social work learning resource.`;
  const body = `    <main class="seo-main">
      <nav class="breadcrumb" aria-label="Breadcrumb">
        <a href="/">Home</a>
        <span aria-hidden="true">/</span>
        <a href="/learning/">England index</a>
        <a href="/learning/wales/">Wales index</a>
        <span aria-hidden="true">/</span>
        <span>${escapeHtml(resource.title)}</span>
      </nav>
      <article class="seo-article">
        <header class="article-hero">
          <p class="eyebrow">${escapeHtml(resource.group)}</p>
          <h1>${escapeHtml(resource.title)}</h1>
          <p>${escapeHtml(resource.summary)}</p>
          <div class="button-row">
            <a class="primary-link" href="/?jurisdiction=${jurisdiction}&amp;resource=${encodeURIComponent(resource.id)}#readerSection">Open interactive section</a>
            <a class="secondary-link" href="/${escapeHtml(resource.path)}">Read source markdown</a>
          </div>
        </header>
        <section class="source-note" aria-label="Practice note">
          <strong>Practice note:</strong> ${country} focus. ${reviewNote} Check current law, statutory guidance, local policy, supervision, and legal advice for live cases.
        </section>
        <div class="article-body">
${renderMarkdown(markdown)}
        </div>
      </article>
    </main>`;
  return pageShell({
    title: `${resource.title} | ${country} | ${siteName}`,
    description,
    canonical: `${siteUrl}/learning/${routePrefix}${slug}.html`,
    body,
    structuredData: resourceStructuredData(resource, pageUrl, markdown)
  });
}

function renderLearningIndex(resources, pageMeta) {
  const groups = new Map();
  for (const resource of resources) {
    if (!groups.has(resource.group)) {
      groups.set(resource.group, []);
    }
    groups.get(resource.group).push(resource);
  }

  const groupCards = [...groups.entries()].map(([group, items]) => `
        <section class="index-group">
          <h2>${escapeHtml(group)}</h2>
          <div class="index-grid">
${items.map((resource) => {
  const meta = pageMeta.get(resource.id);
  return `            <a class="index-card" href="/learning/${routePrefix}${meta.slug}.html">
              <span>${escapeHtml(resource.code)}</span>
              <strong>${escapeHtml(resource.title)}</strong>
              <em>${escapeHtml(resource.summary)}</em>
            </a>`;
}).join("\n")}
          </div>
        </section>`).join("\n");

  const itemList = resources.map((resource, index) => {
    const meta = pageMeta.get(resource.id);
    return {
      "@type": "ListItem",
      position: index + 1,
      name: resource.title,
      url: `${siteUrl}/learning/${routePrefix}${meta.slug}.html`
    };
  });

  return pageShell({
    title: `${country} Social Work Learning Index | ${siteName}`,
    description: `${country} social work learning: ${jurisdiction === "wales" ? "Welsh care and support, ALN" : "Care Act"}, capacity, liberty, mental health, safeguarding, reflection and practice tools.`,
    canonical: `${siteUrl}/learning/${routePrefix}`,
    ogType: "website",
    structuredData: {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "Ultimate Social Worker Resource learning index",
      url: `${siteUrl}/learning/${routePrefix}`,
      itemListElement: itemList
    },
    body: `    <main class="seo-main">
      <section class="index-hero">
        <p class="eyebrow">${country} learning index</p>
        <h1>Social work practice learning pages — ${country}</h1>
        <p>Browse the ${country} guide by topic. These reading pages support students, newly qualified practitioners, social workers and practice educators. Open a section’s interactive version to use its learning tools.</p>
        <div class="button-row">
          <a class="primary-link" href="/">Open interactive resource</a>
          <a class="secondary-link" href="/llms.txt">Open AI guide</a>
        </div>
      </section>
${groupCards}
    </main>`
  });
}

function toolSupplement(pack, resource) {
  const list = (heading, items) => items.length ? `\n\n## ${heading}\n\n${items.join("\n\n")}` : "";
  if (resource.id === "flashcards") return list("Revision cards", pack.flashcardDecks.flatMap(deck => deck.cards.map(x => `### ${deck.title}: ${x.prompt}\n\n${x.answer}`)));
  if (resource.id === "glossary") return list("Practice glossary", pack.glossaryTerms.map(x => `### ${x.term}\n\n${x.definition}`));
  if (resource.id === "scenarios") return list("Worked cases", pack.scenarioWorkouts.map(x => `### ${x.title}\n\n${x.summary}\n\n${x.prompts.map(q => `- ${q}`).join("\n")}\n\nDiscussion: ${x.reveal}`));
  if (resource.id === "theory-practice") return list("Interactive theory lenses", pack.theoryLenses.map(x => `### ${x.title}\n\n${x.focus}\n\nHypothesis: ${x.hypothesis}\n\n${x.test.map(q => `- ${q}`).join("\n")}`));
  if (resource.id === "children-models") return list("Model finder", pack.childPracticeModels.map(x => `### ${x.title}\n\n${x.use || x.focus || x.summary || ""}`));
  if (resource.id === "case-route-finder") return list("Route questions", pack.routeQuestions.map(x => `### ${x.label}\n\n${x.detail}\n\n${x.routes.map(id => pack.routeDetails[id]?.action || "").join(" ")}`));
  if (["student-pathway", "student-asye-pathway"].includes(resource.id)) return list("Pathway activities", pack.studentPathwaySteps.map(x => `### ${x.title}\n\n${x.task}`));
  if (resource.id === "printable-tools") return list("Downloadable prompt text", pack.printableTemplates.map(x => `### ${x.title}\n\n\`\`\`text\n${x.body}\n\`\`\``));
  return "";
}

function main() {
  const packs = ["england", "wales", "scotland", "northern-ireland", "ireland", "new-zealand", "australia-nsw", "canada-ontario", "united-states-california", "australia-victoria", "canada-british-columbia", "united-states-new-york"].map(id => JSON.parse(readProjectFile(`content/${id}/manifest.json`)));
  const entries = [];
  const fullText = [];
  const urls = [`${siteUrl}/`, ...packs.map(p => `${siteUrl}/learning/${p.id === 'england' ? '' : `${p.id}/`}`)];
  rmSync(learningDir, { recursive: true, force: true });
  mkdirSync(learningDir, { recursive: true });
  for (const pack of packs) {
    jurisdiction = pack.id;
    country = jurisdiction === "wales" ? "Wales" : jurisdiction === "scotland" ? "Scotland" : jurisdiction === "northern-ireland" ? "Northern Ireland" : jurisdiction === "ireland" ? "Ireland" : jurisdiction === "new-zealand" ? "Aotearoa New Zealand" : jurisdiction === "australia-nsw" ? "New South Wales" : jurisdiction === "canada-ontario" ? "Ontario" : jurisdiction === "united-states-california" ? "California" : jurisdiction === "australia-victoria" ? "Victoria" : jurisdiction === "canada-british-columbia" ? "British Columbia" : jurisdiction === "united-states-new-york" ? "New York" : "England";
    routePrefix = jurisdiction === "england" ? "" : `${jurisdiction}/`;
    reviewNote = jurisdiction === "england" ? "Existing learning content review date: 24 July 2026." : `Final learning guide. See the Source Library for references and review scope. Independent ${country} practitioner review is not recorded.`;
    const dir = join(learningDir, routePrefix);
    mkdirSync(dir, { recursive: true });
    const pageMeta = new Map();
    const usedSlugs = new Set();
    for (const resource of pack.resources) {
      let slug = resource.slug || slugify(resource.title);
      if (usedSlugs.has(slug)) slug += `-${resource.id}`;
      usedSlugs.add(slug);
      pageMeta.set(resource.id, { slug });
      const markdown = (resource.markdown ?? readProjectFile(resource.path)) + toolSupplement(pack, resource);
      const htmlUrl = `${siteUrl}/learning/${routePrefix}${slug}.html`;
      writeFileSync(join(dir, `${slug}.html`), renderResourcePage(resource, markdown, htmlUrl, slug).replace(/[\t ]+$/gm, ''));
      urls.push(htmlUrl);
      entries.push({ id: resource.id, jurisdiction, title: resource.title, group: resource.group, summary: resource.summary, htmlUrl, interactiveUrl: `${siteUrl}/?jurisdiction=${jurisdiction}&resource=${resource.id}`, markdownUrl: `${siteUrl}/${resource.path}`, sourceCheckedAt: resource.sourceCheckedAt || null, releaseStatus: pack.releaseStatus, ...(jurisdiction !== "england" ? { practiceReviewedAt: resource.practiceReviewedAt || null } : {}) });
      fullText.push(`# ${resource.title} — ${country}\n\nJurisdiction: ${country}\n${reviewNote}\nSource: ${htmlUrl}\n\n${markdown}`);
    }
    writeFileSync(join(dir, "index.html"), renderLearningIndex(pack.resources, pageMeta));
  }
  writeProjectFile("llms.txt", `# ${siteName}\n\nTwelve practice locations have separate final learning guides. Preserve the jurisdiction and source/review status when summarising. Country selection does not determine cross-border legal responsibility. This is a learning aid, not legal advice.\n\n${entries.map(x => `- [${x.title} (${x.jurisdiction})](${x.htmlUrl}): ${x.summary}`).join("\n")}\n`);
  writeProjectFile("llms-full.txt", `# ${siteName} — full text\n\nKeep country-specific material separate. Check current official sources for live work.\n\n${fullText.join("\n\n---\n\n")}\n`);
  writeProjectFile("answer-engine-index.json", JSON.stringify({ name: siteName, url: `${siteUrl}/`, jurisdictions: ["england", "wales", "scotland", "northern-ireland", "ireland", "new-zealand", "australia-nsw", "canada-ontario", "united-states-california", "australia-victoria", "canada-british-columbia", "united-states-new-york"], notLegalAdvice: true, resources: entries }, null, 2) + "\n");
  writeProjectFile("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(loc => `  <url><loc>${loc}</loc><lastmod>${dateModified}</lastmod></url>`).join("\n")}\n</urlset>\n`);
  writeProjectFile("robots.txt", `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`);
  console.log(`Built ${entries.length} reading pages, ${packs.length} location indexes, sitemap and jurisdiction-aware text exports.`);
}

main();
