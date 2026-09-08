// Jurisdiction switching is kept separate from the existing England tools.
let activeJurisdiction = "england";
const packCache = new Map();
let switchSequence = 0;
let activePackUrl = "";
const jurisdictionNames = Object.freeze({england:'England',wales:'Wales',scotland:'Scotland','northern-ireland':'Northern Ireland',ireland:'Ireland','new-zealand':'Aotearoa New Zealand','australia-nsw':'New South Wales','australia-victoria':'Victoria','canada-ontario':'Ontario','canada-british-columbia':'British Columbia','united-states-california':'California','united-states-new-york':'New York'});
function practiceLocationName(jurisdiction = activeJurisdiction) {
  return jurisdictionNames[jurisdiction] || 'Selected location';
}

function jurisdictionStorageKey(key, jurisdiction = activeJurisdiction) {
  return `socialWorkerResource:v2:${jurisdiction}:${key}`;
}

function readJurisdictionStored(key, fallback, jurisdiction = activeJurisdiction) {
  const targetKey = jurisdictionStorageKey(key, jurisdiction);
  let value = readStoredJson(targetKey, null);
  if (value === null && jurisdiction === "england") {
    value = readStoredJson(key, fallback);
    // Preserve legacy keys; a failed copy can safely be retried on the next visit.
    writeStoredJson(targetKey, value);
  }
  if (value === null) return fallback;
  if (Array.isArray(fallback)) return Array.isArray(value) ? value : fallback;
  return value && typeof value === "object" && !Array.isArray(value) ? value : fallback;
}

function showJurisdictionMessage(message) {
  document.querySelector("#jurisdictionStatus").textContent = message;
}

function requestedLocation() {
  const url = new URL(location.href);
  const explicit = url.searchParams.get("jurisdiction");
  const resource = url.searchParams.get("resource") || url.searchParams.get("section");
  const legacy = resource || (url.hash && !["#readerSection", "#learningWorkspace"].includes(url.hash));
  const remembered = readStoredJson("socialWorkerResourceJurisdiction", "england");
  return { jurisdiction: explicit || (legacy ? "england" : remembered), resource: resource || (legacy ? url.hash.slice(1) : "readme") };
}

function stashCpdDraft() {
  const form = document.querySelector(".cpd-form");
  if (!form || form.dataset.dirty !== "true") return true;
  const draft = [...new FormData(form).entries()];
  const saved = writeStoredJson(jurisdictionStorageKey("draft"), draft);
  if (!saved) showJurisdictionMessage("Your reflection could not be saved. Copy your text before changing section or country.");
  return saved;
}

function clearCpdDraft() {
  writeStoredJson(jurisdictionStorageKey("draft"), null);
}

function restoreCpdDraft() {
  const form = document.querySelector(".cpd-form");
  const draft = readStoredJson(jurisdictionStorageKey("draft"), null);
  if (!form || !Array.isArray(draft)) return;
  const valid = draft.filter((pair) => Array.isArray(pair) && pair.length === 2);
  for (const field of form.elements) {
    if (!field.name || field.type === "submit" || field.type === "button") continue;
    const values = valid.filter(([name]) => name === field.name).map(([, value]) => value);
    if (field.type === "checkbox" || field.type === "radio") field.checked = values.includes(field.value);
    else field.value = values[0] || "";
  }
  form.dataset.dirty = "true";
  updateAllWordCounts();
}

function setPackBusy(busy) {
  document.querySelector('#locationChooserButton').disabled = busy;
  document.querySelector(".main-view").inert = busy;
  document.querySelector("#navList").inert = busy;
  document.querySelector("#primaryNav").inert = busy;
  document.querySelector("#searchInput").disabled = busy;
  document.querySelector("#learningWorkspace").setAttribute("aria-busy", String(busy));
}

