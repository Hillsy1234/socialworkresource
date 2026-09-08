// Country content and tool data are loaded from the same manifests used by static pages.
const resources = [];
const contentVersion = "37";
let featuredIds = [], routeQuestions = [], routeDetails = {}, flashcardDecks = [], glossaryTerms = [];
let theoryLenses = [], hypothesisSignals = [], childPracticeModels = [], childModelSignals = [];
let scenarioWorkouts = [], printableTemplates = [], studentPathwaySteps = [];

const cpdTypes = [
  "Supervision",
  "Training course",
  "Reading or research",
  "Learning from a case",
  "Peer discussion",
  "Policy or guidance update",
  "Webinar, podcast, or lecture",
  "Reflective practice",
  "Other"
];

const cpdStandards = [
  {
    id: "4.1",
    short: "Feedback",
    text: "Incorporate feedback from a range of sources, including people with lived experience."
  },
  {
    id: "4.2",
    short: "Supervision",
    text: "Use supervision and feedback to critically reflect and identify learning needs."
  },
  {
    id: "4.3",
    short: "Research and frameworks",
    text: "Keep practice up to date and record how research, theories, and frameworks inform judgement."
  },
  {
    id: "4.4",
    short: "Subject knowledge",
    text: "Demonstrate good subject knowledge and awareness of current issues and social policy."
  },
  {
    id: "4.5",
    short: "Learning culture",
    text: "Contribute to an open and creative learning culture to discuss, reflect, and share best practice."
  },
  {
    id: "4.6",
    short: "Impact",
    text: "Reflect on learning activities and evidence the impact of CPD on practice quality."
  },
  {
    id: "4.7",
    short: "Recording",
    text: "Record learning and reflection regularly and in line with Social Work England CPD guidance."
  },
  {
    id: "4.8",
    short: "Values and ethics",
    text: "Reflect on values and challenge the impact they have on practice."
  }
];

function getInitialResourceId() {
  const params = new URLSearchParams(window.location.search);
  const requested = params.get("resource") || params.get("section") || window.location.hash.replace("#", "");
  return resources.some((resource) => resource.id === requested) ? requested : "readme";
}

function updateResourceUrl(id, targetSection = "") {
  if (!window.history?.replaceState) {
    return;
  }
  const url = new URL(window.location.href);
  url.searchParams.set("jurisdiction", activeJurisdiction);
  url.searchParams.set("resource", id);
  url.hash = targetSection || "readerSection";
  window.history.replaceState(null, "", url);
  activePackUrl = url.href;
}

function readStoredJson(key, fallback) {
  try {
    const stored = window.localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch {
    return fallback;
  }
}

function writeStoredJson(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    // Keep unsaved forms intact if browser storage is unavailable.
    return false;
  }
}

const state = {
  activeId: getInitialResourceId(),
  query: "",
  documents: new Map(),
  read: new Set(),
  confidence: {}
};

const navList = document.querySelector("#navList");
const moduleCards = document.querySelector("#moduleCards");
const contentView = document.querySelector("#contentView");
const searchInput = document.querySelector("#searchInput");
const searchResults = document.querySelector("#searchResults");
const sidebarSearchResults = document.querySelector("#sidebarSearchResults");
const progressText = document.querySelector("#progressText");
const progressBar = document.querySelector("#progressBar");
const markReadButton = document.querySelector("#markReadButton");
const readerMarkReadButton = document.querySelector("#readerMarkReadButton");
const activeGroup = document.querySelector("#activeGroup");
const activeTitle = document.querySelector("#activeTitle");
const activeSummary = document.querySelector("#activeSummary");
const sourceStatus = document.querySelector("#sourceStatus");
const confidenceSelect = document.querySelector("#confidenceSelect");
const readerSaveStatus = document.querySelector("#readerSaveStatus");
const sectionToc = document.querySelector("#sectionToc");
const siteHeader = document.querySelector(".site-header");
const mobileNavToggle = document.querySelector("#mobileNavToggle");

function setMobileNavigation(open) {
  if (!siteHeader || !mobileNavToggle) {
    return;
  }
  siteHeader.classList.toggle("nav-open", open);
  mobileNavToggle.setAttribute("aria-expanded", String(open));
  mobileNavToggle.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function inlineMarkdown(value) {
  let text = escapeHtml(value);
  const protectedLinks = [];
  text = text.replace(/`([^`]+)`/g, "<code>$1</code>");
  text = text.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, href) => {
    const token = `@@LINK_${protectedLinks.length}@@`;
    protectedLinks.push(`<a href="${href}" target="_blank" rel="noreferrer">${label}</a>`);
    return token;
  });
  text = text.replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noreferrer">$1</a>');
  text = text.replace(/@@LINK_(\d+)@@/g, (_, index) => protectedLinks[Number(index)] || "");
  return text;
}

function highlightText(value, query) {
  const safeValue = escapeHtml(value);
  const words = query
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 1)
    .map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));

  if (!words.length) {
    return safeValue;
  }

  return safeValue.replace(new RegExp(`(${words.join("|")})`, "gi"), "<mark>$1</mark>");
}

function slugify(value, fallback) {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || fallback;
}

function isTableDivider(line) {
  return /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line);
}

function splitTableRow(line) {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => inlineMarkdown(cell.trim()));
}

function renderMarkdown(markdown) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const html = [];
  let listType = null;
  let inCode = false;
  let codeLines = [];
  const headingCounts = new Map();

  function closeList() {
    if (listType) {
      html.push(`</${listType}>`);
      listType = null;
    }
  }

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];

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

    if (line.includes("|") && lines[i + 1] && isTableDivider(lines[i + 1])) {
      closeList();
      const headers = splitTableRow(line);
      i += 2;
      const rows = [];
      while (i < lines.length && lines[i].includes("|") && lines[i].trim()) {
        rows.push(splitTableRow(lines[i]));
        i += 1;
      }
      i -= 1;
      html.push("<table><thead><tr>");
      headers.forEach((header) => html.push(`<th>${header}</th>`));
      html.push("</tr></thead><tbody>");
      rows.forEach((row) => {
        html.push("<tr>");
        row.forEach((cell) => html.push(`<td>${cell}</td>`));
        html.push("</tr>");
      });
      html.push("</tbody></table>");
      continue;
    }

    const heading = line.match(/^(#{1,4})\s+(.*)$/);
    if (heading) {
      closeList();
      const level = heading[1].length;
      const rawTitle = heading[2];
      const baseSlug = slugify(rawTitle, `section-${i}`);
      const count = headingCounts.get(baseSlug) || 0;
      headingCounts.set(baseSlug, count + 1);
      const id = count ? `${baseSlug}-${count + 1}` : baseSlug;
      html.push(`<h${level} id="${id}">${inlineMarkdown(rawTitle)}</h${level}>`);
      continue;
    }

    const unordered = line.match(/^\s*-\s+(.*)$/);
    if (unordered) {
      if (listType !== "ul") {
        closeList();
        listType = "ul";
        html.push("<ul>");
      }
      html.push(`<li>${inlineMarkdown(unordered[1])}</li>`);
      continue;
    }

    const ordered = line.match(/^\s*\d+\.\s+(.*)$/);
    if (ordered) {
      if (listType !== "ol") {
        closeList();
        listType = "ol";
        html.push("<ol>");
      }
      html.push(`<li>${inlineMarkdown(ordered[1])}</li>`);
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

function renderModuleCards() {
  const cards = featuredIds
    .map((id) => resources.find((resource) => resource.id === id))
    .filter(Boolean);

  moduleCards.innerHTML = cards.map((resource) => `
    <button class="module-card${resource.id === state.activeId ? " active" : ""}" data-open="${resource.id}" style="--accent: ${resource.accent}">
      <span class="module-card-top">
        <span class="module-card-code">${resource.code}</span>
        <span class="module-card-kind">${resource.group}</span>
      </span>
      <span>
        <h3>${resource.title}</h3>
        <p>${resource.summary}</p>
      </span>
    </button>
  `).join("");
}

async function loadDocuments(packResources = resources) {
  const documents = new Map();
  await Promise.all(packResources.map(async (resource) => {
    let markdown = resource.markdown;
    if (markdown === undefined) {
      const response = await fetch(`${resource.path}?v=${contentVersion}`);
      if (!response.ok) throw new Error(`Could not load ${resource.path}`);
      markdown = await response.text();
    }
    documents.set(resource.id, {
      ...resource,
      markdown,
      html: renderMarkdown(markdown),
      plain: markdown.replace(/[#*`>|-]/g, " ").replace(/\s+/g, " ").trim()
    });
  }));
  return documents;
}

