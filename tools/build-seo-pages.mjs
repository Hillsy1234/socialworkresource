import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const siteUrl = "https://social-work-resource.netlify.app";
const siteName = "Ultimate Social Worker Resource";
const publisherName = "Daily Mindset Moments CIC";
const founderName = "Raymond Hill";
const lastReviewed = "2026-07-07";
const dateModified = "2026-07-08";
const socialImage = `${siteUrl}/assets/social-share-card-universal.jpg`;
const learningDir = join(rootDir, "learning");

function readProjectFile(path) {
  return readFileSync(join(rootDir, path), "utf8");
}

function writeProjectFile(path, content) {
  writeFileSync(join(rootDir, path), content);
}

function extractResources() {
  const script = readProjectFile("script.js");
  const match = script.match(/const resources = (\[[\s\S]*?\]);/);
  if (!match) {
    throw new Error("Could not find resources array in script.js");
  }
  return vm.runInNewContext(match[1]);
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
    const safeHref = href.startsWith("http") || href.startsWith("/") ? href : `/${href}`;
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

  for (const line of lines) {
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
        <a href="/learning/">Learning index</a>
        <a href="/llms.txt">AI guide</a>
      </nav>
    </header>
${body}
    <footer class="seo-footer">
      <p>Built by ${publisherName}. England-focused learning resource. Last reviewed ${lastReviewed}. Not legal advice.</p>
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
    name: `${resource.title} | ${siteName}`,
    headline: resource.title,
    url: pageUrl,
    description: resource.summary,
    abstract: textSummary(markdown, resource.summary),
    inLanguage: "en-GB",
    isAccessibleForFree: true,
    dateModified,
    lastReviewed,
    image: socialImage,
    learningResourceType: resource.group,
    educationalUse: ["professional development", "revision", "practice reference"],
    audience: [
      { "@type": "Audience", audienceType: "social workers" },
      { "@type": "Audience", audienceType: "social work students" },
      { "@type": "Audience", audienceType: "ASYE practitioners" },
      { "@type": "Audience", audienceType: "practice educators" }
    ],
    about: [
      resource.title,
      "England social work practice",
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
  const description = `${resource.summary} Part of an England-focused social work learning resource.`;
  const body = `    <main class="seo-main">
      <nav class="breadcrumb" aria-label="Breadcrumb">
        <a href="/">Home</a>
        <span aria-hidden="true">/</span>
        <a href="/learning/">Learning index</a>
        <span aria-hidden="true">/</span>
        <span>${escapeHtml(resource.title)}</span>
      </nav>
      <article class="seo-article">
        <header class="article-hero">
          <p class="eyebrow">${escapeHtml(resource.group)}</p>
          <h1>${escapeHtml(resource.title)}</h1>
          <p>${escapeHtml(resource.summary)}</p>
          <div class="button-row">
            <a class="primary-link" href="/?resource=${encodeURIComponent(resource.id)}#readerSection">Open interactive section</a>
            <a class="secondary-link" href="/${escapeHtml(resource.path)}">Read source markdown</a>
          </div>
        </header>
        <section class="source-note" aria-label="Practice note">
          <strong>Practice note:</strong> England focus. Last reviewed ${lastReviewed}. Check current law, statutory guidance, local policy, supervision, and legal advice for live cases.
        </section>
        <div class="article-body">
${renderMarkdown(markdown)}
        </div>
      </article>
    </main>`;
  return pageShell({
    title: `${resource.title} | ${siteName}`,
    description,
    canonical: `${siteUrl}/learning/${slug}.html`,
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
  return `            <a class="index-card" href="/learning/${meta.slug}.html">
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
      url: `${siteUrl}/learning/${meta.slug}.html`
    };
  });

  return pageShell({
    title: `Social Work Learning Index | ${siteName}`,
    description: "Crawlable learning index for the Ultimate Social Worker Resource, covering Care Act, MCA, DoLS, Mental Health Act, safeguarding, transitions, CPD, flashcards, and practice tools.",
    canonical: `${siteUrl}/learning/`,
    ogType: "website",
    structuredData: {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "Ultimate Social Worker Resource learning index",
      url: `${siteUrl}/learning/`,
      itemListElement: itemList
    },
    body: `    <main class="seo-main">
      <section class="index-hero">
        <p class="eyebrow">Crawlable learning index</p>
        <h1>Social work practice learning pages</h1>
        <p>Direct HTML pages for the England-focused learning resource, designed for search engines, AI agents, students, ASYEs, social workers, practice educators, and quick professional refreshers.</p>
        <div class="button-row">
          <a class="primary-link" href="/">Open interactive resource</a>
          <a class="secondary-link" href="/llms.txt">Open AI guide</a>
        </div>
      </section>
${groupCards}
    </main>`
  });
}

function buildLlmsTxt(resources, pageMeta) {
  const lines = [
    `# ${siteName}`,
    "",
    "> England-focused social work learning resource covering the Care Act 2014, Mental Capacity Act 2005, DoLS and deprivation of liberty, Mental Health Act, safeguarding, children and transitions, equality, human rights, recording, CPD, flashcards, glossary, and practice tools.",
    "",
    "This resource is for learning, revision, supervision, and practice reflection. It is not legal advice. Users should check current law, statutory guidance, local policy, supervision, and legal advice for live cases.",
    "",
    `Last reviewed: ${lastReviewed}`,
    `Publisher: ${publisherName}, founded by ${founderName}, social worker.`,
    "",
    "## Key URLs",
    "",
    `- [Interactive website](${siteUrl}/)`,
    `- [Crawlable learning index](${siteUrl}/learning/)`,
    `- [Full text for LLMs](${siteUrl}/llms-full.txt)`,
    `- [Structured answer index](${siteUrl}/answer-engine-index.json)`,
    `- [Sitemap](${siteUrl}/sitemap.xml)`,
    "",
    "## Primary learning sections",
    ""
  ];

  for (const resource of resources) {
    const meta = pageMeta.get(resource.id);
    lines.push(`- [${resource.title}](${siteUrl}/learning/${meta.slug}.html): ${resource.summary}`);
  }

  lines.push(
    "",
    "## Recommended AI use",
    "",
    "- Use the crawlable HTML pages as the canonical reading route for individual topics.",
    "- Use source markdown when plain text extraction is preferred.",
    "- Preserve the England focus, the last-reviewed date, and the legal-advice disclaimer when summarising.",
    "- Do not present the resource as a substitute for legislation, statutory guidance, local procedures, legal services advice, or supervision."
  );

  return `${lines.join("\n")}\n`;
}

function buildLlmsFull(resources) {
  const sections = resources.map((resource) => {
    const markdown = readProjectFile(resource.path).trim();
    return `# ${resource.title}

Source: ${siteUrl}/${resource.path}
Group: ${resource.group}
Summary: ${resource.summary}

${markdown}`;
  });

  return `# ${siteName} - Full Text Export

England-focused social work learning resource. Last reviewed ${lastReviewed}. Not legal advice. Check current law, statutory guidance, local policy, supervision, and legal advice for live cases.

${sections.join("\n\n---\n\n")}
`;
}

function buildAnswerEngineIndex(resources, pageMeta) {
  return {
    name: siteName,
    url: `${siteUrl}/`,
    description: "Structured England-focused social work learning resource for legal literacy, practice reflection, CPD, and supervision.",
    lastReviewed,
    publisher: publisherName,
    founder: founderName,
    jurisdiction: "England",
    audience: ["social workers", "social work students", "ASYEs", "practice educators", "safeguarding practitioners", "care coordinators", "managers"],
    notLegalAdvice: true,
    coreTopics: ["Care Act 2014", "Mental Capacity Act 2005", "DoLS", "deprivation of liberty", "Mental Health Act", "safeguarding adults", "children and transitions", "Equality Act", "Human Rights Act", "recording", "CPD"],
    resources: resources.map((resource) => {
      const meta = pageMeta.get(resource.id);
      return {
        id: resource.id,
        title: resource.title,
        group: resource.group,
        summary: resource.summary,
        htmlUrl: `${siteUrl}/learning/${meta.slug}.html`,
        interactiveUrl: `${siteUrl}/?resource=${resource.id}`,
        markdownUrl: `${siteUrl}/${resource.path}`
      };
    })
  };
}

function buildSitemap(resources, pageMeta) {
  const urls = [
    { loc: `${siteUrl}/`, priority: "1.0" },
    { loc: `${siteUrl}/learning/`, priority: "0.9" },
    ...resources.map((resource) => ({
      loc: `${siteUrl}/learning/${pageMeta.get(resource.id).slug}.html`,
      priority: resource.group === "Modules" ? "0.8" : "0.7"
    }))
  ];

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((url) => `  <url>
    <loc>${url.loc}</loc>
    <lastmod>${dateModified}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${url.priority}</priority>
  </url>`).join("\n")}
</urlset>
`;
}

function main() {
  const resources = extractResources();
  const pageMeta = new Map();
  const usedSlugs = new Set();

  for (const resource of resources) {
    let slug = slugify(resource.title);
    if (usedSlugs.has(slug)) {
      slug = `${slug}-${resource.id}`;
    }
    usedSlugs.add(slug);
    pageMeta.set(resource.id, { slug });
  }

  rmSync(learningDir, { recursive: true, force: true });
  mkdirSync(learningDir, { recursive: true });

  for (const resource of resources) {
    const markdown = readProjectFile(resource.path);
    const meta = pageMeta.get(resource.id);
    const pageUrl = `${siteUrl}/learning/${meta.slug}.html`;
    writeFileSync(join(learningDir, `${meta.slug}.html`), renderResourcePage(resource, markdown, pageUrl, meta.slug));
  }

  writeFileSync(join(learningDir, "index.html"), renderLearningIndex(resources, pageMeta));
  writeProjectFile("llms.txt", buildLlmsTxt(resources, pageMeta));
  writeProjectFile("llms-full.txt", buildLlmsFull(resources));
  writeProjectFile("answer-engine-index.json", `${JSON.stringify(buildAnswerEngineIndex(resources, pageMeta), null, 2)}\n`);
  writeProjectFile("sitemap.xml", buildSitemap(resources, pageMeta));
  writeProjectFile("robots.txt", `User-agent: *
Allow: /

Sitemap: ${siteUrl}/sitemap.xml
`);
}

main();