async function switchJurisdiction(jurisdiction, requestedResource, historyMode = "push") {
  const select = document.querySelector("#jurisdictionSelect");
  if (!stashCpdDraft()) { select.value = activeJurisdiction; return false; }
  if (!Object.hasOwn(jurisdictionNames, jurisdiction)) {
    showJurisdictionMessage("That practice location is not available. Choose a location from the list.");
    select.value = activeJurisdiction;
    return false;
  }
  const sequence = ++switchSequence;
  const current = resources.find((item) => item.id === state.activeId);
  const topic = current?.topicId || current?.id;
  setPackBusy(true);
    showJurisdictionMessage(`Loading ${practiceLocationName(jurisdiction)} guide…`);
  try {
    let pack = packCache.get(jurisdiction);
    if (!pack) {
      const response = await fetch(`content/${jurisdiction}/manifest.json?v=${contentVersion}`);
      if (!response.ok) throw new Error("Guide could not be loaded");
      pack = await response.json();
      validatePack(pack, jurisdiction);
    }
    const documents = await loadDocuments(pack.resources);
    if (sequence !== switchSequence) return false;
    packCache.set(jurisdiction, pack);
    // Commit a complete pack together, only after every resource has loaded.
    activeJurisdiction = jurisdiction;
    resources.splice(0, resources.length, ...pack.resources);
    featuredIds = pack.featuredIds;
    routeQuestions = pack.routeQuestions;
    routeDetails = pack.routeDetails;
    flashcardDecks = pack.flashcardDecks;
    glossaryTerms = pack.glossaryTerms;
    theoryLenses = pack.theoryLenses;
    hypothesisSignals = pack.hypothesisSignals;
    childPracticeModels = pack.childPracticeModels;
    childModelSignals = pack.childModelSignals;
    scenarioWorkouts = pack.scenarioWorkouts;
    printableTemplates = pack.printableTemplates;
    studentPathwaySteps = pack.studentPathwaySteps;
    state.documents = documents;
    state.read = new Set(readJurisdictionStored("socialWorkerResourceRead", []).filter((id) => documents.has(id)));
    state.confidence = readJurisdictionStored("socialWorkerResourceConfidence", {});
    // The old form belongs to the old jurisdiction; it was saved above.
    contentView.innerHTML = "";
    const equivalent = resources.find((item) => (item.topicId || item.id) === topic)?.id;
    const target = requestedResource || equivalent || "readme";
    const resourceId = documents.has(target) ? target : "readme";
    renderJurisdictionChrome(pack);
    openResource(resourceId, false);
    const url = new URL(location.href);
    url.searchParams.delete("section");
    url.searchParams.set("jurisdiction", jurisdiction);
    url.searchParams.set("resource", resourceId);
    if (historyMode === "push") url.hash = "learningWorkspace";
    if (historyMode === "push") history.pushState(null, "", url);
    else history.replaceState(null, "", url);
    activePackUrl = url.href;
    select.value = jurisdiction;
    const remembered = writeStoredJson("socialWorkerResourceJurisdiction", jurisdiction);
    showJurisdictionMessage(`${pack.label} · Final learning guide${remembered ? "" : " · Preference cannot be saved in this browser"}`);
    if (!documents.has(target)) showJurisdictionMessage(`That topic is not available in ${pack.label}. Showing the overview.`);
    return true;
  } catch (error) {
    if (sequence !== switchSequence) return false;
    select.value = activeJurisdiction;
    showJurisdictionMessage(`Unable to load this guide. Your current guide is unchanged. Choose the location again to retry.`);
    if (!state.documents.size) contentView.innerHTML = `<p class="error">The guide could not be loaded. Choose a practice location above to retry.</p>`;
    return false;
  } finally {
    if (sequence === switchSequence) { setPackBusy(false); select.disabled = false; }
  }
}

function validatePack(pack, jurisdiction) {
  if (!pack || pack.id !== jurisdiction || !Array.isArray(pack.resources) || !pack.resources.length) throw new Error("Invalid jurisdiction pack");
  const ids = new Set(pack.resources.map((item) => item.id));
  if (ids.size !== pack.resources.length || !ids.has("readme")) throw new Error("Invalid resources");
  for (const resource of pack.resources) {
    if (!(typeof resource.markdown === "string" || typeof resource.path === "string") || !resource.title || resource.jurisdiction !== jurisdiction) throw new Error("Invalid resource");
  }
  for (const key of ["featuredIds", "routeQuestions", "flashcardDecks", "glossaryTerms", "theoryLenses", "hypothesisSignals", "childPracticeModels", "childModelSignals", "scenarioWorkouts", "printableTemplates", "studentPathwaySteps"]) {
    if (!Array.isArray(pack[key]) || !pack[key].length) throw new Error(`Missing tool: ${key}`);
  }
  if (!pack.routeDetails) throw new Error("Missing routes");
  for (const id of pack.featuredIds) if (!ids.has(id)) throw new Error("Invalid featured topic");
  for (const question of pack.routeQuestions) {
    for (const id of question.routes) if (!ids.has(id) || !pack.routeDetails[id]) throw new Error("Invalid route");
  }
}