function renderNav() {
  const grouped = resources.reduce((acc, resource) => {
    if (!acc.has(resource.group)) {
      acc.set(resource.group, []);
    }
    acc.get(resource.group).push(resource);
    return acc;
  }, new Map());

  navList.innerHTML = "";
  grouped.forEach((items, group) => {
    const groupLabel = document.createElement("div");
    groupLabel.className = "nav-group";
    groupLabel.textContent = group;
    navList.appendChild(groupLabel);

    items.forEach((resource) => {
      const button = document.createElement("button");
      button.className = `nav-button${resource.id === state.activeId ? " active" : ""}`;
      button.dataset.open = resource.id;
      button.innerHTML = `
        <span class="nav-title">${resource.title}</span>
        <span class="nav-status" aria-label="${state.read.has(resource.id) ? "Read" : "Unread"}">${state.read.has(resource.id) ? "Done" : ""}</span>
      `;
      navList.appendChild(button);
    });
  });
}

function renderActiveResource(documentData) {
  activeGroup.textContent = documentData.group;
  activeTitle.textContent = documentData.title;
  activeSummary.textContent = documentData.summary;
  renderSourceStatus(documentData);
  if (confidenceSelect) {
    confidenceSelect.value = state.confidence[documentData.id] || "not-started";
  }
  showReaderSaveStatus(
    state.read.has(documentData.id) ? "This section is marked read." : "Progress saves in this browser.",
    state.read.has(documentData.id)
  );
}

function sourceStatusFor(documentData) {
  const names = { wales: "Wales", scotland: "Scotland", "northern-ireland": "Northern Ireland", ireland: "Ireland", "new-zealand": "Aotearoa New Zealand", "australia-nsw": "New South Wales", "australia-victoria": "Victoria", "canada-ontario": "Ontario", "canada-british-columbia": "British Columbia", "united-states-california": "California", "united-states-new-york": "New York" };
  if (activeJurisdiction !== "england" && names[activeJurisdiction]) return { label: `${names[activeJurisdiction]} practice guide`, text: "Final learning guide · See the Source Library for references and review information. Check the applicable official guidance for live work." };
  if (documentData.group === "Website") {
    return {
      label: "Website info",
      text: "Last reviewed 24 July 2026. For live enquiries, use the contact route and privacy/terms pages."
    };
  }

  if (documentData.id === "sources") {
    return {
      label: "Source library",
      text: "Use official sources, statutory guidance, local policy, supervision, and legal advice for live cases."
    };
  }

  return {
    label: "Practice source check",
    text: "England focus. Last reviewed 24 July 2026. Check current law, statutory guidance, local policy, supervision, and legal advice for live cases."
  };
}

function renderSourceStatus(documentData) {
  if (!sourceStatus) {
    return;
  }
  const status = sourceStatusFor(documentData);
  sourceStatus.innerHTML = `
    <span>${status.label}</span>
    <span>${status.text}</span>
  `;
}

function contactFormMarkup() {
  return `
    <section class="contact-form-panel" aria-labelledby="contactFormTitle">
      <div>
        <span class="panel-kicker">Contact Form</span>
        <h2 id="contactFormTitle">Send an enquiry</h2>
        <p>Share the reason for your message, and Daily Mindset Moments CIC will be able to respond from the same enquiry flow used on the main website.</p>
      </div>
      <form class="contact-form" name="social-worker-resource-contact" action="/contact-success.html" method="POST" data-netlify="true" netlify-honeypot="bot-field">
        <input type="hidden" name="form-name" value="social-worker-resource-contact">
        <input type="text" name="bot-field" tabindex="-1" autocomplete="off" class="form-honeypot">
        <input type="hidden" name="subject" value="Social Worker Resource enquiry">
        <div class="form-grid">
          <label class="form-field">
            <span>Name</span>
            <input type="text" name="name" autocomplete="name" required>
          </label>
          <label class="form-field">
            <span>Email</span>
            <input type="email" name="email" autocomplete="email" required>
          </label>
          <label class="form-field">
            <span>Organisation</span>
            <input type="text" name="organisation" autocomplete="organization">
          </label>
          <label class="form-field">
            <span>Enquiry type</span>
            <select name="project_type" required>
              <option value="">Select one</option>
              <option>Social work learning resource</option>
              <option>AI product build</option>
              <option>Workflow automation</option>
              <option>Marketing and content system</option>
              <option>Community or social impact platform</option>
              <option>Partnership conversation</option>
            </select>
          </label>
          <label class="form-field full-span">
            <span>Message</span>
            <textarea name="message" rows="6" required></textarea>
          </label>
        </div>
        <label class="form-consent">
          <input type="checkbox" name="contact_consent" value="yes" required>
          <span>I agree to be contacted about this enquiry.</span>
        </label>
        <p class="form-privacy-note">By sending this form, you confirm that you have read the <button type="button" class="inline-text-button" data-open="privacy-policy">Privacy Policy</button>. Do not include confidential case information.</p>
        <button class="form-submit" type="submit">Send enquiry</button>
      </form>
    </section>
  `;
}

function routeFinderMarkup() {
  return `
    <section class="tool-panel route-finder-panel" aria-labelledby="routeFinderTitle">
      <div class="tool-panel-head">
        <span class="panel-kicker">Decision Support</span>
        <h2 id="routeFinderTitle">Case Route Finder</h2>
        <p>Select the facts that appear relevant. The tool will suggest practice routes, recording points, and sections to open next. It is a learning aid, not legal advice.</p>
      </div>
      <div class="route-question-grid">
        ${routeQuestions.map((question) => `
          <label class="route-question">
            <input type="checkbox" data-route-answer="${question.id}">
            <span>
              <strong>${escapeHtml(question.label)}</strong>
              <small>${escapeHtml(question.detail)}</small>
            </span>
          </label>
        `).join("")}
      </div>
      <div class="tool-actions">
        <button class="secondary-tool-button" type="button" data-route-reset>Clear route check</button>
      </div>
      <div id="routeFinderResults" class="route-results" aria-live="polite"></div>
    </section>
  `;
}

function renderRouteFinderResults() {
  const resultsElement = document.querySelector("#routeFinderResults");
  if (!resultsElement) {
    return;
  }

  const selected = [...document.querySelectorAll("[data-route-answer]:checked")]
    .map((input) => routeQuestions.find((question) => question.id === input.dataset.routeAnswer))
    .filter(Boolean);

  if (!selected.length) {
    resultsElement.innerHTML = `
      <div class="empty-state">
        <strong>No route selected yet.</strong>
        <p>Choose one or more case features above to build a practice route. Complex cases often involve more than one framework.</p>
      </div>
    `;
    return;
  }

  const scores = new Map();
  selected.forEach((question) => {
    question.routes.forEach((routeId, index) => {
      scores.set(routeId, (scores.get(routeId) || 0) + (3 - Math.min(index, 2)));
    });
  });

  const recommendations = [...scores.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([routeId, score]) => ({ id: routeId, score, ...routeDetails[routeId] }))
    .filter((route) => route.title);

  resultsElement.innerHTML = `
    <div class="route-summary">
      <span class="panel-kicker">Suggested Route</span>
      <h3>${recommendations.length} linked framework${recommendations.length === 1 ? "" : "s"}</h3>
      <p>Use this as a prompt for analysis, supervision, and recording. Always check local procedure and legal advice for live cases.</p>
    </div>
    <div class="route-card-grid">
      ${recommendations.map((route, index) => {
        const resource = resources.find((item) => item.id === route.id);
        return `
          <article class="route-card" style="--accent: ${resource?.accent || "#287c8f"}">
            <span class="route-rank">${index + 1}</span>
            <h3>${escapeHtml(route.title)}</h3>
            <p><strong>Check:</strong> ${escapeHtml(route.action)}</p>
            <p><strong>Record:</strong> ${escapeHtml(route.record)}</p>
            ${resource ? `<button class="inline-open" type="button" data-open="${resource.id}">Open ${escapeHtml(resource.title)}</button>` : ""}
          </article>
        `;
      }).join("")}
    </div>
  `;
}