function renderJurisdictionChrome(pack) {
  document.documentElement.dataset.jurisdiction = activeJurisdiction;
  document.title = `Ultimate Social Worker Resource | ${pack.label}`;
  for (const selector of ['meta[name="description"]', 'meta[property="og:description"]', 'meta[name="twitter:description"]']) {
    const meta = document.querySelector(selector);
    if (meta) meta.content = pack.hero;
  }
  for (const selector of ['meta[property="og:title"]', 'meta[name="twitter:title"]']) {
    const meta = document.querySelector(selector);
    if (meta) meta.content = document.title;
  }
  const canonical = document.querySelector('link[rel="canonical"]');
  const canonicalUrl = `https://social-work-resource.netlify.app/${activeJurisdiction === "england" ? "" : `learning/${activeJurisdiction}/`}`;
  if (canonical) canonical.href = canonicalUrl;
  const socialUrl = document.querySelector('meta[property="og:url"]');
  if (socialUrl) socialUrl.content = canonicalUrl;
  document.querySelector(".brand-subtitle").textContent = pack.label;
  document.querySelector('#heroDescription').textContent = pack.hero;
  renderLocationIdentity(pack);
  document.querySelector("#searchInput").placeholder = activeJurisdiction === 'england' ? 'Care Act, DoLS, MHA…' : `Search ${practiceLocationName()} topics…`;
  document.querySelector(".law-watch ul").innerHTML = pack.alerts.map((text) => `<li>${escapeHtml(text)}</li>`).join("");
  document.querySelector(".law-watch h2").textContent = activeJurisdiction === "england" ? "Current practice alerts" : `${pack.label.replace(" practice guide", "")} practice context`;
  document.querySelector(".workspace-stats").innerHTML = `<span>${resources.length} sections</span><span>${featuredIds.length} modules</span><span>${countFlashcards()} flashcards</span><span>${pack.toolCount} interactive tools</span>`;
  const notice = document.querySelector("#jurisdictionNotice");
  notice.hidden = activeJurisdiction === "england";
  notice.innerHTML = `<strong>${escapeHtml(pack.label)}</strong><p>Final learning guide · Eight modules, forty flashcards and nine interactive tools. See the Source Library for official references and review information.</p>`;
  const learningLink = document.querySelector('.footer-links a[href*="learning/"]') || document.querySelector('.site-footer a[href*="learning/"]');
  if (learningLink) { learningLink.hidden = false; learningLink.href = activeJurisdiction === "england" ? "/learning/" : `/learning/${activeJurisdiction}/`; learningLink.textContent = `${pack.label.replace(" practice guide", "")} Learning Index`; }
  const robots = document.querySelector('meta[name="robots"]');
  if (robots) robots.content = activeJurisdiction === "england" ? "index, follow, max-image-preview:large" : "noindex, nofollow";
  const schema = document.querySelector('script[type="application/ld+json"]');
  if (schema) schema.type = activeJurisdiction === "england" ? "application/ld+json" : "application/json";
  const disabledSchema = document.querySelector('script[type="application/json"]');
  if (activeJurisdiction === "england" && disabledSchema) disabledSchema.type = "application/ld+json";
}

async function initializeJurisdictions() {
  initializeLocationChooser();
  document.querySelector("#jurisdictionSelect").addEventListener("change", (event) => switchJurisdiction(event.target.value));
  for (const type of ["input", "change"]) document.addEventListener(type, (event) => {
    const form = event.target.closest(".cpd-form");
    if (form) { form.dataset.dirty = "true"; stashCpdDraft(); }
  });
  window.addEventListener("beforeunload", (event) => {
    if (!stashCpdDraft()) { event.preventDefault(); event.returnValue = ""; }
  });
  window.addEventListener("popstate", async () => {
    const requested = requestedLocation();
    if (!await switchJurisdiction(requested.jurisdiction, requested.resource, "replace") && activePackUrl) history.replaceState(null, "", activePackUrl);
  });
  const requested = requestedLocation();
  if (!Object.hasOwn(jurisdictionNames, requested.jurisdiction)) {
    await switchJurisdiction("england", "readme", "replace");
    showJurisdictionMessage("Requested location unavailable. England is shown; choose a supported location above.");
  } else await switchJurisdiction(requested.jurisdiction, requested.resource, "replace");
}

function walesCpdMarkup() {
  const country = practiceLocationName();
  return `<section class="tool-panel cpd-panel" aria-labelledby="walesCpdTitle">
    <div class="tool-panel-head">
      <h2 id="walesCpdTitle">${country} reflection log</h2>
      <p>Record learning, its impact and discussions with your manager. These private notes stay in this browser. Export a copy to keep your own record. Do not enter identifiable case details.</p>
    </div>
    <form class="cpd-form">
      <div class="form-grid">
        <label class="form-field full-span"><span>CPD activity title</span><input name="title" required maxlength="200"></label>
        <label class="form-field"><span>Date of activity</span><input name="activityDate" type="date" required></label>
        <label class="form-field"><span>Type of learning</span><select name="type"><option>Reflection</option><option>Supervision</option><option>Reading or research</option><option>Training</option><option>Practice discussion</option></select></label>
        <label class="form-field full-span"><span>What did you learn?</span><textarea name="learning" required rows="5"></textarea></label>
        <label class="form-field full-span"><span>How could this improve practice and outcomes?</span><textarea name="impact" required rows="5"></textarea></label>
        <label class="form-field full-span"><span>Discussion with your manager or colleague (optional)</span><textarea name="peerLearning" rows="3"></textarea></label>
        <label class="form-field full-span"><span>Next action or evidence note</span><textarea name="action" rows="3"></textarea></label>
      </div>
      <div class="tool-actions">
        <button class="form-submit" type="submit">Save reflection</button>
        <button class="secondary-tool-button" type="button" data-export-cpd>Export ${country} reflections</button>
        <button class="secondary-tool-button" type="button" data-print-cpd>Print saved reflections</button>
      </div>
    </form><div id="cpdEntries" class="cpd-entry-list" aria-live="polite"></div></section>`;
}

function walesEntryMarkup(entry, includeActions = false) {
  return `<article class="cpd-entry">
    <div><h3>${escapeHtml(entry.title || "Reflection")}</h3><span>${escapeHtml(practiceLocationName())} · ${escapeHtml(entry.activityDate || entry.date || "")} · ${escapeHtml(entry.type || "Reflection")}</span></div>
    ${[["Learning",entry.learning],["Impact",entry.impact],["Discussion",entry.peerLearning],["Next action",entry.action]].filter(([,value])=>value).map(([label,value])=>`<div class="cpd-entry-section"><strong>${label}</strong><p>${escapeHtml(value)}</p></div>`).join("")}
    ${includeActions ? `<button type="button" data-delete-cpd="${escapeHtml(entry.id)}">Delete reflection</button>` : ""}
  </article>`;
}

function renderWalesCpdEntries() {
  const country = practiceLocationName();
  const target = document.querySelector("#cpdEntries");
  if (!target) return;
  const entries = getCpdEntries();
  target.innerHTML = entries.length ? `<div class="entry-list-head"><h3>Saved ${country} reflections</h3><strong>${entries.length} saved</strong></div>${entries.map((entry)=>walesEntryMarkup(entry, true)).join("")}` : `<p class="cpd-empty-state">No ${country} reflections saved yet. Your other country records remain separate.</p>`;
}

function exportWalesCpd() {
  const country = practiceLocationName();
  const entries = getCpdEntries();
  const content = entries.map((entry)=>`Activity: ${entry.title || "Reflection"}\nDate: ${entry.activityDate || ""}\nLearning: ${entry.learning || ""}\nImpact: ${entry.impact || ""}\nDiscussion: ${entry.peerLearning || ""}\nNext action: ${entry.action || ""}`).join("\n\n---\n\n");
  downloadTextFile(`${activeJurisdiction}-reflections.txt`, `${country} | Private reflection record\nExported: ${new Date().toLocaleDateString("en-GB")}\n\n${content || "No saved reflections."}`);
}

function printWalesCpd() {
  const printWindow = window.open("", "_blank");
  if (!printWindow) { showJurisdictionMessage("Allow the print window or use the reflection export."); return; }
  const country = practiceLocationName();
  printWindow.document.write(`<!doctype html><html lang="en"><head><title>${country} reflections</title><style>body{font:16px/1.6 system-ui;max-width:760px;margin:40px auto;padding:20px}article{break-inside:avoid;border-bottom:1px solid #ddd;padding:20px 0}p{white-space:pre-wrap}</style></head><body><h1>${country} reflections</h1><p>Private learning record · ${country} context · Exported ${new Date().toLocaleDateString("en-GB")}</p>${getCpdEntries().map((entry) => walesEntryMarkup(entry)).join("") || "<p>No saved reflections.</p>"}</body></html>`);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}