function theoryPracticeMarkup() {
  return `
    <section class="tool-panel theory-panel" aria-labelledby="theoryPracticeTitle">
      <div class="tool-panel-head">
        <span class="panel-kicker">Theory Into Practice</span>
        <h2 id="theoryPracticeTitle">Build a cautious practice hypothesis</h2>
        <p>Select case features to see theory lenses that may help your assessment. The result is a prompt for curiosity, supervision, and evidence gathering, not a conclusion about the person.</p>
      </div>
      <div class="theory-caution">
        <strong>Use theory as a question, not a label.</strong>
        <span>Every hypothesis should be tested with the person's account, evidence, alternative explanations, culture, rights, capacity and consent, risk, supervision, and current legal duties.</span>
      </div>
      <div class="theory-lens-grid" aria-label="Social work theory lenses">
        ${theoryLenses.map((lens) => `
          <article class="theory-card" style="--accent: ${lens.accent}">
            <div class="theory-card-top">
              <span>${escapeHtml(lens.code)}</span>
              <span>Theory lens</span>
            </div>
            <h3>${escapeHtml(lens.title)}</h3>
            <p><strong>Helps notice:</strong> ${escapeHtml(lens.focus)}</p>
            <p><strong>Practice hypothesis:</strong> ${escapeHtml(lens.hypothesis)}</p>
            <details>
              <summary>Evidence to test</summary>
              <ul>
                ${lens.test.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
              </ul>
            </details>
          </article>
        `).join("")}
      </div>
      <section class="hypothesis-builder" aria-labelledby="hypothesisBuilderTitle">
        <div class="tool-panel-head compact">
          <span class="panel-kicker">Hypothesis Builder</span>
          <h2 id="hypothesisBuilderTitle">What might be happening?</h2>
          <p>Choose the features that fit the case. Use the results to structure questions, supervision, and recording.</p>
        </div>
        <div class="hypothesis-question-grid">
          ${hypothesisSignals.map((signal) => `
            <label class="route-question hypothesis-question">
              <input type="checkbox" data-hypothesis-answer="${signal.id}">
              <span>
                <strong>${escapeHtml(signal.label)}</strong>
                <small>${escapeHtml(signal.detail)}</small>
              </span>
            </label>
          `).join("")}
        </div>
        <div class="tool-actions">
          <button class="secondary-tool-button" type="button" data-hypothesis-reset>Clear hypothesis check</button>
        </div>
        <div id="hypothesisResults" class="hypothesis-results" aria-live="polite"></div>
      </section>
    </section>
  `;
}

function renderHypothesisResults() {
  const resultsElement = document.querySelector("#hypothesisResults");
  if (!resultsElement) {
    return;
  }

  const selected = [...document.querySelectorAll("[data-hypothesis-answer]:checked")]
    .map((input) => hypothesisSignals.find((signal) => signal.id === input.dataset.hypothesisAnswer))
    .filter(Boolean);

  if (!selected.length) {
    resultsElement.innerHTML = `
      <div class="empty-state">
        <strong>No case features selected yet.</strong>
        <p>Select one or more prompts above. The builder will suggest theory lenses and questions to test, while keeping the person's own account at the centre.</p>
      </div>
    `;
    return;
  }

  const scores = new Map();
  selected.forEach((signal) => {
    signal.theories.forEach((theoryId, index) => {
      scores.set(theoryId, (scores.get(theoryId) || 0) + (4 - Math.min(index, 3)));
    });
  });

  const recommendations = [...scores.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([theoryId, score]) => ({ ...theoryLenses.find((lens) => lens.id === theoryId), score }))
    .filter((lens) => lens.id)
    .slice(0, 5);

  resultsElement.innerHTML = `
    <div class="route-summary hypothesis-summary">
      <span class="panel-kicker">Suggested Lens</span>
      <h3>${recommendations.length} theory lens${recommendations.length === 1 ? "" : "es"} to test</h3>
      <p>Record hypotheses as tentative. Include what supports the idea, what challenges it, what the person says, and what would change your view.</p>
    </div>
    <div class="hypothesis-card-grid">
      ${recommendations.map((lens, index) => `
        <article class="hypothesis-card" style="--accent: ${lens.accent}">
          <span class="route-rank">${String(index + 1).padStart(2, "0")}</span>
          <h3>${escapeHtml(lens.title)}</h3>
          <p><strong>Possible hypothesis:</strong> ${escapeHtml(lens.hypothesis)}</p>
          <div>
            <strong>Questions to test:</strong>
            <ul>
              ${lens.test.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
            </ul>
          </div>
          <div class="scenario-routes">
            ${lens.links.map((linkId) => {
              const resource = resources.find((resourceItem) => resourceItem.id === linkId);
              return resource ? `<button type="button" data-open="${resource.id}">${escapeHtml(resource.title)}</button>` : "";
            }).join("")}
          </div>
        </article>
      `).join("")}
    </div>
  `;
}

function childrenModelsMarkup() {
  return `
    <section class="tool-panel children-model-panel" aria-labelledby="childrenModelsTitle">
      <div class="tool-panel-head">
        <span class="panel-kicker">Children and Family Models</span>
        <h2 id="childrenModelsTitle">Choose the right practice lens for child and family work</h2>
        <p>Use these cards to connect child and family circumstances with recognised practice models, tools, and approaches. Always follow local procedures, training, supervision, and statutory guidance.</p>
      </div>
      <div class="theory-caution model-caution">
        <strong>Models are aids to analysis, not shortcuts.</strong>
        <span>Check the child's lived experience, family account, risk, protective factors, culture, rights, consent, information-sharing, legal thresholds, and local implementation before relying on any model.</span>
      </div>
      <div class="children-model-grid" aria-label="Children and family practice models">
        ${childPracticeModels.map((model) => `
          <article class="children-model-card" style="--accent: ${model.accent}">
            <div class="theory-card-top">
              <span>${escapeHtml(model.code)}</span>
              <span>Practice model</span>
            </div>
            <h3>${escapeHtml(model.title)}</h3>
            <p><strong>Useful for:</strong> ${escapeHtml(model.use)}</p>
            <p><strong>Core prompt:</strong> ${escapeHtml(model.prompt)}</p>
            <details>
              <summary>Questions to test</summary>
              <ul>
                ${model.test.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
              </ul>
            </details>
          </article>
        `).join("")}
      </div>
      <section class="hypothesis-builder children-model-finder" aria-labelledby="childrenModelFinderTitle">
        <div class="tool-panel-head compact">
          <span class="panel-kicker">Model Finder</span>
          <h2 id="childrenModelFinderTitle">What model might help?</h2>
          <p>Select the features that fit the child or family situation. The finder will suggest approaches to consider in supervision, not decide the plan for you.</p>
        </div>
        <div class="model-question-grid">
          ${childModelSignals.map((signal) => `
            <label class="route-question model-question">
              <input type="checkbox" data-model-answer="${signal.id}">
              <span>
                <strong>${escapeHtml(signal.label)}</strong>
                <small>${escapeHtml(signal.detail)}</small>
              </span>
            </label>
          `).join("")}
        </div>
        <div class="tool-actions">
          <button class="secondary-tool-button" type="button" data-model-reset>Clear model check</button>
        </div>
        <div id="childrenModelResults" class="model-results" aria-live="polite"></div>
      </section>
    </section>
  `;
}

function renderChildrenModelResults() {
  const resultsElement = document.querySelector("#childrenModelResults");
  if (!resultsElement) {
    return;
  }

  const selected = [...document.querySelectorAll("[data-model-answer]:checked")]
    .map((input) => childModelSignals.find((signal) => signal.id === input.dataset.modelAnswer))
    .filter(Boolean);

  if (!selected.length) {
    resultsElement.innerHTML = `
      <div class="empty-state">
        <strong>No child or family features selected yet.</strong>
        <p>Select one or more prompts above. The finder will suggest models or tools to explore, while keeping the child's safety, voice, relationships, and rights central.</p>
      </div>
    `;
    return;
  }

  const scores = new Map();
  selected.forEach((signal) => {
    signal.models.forEach((modelId, index) => {
      scores.set(modelId, (scores.get(modelId) || 0) + (5 - Math.min(index, 4)));
    });
  });

  const recommendations = [...scores.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([modelId, score]) => ({ ...childPracticeModels.find((model) => model.id === modelId), score }))
    .filter((model) => model.id)
    .slice(0, 6);

  resultsElement.innerHTML = `
    <div class="route-summary hypothesis-summary">
      <span class="panel-kicker">Suggested Models</span>
      <h3>${recommendations.length} model${recommendations.length === 1 ? "" : "s"} or approach${recommendations.length === 1 ? "" : "es"} to consider</h3>
      <p>Use this as a supervision prompt. Record why a model fits, what evidence supports it, what might challenge it, and how local procedures shape its use.</p>
    </div>
    <div class="model-card-grid">
      ${recommendations.map((model, index) => `
        <article class="model-result-card" style="--accent: ${model.accent}">
          <span class="route-rank">${String(index + 1).padStart(2, "0")}</span>
          <h3>${escapeHtml(model.title)}</h3>
          <p><strong>Use when:</strong> ${escapeHtml(model.use)}</p>
          <p><strong>Core prompt:</strong> ${escapeHtml(model.prompt)}</p>
          <div>
            <strong>Questions to test:</strong>
            <ul>
              ${model.test.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
            </ul>
          </div>
          <div class="scenario-routes">
            ${model.links.map((linkId) => {
              const resource = resources.find((resourceItem) => resourceItem.id === linkId);
              return resource ? `<button type="button" data-open="${resource.id}">${escapeHtml(resource.title)}</button>` : "";
            }).join("")}
          </div>
        </article>
      `).join("")}
    </div>
  `;
}

function glossaryMarkup() {
  const letters = ["All", ...new Set(glossaryTerms.map((item) => item.term[0].toUpperCase()))].sort((a, b) => a === "All" ? -1 : b === "All" ? 1 : a.localeCompare(b));
  return `
    <section class="tool-panel glossary-panel" aria-labelledby="glossaryTitle">
      <div class="tool-panel-head">
        <span class="panel-kicker">Practice Language</span>
        <h2 id="glossaryTitle">Search the glossary</h2>
        <p>Use plain-English definitions for revision, supervision, and confident recording. For live cases, check the full source section and local policy.</p>
      </div>
      <label class="tool-search">
        <span>Find a term</span>
        <input id="glossarySearch" type="search" placeholder="${activeJurisdiction === "wales" ? "ALN, advocacy, capacity..." : "Capacity, Section 42, advocacy..."}" autocomplete="off">
      </label>
      <div class="glossary-letters" aria-label="Glossary letters">
        ${letters.map((letter) => `
          <button type="button" class="${letter === "All" ? "active" : ""}" data-glossary-letter="${letter}">${letter}</button>
        `).join("")}
      </div>
      <div id="glossaryResults" class="glossary-grid" aria-live="polite"></div>
    </section>
  `;
}

function renderGlossary(query = "", letter = "All") {
  const resultsElement = document.querySelector("#glossaryResults");
  if (!resultsElement) {
    return;
  }

  document.querySelectorAll("[data-glossary-letter]").forEach((button) => {
    button.classList.toggle("active", button.dataset.glossaryLetter === letter);
  });

  const normalisedQuery = query.trim().toLowerCase();
  const terms = glossaryTerms
    .filter((item) => letter === "All" || item.term.toUpperCase().startsWith(letter))
    .filter((item) => !normalisedQuery || `${item.term} ${item.definition}`.toLowerCase().includes(normalisedQuery))
    .sort((a, b) => a.term.localeCompare(b.term));

  resultsElement.innerHTML = terms.length ? terms.map((item) => {
    const resource = resources.find((resourceItem) => resourceItem.id === item.link);
    const sectionAttribute = item.section ? ` data-section="${escapeHtml(item.section)}"` : "";
    return `
      <article class="glossary-card">
        <h3>${escapeHtml(item.term)}</h3>
        <p>${escapeHtml(item.definition)}</p>
        ${resource ? `<button class="inline-open" type="button" data-open="${resource.id}"${sectionAttribute} aria-label="Open ${escapeHtml(item.term)} in ${escapeHtml(resource.title)}">Open related section</button>` : ""}
      </article>
    `;
  }).join("") : `
    <div class="empty-state">
      <strong>No glossary term found.</strong>
      <p>Try a wider term such as capacity, safeguarding, advocacy, rights, or assessment.</p>
    </div>
  `;
}

function scenarioHubMarkup() {
  return `
    <section class="tool-panel scenario-hub" aria-labelledby="scenarioHubTitle">
      <div class="tool-panel-head">
        <span class="panel-kicker">Scenario Workout</span>
        <h2 id="scenarioHubTitle">Interactive practice scenarios</h2>
        <p>Use these cards for supervision, professional learning, workshops, or private study. Think first, then reveal the practice points.</p>
      </div>
      <div class="scenario-grid">
        ${scenarioWorkouts.map((scenario, index) => `
          <article class="scenario-card">
            <div>
              <span class="scenario-number">${String(index + 1).padStart(2, "0")}</span>
              <h3>${escapeHtml(scenario.title)}</h3>
              <p>${escapeHtml(scenario.summary)}</p>
            </div>
            <ul>
              ${scenario.prompts.map((prompt) => `<li>${escapeHtml(prompt)}</li>`).join("")}
            </ul>
            <div class="scenario-routes">
              ${scenario.routes.map((routeId) => {
                const resource = resources.find((item) => item.id === routeId);
                return resource ? `<button type="button" data-open="${resource.id}">${escapeHtml(resource.title)}</button>` : "";
              }).join("")}
            </div>
            <button class="scenario-toggle" type="button" data-scenario-toggle="${index}" aria-expanded="false">Reveal learning points</button>
            <div class="scenario-reveal" hidden>
              <strong>Learning point</strong>
              <p>${escapeHtml(scenario.reveal)}</p>
            </div>
          </article>
        `).join("")}
      </div>
    </section>
  `;
}

function cpdLogMarkup() {
  const today = new Date().toISOString().slice(0, 10);
  const registrationYear = currentRegistrationYearLabel();
  return `
    <section class="tool-panel cpd-panel" aria-labelledby="cpdToolTitle">
      <div class="tool-panel-head">
        <span class="panel-kicker">Social Work England CPD Drafting Space</span>
        <h2 id="cpdToolTitle">CPD and reflection log</h2>
        <p>Draft Social Work England-style CPD records here, then copy your final entries into your Social Work England online account. Notes stay only in this browser on this device.</p>
      </div>
      <div class="cpd-storage-notice">
        <strong>Save a copy before relying on this log.</strong>
        <p>CPD drafts are stored in this browser on this device. They should remain after a normal refresh, but they can disappear if browser data is cleared, private browsing is used, workplace systems reset storage, or you change device or browser. Export the text file or use Print / Save as PDF for your own records.</p>
      </div>
      <div class="swe-cpd-summary" aria-label="Social Work England CPD requirements">
        <div>
          <strong>2 pieces</strong>
          <span>Minimum CPD records each registration year.</span>
        </div>
        <div>
          <strong>1 peer reflection</strong>
          <span>At least one CPD piece must include peer reflection.</span>
        </div>
        <div>
          <strong>30 November</strong>
          <span>Record CPD in your Social Work England online account by the annual deadline.</span>
        </div>
      </div>
      <div id="cpdRequirementStatus" class="cpd-requirement-status" aria-live="polite"></div>
      <form class="cpd-form">
        <div class="form-grid">
          <label class="form-field">
            <span>CPD activity title</span>
            <input type="text" name="title" placeholder="MCA assessment refresher, Section 42 supervision, case law reading..." required>
          </label>
          <label class="form-field">
            <span>Date of CPD activity</span>
            <input type="date" name="activityDate" value="${today}" required>
          </label>
          <label class="form-field">
            <span>Type of CPD</span>
            <select name="type" required>
              ${cpdTypes.map((type) => `<option>${escapeHtml(type)}</option>`).join("")}
            </select>
          </label>
          <label class="form-field">
            <span>Registration year</span>
            <input type="text" name="registrationYear" value="${escapeHtml(registrationYear)}" required>
          </label>
          <fieldset class="full-span standard-checkbox-grid">
            <legend>Which parts of CPD standard 4 does this activity meet?</legend>
            <p>Social Work England's online form normally selects 4.6 and 4.7 when you record CPD. Select any others that genuinely apply.</p>
            <div>
              ${cpdStandards.map((standard) => `
                <label class="checkbox-field">
                  <input type="checkbox" name="standards" value="${standard.id}" ${["4.6", "4.7"].includes(standard.id) ? "checked" : ""}>
                  <span><strong>${standard.id} ${escapeHtml(standard.short)}</strong>${escapeHtml(standard.text)}</span>
                </label>
              `).join("")}
            </div>
          </fieldset>
          <label class="form-field full-span">
            <span>Describe what you have learnt from doing this CPD activity</span>
            <textarea name="learning" rows="7" class="word-count-field" data-word-count-field="learning" aria-describedby="learningWordCount" placeholder="What did you learn? What changed in your knowledge, thinking, values, legal reasoning, or confidence?" required></textarea>
            <small class="word-guidance">Social Work England suggests around 250 to 500 words.</small>
            <small id="learningWordCount" class="word-count" data-word-count="learning">0 words</small>
          </label>
          <label class="form-field full-span">
            <span>Reflect on the positive impact this CPD has had or will have</span>
            <textarea name="impact" rows="7" class="word-count-field" data-word-count-field="impact" aria-describedby="impactWordCount" placeholder="How has this helped, or how will it help, your practice and the people you work with?" required></textarea>
            <small class="word-guidance">Think about people with lived experience, carers, families, colleagues, students, or the profession.</small>
            <small id="impactWordCount" class="word-count" data-word-count="impact">0 words</small>
          </label>
          <fieldset class="full-span peer-reflection-panel">
            <legend>Peer reflection</legend>
            <label class="checkbox-field peer-toggle">
              <input type="checkbox" name="peerReflectionIncluded" value="yes">
              <span><strong>This entry includes peer reflection</strong>Use this when you have discussed the CPD activity with a peer, manager, or another professional.</span>
            </label>
            <div class="form-grid">
              <label class="form-field">
                <span>Peer role or relationship</span>
                <input type="text" name="peerRole" placeholder="Team manager, colleague, AMHP, practice educator...">
              </label>
              <label class="form-field">
                <span>Date discussed</span>
                <input type="date" name="peerDate">
              </label>
              <label class="form-field full-span">
                <span>What did you learn from discussing this CPD with a peer?</span>
                <textarea name="peerLearning" rows="5" placeholder="Keep this anonymised. Do not record the peer's name or identifiable case details."></textarea>
              </label>
            </div>
          </fieldset>
          <label class="form-field full-span">
            <span>Next action or evidence note</span>
            <textarea name="action" rows="3" placeholder="What will you check, read, practise, discuss in supervision, or change in recording?"></textarea>
          </label>
        </div>
        <p class="cpd-submit-note">This is a private draft log. It does not submit anything to Social Work England, and it should not contain identifiable case information.</p>
        <div class="tool-actions">
          <button class="form-submit" type="submit">Save CPD draft</button>
          <button class="secondary-tool-button" type="button" data-export-cpd>Export CPD drafts</button>
          <button class="secondary-tool-button" type="button" data-print-cpd>Print / Save as PDF</button>
        </div>
      </form>
      <div id="confidenceOverview" class="confidence-overview"></div>
      <div id="cpdEntries" class="cpd-entry-list" aria-live="polite"></div>
    </section>
  `;
}

function getCpdEntries() {
  return readJurisdictionStored("socialWorkerResourceCpdEntries", []);
}

function saveCpdEntries(entries) {
  return writeStoredJson(jurisdictionStorageKey("socialWorkerResourceCpdEntries"), entries);
}

function currentRegistrationYearLabel(date = new Date()) {
  const year = date.getFullYear();
  const startYear = date.getMonth() === 11 ? year : year - 1;
  return `1 December ${startYear} to 30 November ${startYear + 1}`;
}

function countWords(value) {
  return String(value || "").trim().split(/\s+/).filter(Boolean).length;
}

function updateWordCount(field) {
  const target = document.querySelector(`[data-word-count="${field.dataset.wordCountField}"]`);
  if (!target) {
    return;
  }

  const count = countWords(field.value);
  const advice = count < 250
    ? "aim for more detail"
    : count <= 500
      ? "within SWE guidance range"
      : "consider tightening";
  target.textContent = `${count} words, ${advice}`;
  target.dataset.wordCountStatus = count < 250 ? "low" : count <= 500 ? "ready" : "high";
}

function updateAllWordCounts() {
  document.querySelectorAll("[data-word-count-field]").forEach(updateWordCount);
}

function cpdEntryTitle(entry) {
  return entry.title || entry.focus || "Untitled CPD activity";
}

function cpdEntryLearning(entry) {
  return entry.learning || entry.reflection || "";
}

function cpdEntryImpact(entry) {
  return entry.impact || "";
}

function cpdEntryType(entry) {
  return entry.type || entry.confidence || "Reflection";
}

function cpdEntryIncludesPeer(entry) {
  return Boolean(entry.peerReflectionIncluded || entry.peerLearning);
}

function selectedStandardsFor(entry) {
  if (Array.isArray(entry.standards)) {
    return entry.standards;
  }
  return [];
}

function standardLabel(id) {
  const standard = cpdStandards.find((item) => item.id === id);
  return standard ? `${standard.id} ${standard.short}` : id;
}

function renderCpdRequirementStatus() {
  const status = document.querySelector("#cpdRequirementStatus");
  if (!status) {
    return;
  }

  const entries = getCpdEntries();
  const peerCount = entries.filter(cpdEntryIncludesPeer).length;
  const hasMinimumPieces = entries.length >= 2;
  const hasPeerReflection = peerCount >= 1;
  const isReady = hasMinimumPieces && hasPeerReflection;

  status.innerHTML = `
    <div class="cpd-status-card ${hasMinimumPieces ? "ready" : ""}">
      <strong>${entries.length}/2</strong>
      <span>${hasMinimumPieces ? "Minimum CPD pieces drafted" : "Draft at least 2 separate CPD pieces"}</span>
    </div>
    <div class="cpd-status-card ${hasPeerReflection ? "ready" : ""}">
      <strong>${peerCount}/1</strong>
      <span>${hasPeerReflection ? "Peer reflection included" : "Add peer reflection to at least 1 piece"}</span>
    </div>
    <div class="cpd-status-card ${isReady ? "ready" : ""}">
      <strong>${isReady ? "Ready" : "Drafting"}</strong>
      <span>${isReady ? "Copy final entries into your SWE online account" : "This browser log is not your SWE submission"}</span>
    </div>
  `;
}

function renderCpdEntries() {
  if (activeJurisdiction !== "england") return renderWalesCpdEntries();
  const entryList = document.querySelector("#cpdEntries");
  if (!entryList) {
    return;
  }

  renderCpdRequirementStatus();
  const entries = getCpdEntries();
  entryList.innerHTML = entries.length ? `
    <div class="entry-list-head">
      <span class="panel-kicker">Saved CPD Drafts</span>
      <strong>${entries.length} saved</strong>
    </div>
    ${entries.map((entry) => `
      <article class="cpd-entry">
        <div>
          <h3>${escapeHtml(cpdEntryTitle(entry))}</h3>
          <span>${escapeHtml(entry.activityDate || entry.date || "")} | ${escapeHtml(cpdEntryType(entry))}${entry.registrationYear ? ` | ${escapeHtml(entry.registrationYear)}` : ""}</span>
        </div>
        ${selectedStandardsFor(entry).length ? `
          <div class="standard-pill-row" aria-label="Selected CPD standards">
            ${selectedStandardsFor(entry).map((standard) => `<span>${escapeHtml(standardLabel(standard))}</span>`).join("")}
          </div>
        ` : ""}
        <div class="cpd-entry-section">
          <strong>Learning</strong>
          <p>${escapeHtml(cpdEntryLearning(entry))}</p>
        </div>
        ${cpdEntryImpact(entry) ? `
          <div class="cpd-entry-section">
            <strong>Impact on practice and people</strong>
            <p>${escapeHtml(cpdEntryImpact(entry))}</p>
          </div>
        ` : ""}
        ${cpdEntryIncludesPeer(entry) ? `
          <div class="cpd-entry-section peer-note">
            <strong>Peer reflection${entry.peerRole ? ` with ${escapeHtml(entry.peerRole)}` : ""}${entry.peerDate ? ` on ${escapeHtml(entry.peerDate)}` : ""}</strong>
            ${entry.peerLearning ? `<p>${escapeHtml(entry.peerLearning)}</p>` : "<p>Peer reflection included. Add what you learnt from the discussion before copying to Social Work England.</p>"}
          </div>
        ` : ""}
        ${entry.action ? `<p><strong>Next:</strong> ${escapeHtml(entry.action)}</p>` : ""}
        <button type="button" data-delete-cpd="${entry.id}">Delete</button>
      </article>
    `).join("")}
  ` : `
    <div class="empty-state">
      <strong>No CPD drafts saved yet.</strong>
      <p>Add a Social Work England-style draft after reading a module, completing a scenario, or discussing learning in supervision.</p>
    </div>
  `;
}

function confidenceLabel(value) {
  return {
    "not-started": "Not started",
    learning: "Learning",
    confident: "Confident",
    supervision: "Needs supervision"
  }[value] || "Not started";
}

function showReaderSaveStatus(message, confirmed = false) {
  if (!readerSaveStatus) {
    return;
  }
  readerSaveStatus.textContent = message;
  readerSaveStatus.classList.toggle("is-confirmed", confirmed);
}

function renderConfidenceOverview() {
  const overview = document.querySelector("#confidenceOverview");
  if (!overview) {
    return;
  }

  const tracked = resources.filter((resource) => resource.group !== "Website");
  const counts = tracked.reduce((acc, resource) => {
    const value = state.confidence[resource.id] || "not-started";
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});

  overview.innerHTML = `
    <div class="entry-list-head">
      <span class="panel-kicker">Confidence Tracker</span>
      <strong>${counts.confident || 0} confident</strong>
    </div>
    <div class="confidence-grid">
      ${["not-started", "learning", "confident", "supervision"].map((key) => `
        <div>
          <strong>${counts[key] || 0}</strong>
          <span>${confidenceLabel(key)}</span>
        </div>
      `).join("")}
    </div>
  `;
}

function exportCpdLog() {
  if (activeJurisdiction !== "england") return exportWalesCpd();
  const entries = getCpdEntries();
  const content = entries.length
    ? entries.map((entry) => [
      `CPD activity title: ${cpdEntryTitle(entry)}`,
      `Date saved: ${entry.date || ""}`,
      `Date of CPD activity: ${entry.activityDate || ""}`,
      `Registration year: ${entry.registrationYear || ""}`,
      `Type of CPD: ${cpdEntryType(entry)}`,
      `CPD standard parts selected: ${selectedStandardsFor(entry).map(standardLabel).join(", ")}`,
      "",
      "Describe what you have learnt from doing this CPD activity:",
      cpdEntryLearning(entry),
      "",
      "Reflect on and describe the positive impact the CPD has had or will have on your practice and the people you work with:",
      cpdEntryImpact(entry),
      "",
      `Peer reflection included: ${cpdEntryIncludesPeer(entry) ? "Yes" : "No"}`,
      `Peer role or relationship: ${entry.peerRole || ""}`,
      `Date discussed with peer: ${entry.peerDate || ""}`,
      "What you learnt from discussing this CPD with a peer:",
      entry.peerLearning || "",
      "",
      `Next action: ${entry.action || ""}`
    ].join("\n")).join("\n\n---\n\n")
    : "No CPD drafts saved yet.";
  downloadTextFile("social-worker-resource-cpd-log.txt", content);
}

function cpdPrintableEntryMarkup(entry, index) {
  return `
    <article class="entry">
      <h2>${index + 1}. ${escapeHtml(cpdEntryTitle(entry))}</h2>
      <dl>
        <div><dt>Date saved</dt><dd>${escapeHtml(entry.date || "")}</dd></div>
        <div><dt>Date of CPD activity</dt><dd>${escapeHtml(entry.activityDate || "")}</dd></div>
        <div><dt>Registration year</dt><dd>${escapeHtml(entry.registrationYear || "")}</dd></div>
        <div><dt>Type of CPD</dt><dd>${escapeHtml(cpdEntryType(entry))}</dd></div>
        <div><dt>CPD standard parts selected</dt><dd>${escapeHtml(selectedStandardsFor(entry).map(standardLabel).join(", "))}</dd></div>
        <div><dt>Peer reflection included</dt><dd>${cpdEntryIncludesPeer(entry) ? "Yes" : "No"}</dd></div>
      </dl>
      <h3>Describe what you have learnt from doing this CPD activity</h3>
      <p>${escapeHtml(cpdEntryLearning(entry))}</p>
      <h3>Reflect on and describe the positive impact the CPD has had or will have</h3>
      <p>${escapeHtml(cpdEntryImpact(entry))}</p>
      ${cpdEntryIncludesPeer(entry) ? `
        <h3>What you learnt from discussing this CPD with a peer</h3>
        <p><strong>Peer role or relationship:</strong> ${escapeHtml(entry.peerRole || "")}</p>
        <p><strong>Date discussed:</strong> ${escapeHtml(entry.peerDate || "")}</p>
        <p>${escapeHtml(entry.peerLearning || "")}</p>
      ` : ""}
      ${entry.action ? `
        <h3>Next action or evidence note</h3>
        <p>${escapeHtml(entry.action)}</p>
      ` : ""}
    </article>
  `;
}

function printCpdLog() {
  if (activeJurisdiction !== "england") return printWalesCpd();
  const entries = getCpdEntries();
  const printWindow = window.open("", "_blank", "width=900,height=700");
  if (!printWindow) {
    window.print();
    return;
  }

  const generatedDate = new Date().toLocaleDateString("en-GB");
  const body = entries.length
    ? entries.map(cpdPrintableEntryMarkup).join("")
    : "<p>No CPD drafts saved yet.</p>";

  printWindow.document.write(`
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <title>Social Worker Resource CPD Drafts</title>
        <style>
          body {
            margin: 0;
            color: #213134;
            font-family: Arial, sans-serif;
            line-height: 1.55;
          }

          main {
            max-width: 860px;
            margin: 0 auto;
            padding: 34px 28px;
          }

          h1 {
            margin: 0 0 8px;
            font-size: 28px;
          }

          h2 {
            color: #287c8f;
            font-size: 20px;
            margin-top: 24px;
          }

          h3 {
            color: #213134;
            font-size: 15px;
            margin: 18px 0 6px;
          }

          .notice {
            border-left: 5px solid #c5902d;
            background: #fff7df;
            margin: 20px 0;
            padding: 12px 14px;
          }

          .entry {
            break-inside: avoid;
            border-top: 1px solid #d8e5dc;
            margin-top: 22px;
            padding-top: 12px;
          }

          dl {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 8px 18px;
            margin: 12px 0;
          }

          dt {
            color: #41555a;
            font-weight: 700;
          }

          dd {
            margin: 0;
          }

          p {
            white-space: pre-wrap;
          }

          @media print {
            main {
              padding: 0;
            }
          }
        </style>
      </head>
      <body>
        <main>
          <h1>Social Worker Resource CPD Drafts</h1>
          <p>Generated ${escapeHtml(generatedDate)}. These are private draft notes for copying into the Social Work England online account where appropriate.</p>
          <div class="notice">
            <strong>Storage reminder:</strong> these drafts are saved in this browser on this device. Keep an exported or PDF copy if you need a reliable record.
          </div>
          ${body}
        </main>
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}

function printableToolsMarkup() {
  return `
    <section class="tool-panel printable-panel" aria-labelledby="printableTitle">
      <div class="tool-panel-head">
        <span class="panel-kicker">Practice Toolkit</span>
        <h2 id="printableTitle">Download or print practice prompts</h2>
        <p>These prompts are for learning, supervision, and drafting. Adapt them to local recording systems, policy, and the person you are working with.</p>
      </div>
      <div class="tool-actions">
        <button class="secondary-tool-button" type="button" data-print-page>Print this page</button>
        <button class="secondary-tool-button" type="button" data-download-all-tools>Download all prompts</button>
      </div>
      <div class="download-grid">
        ${printableTemplates.map((template) => `
          <article class="download-card">
            <h3>${escapeHtml(template.title)}</h3>
            <p>${escapeHtml(template.summary || template.body.split("\n").slice(2, 5).join(" "))}</p>
            <button class="inline-open" type="button" data-download-template="${template.id}">Download prompt</button>
          </article>
        `).join("")}
      </div>
    </section>
  `;
}

function downloadTextFile(fileName, content) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function studentPathwayMarkup() {
  return `
    <section class="tool-panel pathway-panel" aria-labelledby="pathwayTitle">
      <div class="tool-panel-head">
        <span class="panel-kicker">${activeJurisdiction !== "england" ? "Student and newly qualified route" : "Student and ASYE Route"}</span>
        <h2 id="pathwayTitle">Build confidence step by step</h2>
        <p>${activeJurisdiction !== "england" ? "Use this route for placement learning, supervision and practice educator conversations." : "Use this route for placement learning, ASYE evidence, supervision preparation, and practice educator conversations."}</p>
      </div>
      <div class="pathway-steps">
        ${studentPathwaySteps.map((step, index) => {
          const resource = resources.find((item) => item.id === step.resource);
          return `
            <article class="pathway-step" style="--accent: ${resource?.accent || "#287c8f"}">
              <span>${String(index + 1).padStart(2, "0")}</span>
              <h3>${escapeHtml(step.title)}</h3>
              <p>${escapeHtml(step.task)}</p>
              ${resource ? `<button class="inline-open" type="button" data-open="${resource.id}">Open ${escapeHtml(resource.title)}</button>` : ""}
            </article>
          `;
        }).join("")}
      </div>
    </section>
  `;
}

function countFlashcards() {
  return flashcardDecks.reduce((count, deck) => count + deck.cards.length, 0);
}

function flashcardsMarkup() {
  const totalCards = countFlashcards();
  return `
    <section class="flashcards-panel" aria-labelledby="flashcardsTitle">
      <div class="flashcards-head">
        <div>
          <span class="panel-kicker">Learning Deck</span>
          <h2 id="flashcardsTitle">Module flashcards</h2>
          <p>${totalCards} revision cards across ${flashcardDecks.length} modules. Filter by module, flip each card, and use the prompts for recall practice.</p>
        </div>
        <div class="flashcards-summary" aria-label="Flashcard summary">
          <strong>${totalCards}</strong>
          <span>cards</span>
        </div>
      </div>
      <div class="flashcard-filters" aria-label="Choose flashcard module">
        <button class="flashcard-filter active" data-flashcard-filter="all">All Modules</button>
        ${flashcardDecks.map((deck) => `
          <button class="flashcard-filter" data-flashcard-filter="${deck.id}">${deck.title}</button>
        `).join("")}
      </div>
      <div id="flashcardDeck" class="flashcard-grid" aria-live="polite"></div>
    </section>
  `;
}

function renderFlashcards(filter = "all") {
  const deckElement = document.querySelector("#flashcardDeck");
  if (!deckElement) {
    return;
  }

  const selectedDecks = filter === "all"
    ? flashcardDecks
    : flashcardDecks.filter((deck) => deck.id === filter);
  const cards = selectedDecks.flatMap((deck) => deck.cards.map((card, index) => ({ ...card, deck, index })));

  document.querySelectorAll(".flashcard-filter").forEach((button) => {
    button.classList.toggle("active", button.dataset.flashcardFilter === filter);
  });

  deckElement.innerHTML = cards.map((card, index) => `
    <button class="flashcard" type="button" data-flip-card aria-pressed="false" style="--accent: ${resources.find((resource) => resource.id === card.deck.id)?.accent || "#4f8a66"}">
      <span class="flashcard-inner">
        <span class="flashcard-face flashcard-front" aria-hidden="false">
          <span class="flashcard-meta">
            <span>${card.deck.title}</span>
            <span>${String(index + 1).padStart(2, "0")} / ${cards.length}</span>
          </span>
          <span class="flashcard-content">
            <span class="flashcard-label">Prompt</span>
            <strong>${escapeHtml(card.prompt)}</strong>
          </span>
          <span class="flashcard-toggle">Flip card</span>
        </span>
        <span class="flashcard-face flashcard-back" aria-hidden="true">
          <span class="flashcard-meta">
            <span>${card.deck.title}</span>
            <span>${String(index + 1).padStart(2, "0")} / ${cards.length}</span>
          </span>
          <span class="flashcard-content">
            <span class="flashcard-label">Answer</span>
            <span>${escapeHtml(card.answer)}</span>
          </span>
          <span class="flashcard-toggle">Show prompt</span>
        </span>
      </span>
    </button>
  `).join("");
}

function enhanceResource(documentData) {
  if (activeJurisdiction !== "england" && documentData.id === "cpd-log") {
    contentView.insertAdjacentHTML("beforeend", walesCpdMarkup());
    renderWalesCpdEntries();
    return;
  }
  if (documentData.id === "case-route-finder") {
    contentView.insertAdjacentHTML("beforeend", routeFinderMarkup());
    renderRouteFinderResults();
  }
  if (documentData.id === "contact-us") {
    contentView.insertAdjacentHTML("beforeend", contactFormMarkup());
  }
  if (documentData.id === "cpd-log") {
    contentView.insertAdjacentHTML("beforeend", cpdLogMarkup());
    renderConfidenceOverview();
    renderCpdEntries();
    updateAllWordCounts();
  }
  if (documentData.id === "flashcards") {
    contentView.insertAdjacentHTML("beforeend", flashcardsMarkup());
    renderFlashcards();
  }
  if (documentData.id === "glossary") {
    contentView.insertAdjacentHTML("beforeend", glossaryMarkup());
    renderGlossary();
  }
  if (documentData.id === "printable-tools" || documentData.id === "templates") {
    contentView.insertAdjacentHTML("beforeend", printableToolsMarkup());
  }
  if (documentData.id === "scenarios") {
    contentView.insertAdjacentHTML("afterbegin", scenarioHubMarkup());
  }
  if (["student-asye-pathway", "student-pathway"].includes(documentData.id)) {
    contentView.insertAdjacentHTML("beforeend", studentPathwayMarkup());
  }
  if (documentData.id === "theory-practice") {
    contentView.insertAdjacentHTML("beforeend", theoryPracticeMarkup());
    renderHypothesisResults();
  }
  if (documentData.id === "children-models") {
    contentView.insertAdjacentHTML("beforeend", childrenModelsMarkup());
    renderChildrenModelResults();
  }
}

function renderToc() {
  const headings = [...contentView.querySelectorAll("h2, h3")].slice(0, 14);
  if (!headings.length) {
    sectionToc.innerHTML = "<h3>Section Contents</h3><p>No sub-sections in this page.</p>";
    return;
  }

  sectionToc.innerHTML = `
    <h3>Section Contents</h3>
    ${headings.map((heading) => `
      <a class="toc-link" href="#${heading.id}">${heading.textContent}</a>
    `).join("")}
  `;
}

function scrollToElementWithOffset(element) {
  if (!element) {
    return;
  }
  const headerHeight = siteHeader ? siteHeader.getBoundingClientRect().height : 0;
  const stickyHeader = window.matchMedia("(max-width: 980px)").matches
    ? document.querySelector(".sidebar")
    : null;
  const offset = headerHeight + (stickyHeader ? stickyHeader.getBoundingClientRect().height : 0) + 18;
  const top = element.getBoundingClientRect().top + window.scrollY - offset;
  window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
}

function scrollToReaderSection() {
  scrollToElementWithOffset(document.querySelector("#readerSection"));
}

function scrollToContentSection(sectionId) {
  const target = sectionId ? document.getElementById(sectionId) : null;
  if (!target) {
    scrollToReaderSection();
    return;
  }
  target.setAttribute("tabindex", "-1");
  target.focus({ preventScroll: true });
  scrollToElementWithOffset(target);
}

function openResource(id, shouldScroll = true, targetSection = "") {
  if (!stashCpdDraft()) return;
  const documentData = state.documents.get(id);
  if (!documentData) {
    return;
  }

  state.activeId = id;
  state.query = "";
  searchInput.value = "";
  renderSearch();
  contentView.innerHTML = documentData.html;
  enhanceResource(documentData);
  restoreCpdDraft();
  renderActiveResource(documentData);
  renderToc();
  renderNav();
  renderModuleCards();
  renderProgress();
  if (shouldScroll) {
    updateResourceUrl(id, targetSection);
    if (targetSection) {
      scrollToContentSection(targetSection);
    } else {
      scrollToReaderSection();
    }
  }
}

function renderProgress() {
  const count = state.read.size;
  const isActiveRead = state.read.has(state.activeId);
  progressText.textContent = `${count} of ${resources.length} sections read`;
  progressBar.style.width = `${Math.round((count / resources.length) * 100)}%`;
  markReadButton.textContent = isActiveRead ? "Current section read" : "Mark current section read";
  markReadButton.setAttribute("aria-pressed", String(isActiveRead));
  readerMarkReadButton.textContent = isActiveRead ? "Section read" : "Mark section read";
  readerMarkReadButton.classList.toggle("is-read", isActiveRead);
  readerMarkReadButton.setAttribute("aria-pressed", String(isActiveRead));
  if (confidenceSelect) {
    confidenceSelect.value = state.confidence[state.activeId] || "not-started";
  }
  renderConfidenceOverview();
}

function persistRead() {
  writeStoredJson(jurisdictionStorageKey("socialWorkerResourceRead"), [...state.read]);
}

function persistConfidence() {
  writeStoredJson(jurisdictionStorageKey("socialWorkerResourceConfidence"), state.confidence);
}

function getSearchMatches(query) {
  const terms = query
    .toLowerCase()
    .split(/\s+/)
    .map((term) => term.trim())
    .filter(Boolean);

  if (!terms.length) {
    return [];
  }

  return [...state.documents.values()]
    .map((documentData) => {
      const haystack = `${documentData.title} ${documentData.summary} ${documentData.plain}`.toLowerCase();
      const matchedTerms = terms.filter((term) => haystack.includes(term));
      const titleHit = terms.some((term) => documentData.title.toLowerCase().includes(term));
      const summaryHit = terms.some((term) => documentData.summary.toLowerCase().includes(term));
      return {
        ...documentData,
        score: matchedTerms.length + (titleHit ? 3 : 0) + (summaryHit ? 2 : 0)
      };
    })
    .filter((documentData) => documentData.score > 0)
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
    .slice(0, 10);
}

function snippetFor(text, query) {
  const lower = text.toLowerCase();
  const firstTerm = query.toLowerCase().split(/\s+/).find((term) => lower.includes(term)) || query.toLowerCase();
  const start = Math.max(0, lower.indexOf(firstTerm) - 90);
  const end = Math.min(text.length, start + 220);
  return `${start > 0 ? "..." : ""}${text.slice(start, end)}${end < text.length ? "..." : ""}`;
}

function renderSearch() {
  const query = state.query.trim();
  if (query.length < 2) {
    searchResults.hidden = true;
    searchResults.innerHTML = "";
    sidebarSearchResults.hidden = true;
    sidebarSearchResults.innerHTML = "";
    return;
  }

  const matches = getSearchMatches(query);

  searchResults.hidden = false;
  searchResults.innerHTML = `
    <div class="search-results-header">
      <span class="panel-kicker">Live Search</span>
      <h2>${matches.length ? `${matches.length} result${matches.length === 1 ? "" : "s"} for "${escapeHtml(query)}"` : `No results for "${escapeHtml(query)}"`}</h2>
      <p>${matches.length ? "Matching sections are shown below. Open a result to read the full learning page." : "Try decision-making, safeguarding, support, rights or children."}</p>
    </div>
    ${matches.length ? `
      <div class="results-grid">
        ${matches.map((match) => `
          <article class="search-result-card">
            <button data-open="${match.id}">
              <span class="result-meta">${match.group} / ${match.code}</span>
              <h3>${highlightText(match.title, query)}</h3>
              <p>${highlightText(snippetFor(`${match.summary} ${match.plain}`, query), query)}</p>
            </button>
          </article>
        `).join("")}
      </div>
    ` : ""}
  `;

  sidebarSearchResults.hidden = false;
  sidebarSearchResults.innerHTML = `
    <div class="sidebar-search-title">${matches.length ? "Matches" : "No matches"}</div>
    ${matches.length ? matches.slice(0, 5).map((match) => `
      <button class="sidebar-result-button" data-open="${match.id}">
        <span>${highlightText(match.title, query)}</span>
        <small>${highlightText(snippetFor(`${match.summary} ${match.plain}`, query), query)}</small>
      </button>
    `).join("") : `<p>Try "capacity", "support", "safeguarding", or "rights".</p>`}
  `;
}

document.addEventListener("click", (event) => {
  const mobileToggle = event.target.closest("#mobileNavToggle");
  if (mobileToggle) {
    setMobileNavigation(!siteHeader?.classList.contains("nav-open"));
    return;
  }

  if (siteHeader?.classList.contains("nav-open") && !event.target.closest(".site-header")) {
    setMobileNavigation(false);
  }

  const routeReset = event.target.closest("[data-route-reset]");
  if (routeReset) {
    document.querySelectorAll("[data-route-answer]").forEach((input) => {
      input.checked = false;
    });
    renderRouteFinderResults();
    return;
  }

  const hypothesisReset = event.target.closest("[data-hypothesis-reset]");
  if (hypothesisReset) {
    document.querySelectorAll("[data-hypothesis-answer]").forEach((input) => {
      input.checked = false;
    });
    renderHypothesisResults();
    return;
  }

  const modelReset = event.target.closest("[data-model-reset]");
  if (modelReset) {
    document.querySelectorAll("[data-model-answer]").forEach((input) => {
      input.checked = false;
    });
    renderChildrenModelResults();
    return;
  }

  const glossaryLetter = event.target.closest("[data-glossary-letter]");
  if (glossaryLetter) {
    const search = document.querySelector("#glossarySearch");
    renderGlossary(search?.value || "", glossaryLetter.dataset.glossaryLetter);
    return;
  }

  const scenarioToggle = event.target.closest("[data-scenario-toggle]");
  if (scenarioToggle) {
    const card = scenarioToggle.closest(".scenario-card");
    const reveal = card?.querySelector(".scenario-reveal");
    if (reveal) {
      const isOpen = reveal.hidden;
      reveal.hidden = !isOpen;
      scenarioToggle.setAttribute("aria-expanded", String(isOpen));
      scenarioToggle.textContent = isOpen ? "Hide learning points" : "Reveal learning points";
    }
    return;
  }

  const templateDownload = event.target.closest("[data-download-template]");
  if (templateDownload) {
    const template = printableTemplates.find((item) => item.id === templateDownload.dataset.downloadTemplate);
    if (template) {
      downloadTextFile(template.fileName, template.body);
    }
    return;
  }

  const downloadAllTools = event.target.closest("[data-download-all-tools]");
  if (downloadAllTools) {
    downloadTextFile(
      `${activeJurisdiction}-social-worker-practice-prompts.txt`,
      printableTemplates.map((template) => template.body).join("\n\n====================\n\n")
    );
    return;
  }

  const printPage = event.target.closest("[data-print-page]");
  if (printPage) {
    window.print();
    return;
  }

  const exportCpd = event.target.closest("[data-export-cpd]");
  if (exportCpd) {
    exportCpdLog();
    return;
  }

  const printCpd = event.target.closest("[data-print-cpd]");
  if (printCpd) {
    printCpdLog();
    return;
  }

  const deleteCpd = event.target.closest("[data-delete-cpd]");
  if (deleteCpd) {
    const entries = getCpdEntries().filter((entry) => entry.id !== deleteCpd.dataset.deleteCpd);
    if (!saveCpdEntries(entries)) {
      showJurisdictionMessage("Unable to update saved reflections in this browser. Please try again.");
      return;
    }
    renderCpdEntries();
    return;
  }

  const filterButton = event.target.closest("[data-flashcard-filter]");
  if (filterButton) {
    renderFlashcards(filterButton.dataset.flashcardFilter);
    return;
  }

  const flashcard = event.target.closest("[data-flip-card]");
  if (flashcard) {
    const isFlipped = flashcard.classList.toggle("flipped");
    flashcard.setAttribute("aria-pressed", String(isFlipped));
    const front = flashcard.querySelector(".flashcard-front");
    const back = flashcard.querySelector(".flashcard-back");
    if (front && back) {
      front.setAttribute("aria-hidden", String(isFlipped));
      back.setAttribute("aria-hidden", String(!isFlipped));
    }
    return;
  }

  const opener = event.target.closest("[data-open]");
  if (opener) {
    openResource(opener.dataset.open, true, opener.dataset.section || "");
    setMobileNavigation(false);
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && siteHeader?.classList.contains("nav-open")) {
    setMobileNavigation(false);
    mobileNavToggle?.focus();
  }
});

searchInput.addEventListener("input", (event) => {
  state.query = event.target.value;
  renderSearch();
});

document.addEventListener("input", (event) => {
  if (event.target.matches("#glossarySearch")) {
    const activeLetter = document.querySelector("[data-glossary-letter].active")?.dataset.glossaryLetter || "All";
    renderGlossary(event.target.value, activeLetter);
  }
  if (event.target.matches("[data-word-count-field]")) {
    updateWordCount(event.target);
  }
});

document.addEventListener("change", (event) => {
  if (event.target.matches("[data-route-answer]")) {
    renderRouteFinderResults();
  }
  if (event.target.matches("[data-hypothesis-answer]")) {
    renderHypothesisResults();
  }
  if (event.target.matches("[data-model-answer]")) {
    renderChildrenModelResults();
  }
});

document.addEventListener("submit", (event) => {
  if (!event.target.matches(".cpd-form")) {
    return;
  }
  event.preventDefault();
  const form = event.target;
  const formData = new FormData(form);
  const entries = getCpdEntries();
  entries.unshift({
    id: crypto.randomUUID(),
    jurisdiction: activeJurisdiction,
    regulator: activeJurisdiction === "england" ? "Social Work England" : activeJurisdiction === "wales" ? "Social Care Wales" : null,
    professionalBody: packCache.get(activeJurisdiction)?.professionalBody || null,
    schemaVersion: 2,
    date: new Date().toLocaleDateString("en-GB"),
    title: String(formData.get("title") || "").trim(),
    activityDate: String(formData.get("activityDate") || "").trim(),
    registrationYear: String(formData.get("registrationYear") || "").trim(),
    type: String(formData.get("type") || "").trim(),
    standards: formData.getAll("standards").map((standard) => String(standard)),
    learning: String(formData.get("learning") || "").trim(),
    impact: String(formData.get("impact") || "").trim(),
    peerReflectionIncluded: formData.get("peerReflectionIncluded") === "yes",
    peerRole: String(formData.get("peerRole") || "").trim(),
    peerDate: String(formData.get("peerDate") || "").trim(),
    peerLearning: String(formData.get("peerLearning") || "").trim(),
    action: String(formData.get("action") || "").trim()
  });
  if (!saveCpdEntries(entries)) {
    showJurisdictionMessage("Unable to save in this browser. Your text is still here; copy it before leaving.");
    return;
  }
  clearCpdDraft();
  form.dataset.dirty = "false";
  form.reset();
  updateAllWordCounts();
  renderCpdEntries();
});

if (confidenceSelect) {
  confidenceSelect.addEventListener("change", (event) => {
    state.confidence[state.activeId] = event.target.value;
    persistConfidence();
    renderProgress();
    showReaderSaveStatus(`Confidence saved: ${confidenceLabel(event.target.value)}.`, true);
  });
}

markReadButton.addEventListener("click", () => {
  state.read.add(state.activeId);
  persistRead();
  renderNav();
  renderModuleCards();
  renderProgress();
  showReaderSaveStatus(`${activeTitle.textContent} marked as read.`, true);
});

readerMarkReadButton.addEventListener("click", () => {
  state.read.add(state.activeId);
  persistRead();
  renderNav();
  renderModuleCards();
  renderProgress();
  showReaderSaveStatus(`${activeTitle.textContent} marked as read.`, true);
});

initializeJurisdictions();
